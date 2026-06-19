const express = require('express');
const { query } = require('../db');
const { requireAdmin, flash } = require('../auth');
const { verifyPassword, hashPassword } = require('../utils/password');

const router = express.Router();

const TYPES = ['OFICINA', 'SUCURSAL', 'PANADERIA', 'VIGILANCIA', 'SIN TIPO'];
const STORE_TYPES = ['HC', 'MC'];

function boolFromBody(value) {
  return value === '1' || value === 'on' || value === 'true';
}

async function getLocationOptions() {
  return query(`
    SELECT id, branch_number, store_type, name, municipality, status
    FROM locations
    WHERE is_active = 1
    ORDER BY is_pending, municipality, name
  `);
}

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  return res.render('admin/login', { title: 'Iniciar sesión' });
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const users = await query('SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1', [username || '']);
    const user = users[0];
    if (!user || !verifyPassword(password || '', user.password_hash)) {
      flash(req, 'error', 'Usuario o contraseña incorrectos.');
      return res.redirect('/admin/login');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role
    };
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    flash(req, 'success', 'Bienvenido al panel de administración.');
    return res.redirect('/admin');
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const [extensionStats] = await query(`
      SELECT
        COUNT(*) AS total,
        SUM(type = 'OFICINA') AS offices,
        SUM(type = 'SUCURSAL') AS branches,
        SUM(is_visible = 1) AS visible
      FROM extensions
    `);
    const [locationStats] = await query(`
      SELECT
        COUNT(*) AS total,
        SUM(is_pending = 1) AS pending,
        SUM(maps_url IS NOT NULL AND maps_url <> '') AS with_maps
      FROM locations
      WHERE is_active = 1
    `);
    const recentExtensions = await query(`
      SELECT e.id, e.extension, e.display_name, e.first_name, e.last_name, e.type, l.name AS branch_name, l.maps_url
      FROM extensions e
      LEFT JOIN locations l ON l.id = e.location_id
      ORDER BY e.updated_at DESC
      LIMIT 8
    `);
    res.render('admin/dashboard', {
      title: 'Panel de administración',
      extensionStats,
      locationStats,
      recentExtensions
    });
  } catch (error) {
    next(error);
  }
});

router.get('/extensions', async (req, res, next) => {
  try {
    const search = String(req.query.q || '').trim();
    const params = [];
    let where = 'WHERE 1 = 1';
    if (search) {
      where += ` AND (
        e.extension LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.display_name LIKE ? OR
        e.office_location LIKE ? OR e.phone_model LIKE ? OR e.type LIKE ? OR l.name LIKE ? OR l.municipality LIKE ?
      )`;
      for (let i = 0; i < 9; i += 1) params.push(`%${search}%`);
    }

    const rows = await query(`
      SELECT e.*, l.name AS branch_name, l.municipality, l.maps_url
      FROM extensions e
      LEFT JOIN locations l ON l.id = e.location_id
      ${where}
      ORDER BY CAST(e.extension AS UNSIGNED), e.extension
    `, params);
    res.render('admin/extensions', { title: 'Extensiones', rows, search });
  } catch (error) {
    next(error);
  }
});

router.get('/extensions/new', async (req, res, next) => {
  try {
    res.render('admin/extension-form', {
      title: 'Nueva extensión',
      item: {},
      locations: await getLocationOptions(),
      types: TYPES,
      action: '/admin/extensions',
      formTitle: 'Nueva extensión'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/extensions', async (req, res, next) => {
  try {
    const body = req.body;
    await query(`
      INSERT INTO extensions
      (extension, first_name, last_name, display_name, office_location, phone_model, type, location_id, is_visible, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      body.extension || '',
      body.first_name || '',
      body.last_name || '',
      body.display_name || '',
      body.office_location || '',
      body.phone_model || '',
      TYPES.includes(body.type) ? body.type : 'SIN TIPO',
      body.location_id || null,
      boolFromBody(body.is_visible) ? 1 : 0,
      body.notes || null
    ]);
    flash(req, 'success', 'Extensión creada correctamente.');
    res.redirect('/admin/extensions');
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      flash(req, 'error', 'Ya existe una extensión con ese número.');
      return res.redirect('/admin/extensions/new');
    }
    next(error);
  }
});

router.get('/extensions/:id/edit', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM extensions WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows[0]) return res.status(404).render('public/error', { title: 'No encontrado', message: 'La extensión no existe.' });
    res.render('admin/extension-form', {
      title: `Editar extensión ${rows[0].extension}`,
      item: rows[0],
      locations: await getLocationOptions(),
      types: TYPES,
      action: `/admin/extensions/${rows[0].id}`,
      formTitle: `Editar extensión ${rows[0].extension}`
    });
  } catch (error) {
    next(error);
  }
});

router.post('/extensions/:id', async (req, res, next) => {
  try {
    const body = req.body;
    await query(`
      UPDATE extensions SET
        extension = ?,
        first_name = ?,
        last_name = ?,
        display_name = ?,
        office_location = ?,
        phone_model = ?,
        type = ?,
        location_id = ?,
        is_visible = ?,
        notes = ?
      WHERE id = ?
    `, [
      body.extension || '',
      body.first_name || '',
      body.last_name || '',
      body.display_name || '',
      body.office_location || '',
      body.phone_model || '',
      TYPES.includes(body.type) ? body.type : 'SIN TIPO',
      body.location_id || null,
      boolFromBody(body.is_visible) ? 1 : 0,
      body.notes || null,
      req.params.id
    ]);
    flash(req, 'success', 'Extensión actualizada.');
    res.redirect('/admin/extensions');
  } catch (error) {
    next(error);
  }
});

router.post('/extensions/:id/delete', async (req, res, next) => {
  try {
    await query('DELETE FROM extensions WHERE id = ?', [req.params.id]);
    flash(req, 'success', 'Extensión eliminada.');
    res.redirect('/admin/extensions');
  } catch (error) {
    next(error);
  }
});

router.get('/locations', async (req, res, next) => {
  try {
    const search = String(req.query.q || '').trim();
    const params = [];
    let where = 'WHERE 1 = 1';
    if (search) {
      where += ' AND (name LIKE ? OR municipality LIKE ? OR status LIKE ? OR store_type LIKE ? OR branch_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    const rows = await query(`
      SELECT l.*,
        (SELECT COUNT(*) FROM extensions e WHERE e.location_id = l.id) AS linked_extensions
      FROM locations l
      ${where}
      ORDER BY l.is_pending, l.municipality, l.name
    `, params);
    res.render('admin/locations', { title: 'Ubicaciones', rows, search });
  } catch (error) {
    next(error);
  }
});

router.get('/locations/new', (req, res) => {
  res.render('admin/location-form', {
    title: 'Nueva ubicación',
    item: {},
    storeTypes: STORE_TYPES,
    action: '/admin/locations',
    formTitle: 'Nueva ubicación'
  });
});

router.post('/locations', async (req, res, next) => {
  try {
    const body = req.body;
    await query(`
      INSERT INTO locations
      (branch_number, store_type, name, municipality, maps_url, status, is_pending, is_active, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      body.branch_number || null,
      body.store_type || 'HC',
      body.name || '',
      body.municipality || '',
      body.maps_url || null,
      body.status || 'Activa',
      boolFromBody(body.is_pending) ? 1 : 0,
      boolFromBody(body.is_active) ? 1 : 0,
      body.notes || null
    ]);
    flash(req, 'success', 'Ubicación creada correctamente.');
    res.redirect('/admin/locations');
  } catch (error) {
    next(error);
  }
});

router.get('/locations/:id/edit', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM locations WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows[0]) return res.status(404).render('public/error', { title: 'No encontrado', message: 'La ubicación no existe.' });
    res.render('admin/location-form', {
      title: `Editar ${rows[0].name}`,
      item: rows[0],
      storeTypes: STORE_TYPES,
      action: `/admin/locations/${rows[0].id}`,
      formTitle: `Editar ${rows[0].name}`
    });
  } catch (error) {
    next(error);
  }
});

router.post('/locations/:id', async (req, res, next) => {
  try {
    const body = req.body;
    await query(`
      UPDATE locations SET
        branch_number = ?,
        store_type = ?,
        name = ?,
        municipality = ?,
        maps_url = ?,
        status = ?,
        is_pending = ?,
        is_active = ?,
        notes = ?
      WHERE id = ?
    `, [
      body.branch_number || null,
      body.store_type || 'HC',
      body.name || '',
      body.municipality || '',
      body.maps_url || null,
      body.status || 'Activa',
      boolFromBody(body.is_pending) ? 1 : 0,
      boolFromBody(body.is_active) ? 1 : 0,
      body.notes || null,
      req.params.id
    ]);
    flash(req, 'success', 'Ubicación actualizada.');
    res.redirect('/admin/locations');
  } catch (error) {
    next(error);
  }
});

router.post('/locations/:id/delete', async (req, res, next) => {
  try {
    await query('DELETE FROM locations WHERE id = ?', [req.params.id]);
    flash(req, 'success', 'Ubicación eliminada. Las extensiones relacionadas quedaron sin ubicación.');
    res.redirect('/admin/locations');
  } catch (error) {
    next(error);
  }
});

router.get('/security', (req, res) => {
  res.render('admin/security', { title: 'Cambiar contraseña' });
});

router.post('/security', async (req, res, next) => {
  try {
    const { new_password, confirm_password } = req.body;
    if (!new_password || new_password.length < 6) {
      flash(req, 'error', 'La contraseña debe tener al menos 6 caracteres.');
      return res.redirect('/admin/security');
    }
    if (new_password !== confirm_password) {
      flash(req, 'error', 'Las contraseñas no coinciden.');
      return res.redirect('/admin/security');
    }
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(new_password), req.session.user.id]);
    flash(req, 'success', 'Contraseña actualizada.');
    res.redirect('/admin/security');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
