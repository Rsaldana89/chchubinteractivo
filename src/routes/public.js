const express = require('express');
const { query } = require('../db');
const { groupDirectoryItems } = require('../utils/strings');

const router = express.Router();

const directorySelect = `
  SELECT
    e.id,
    e.extension,
    e.first_name,
    e.last_name,
    e.display_name,
    e.office_location,
    e.phone_model,
    e.type,
    e.location_id,
    l.name AS branch_name,
    l.municipality,
    l.maps_url,
    l.status AS location_status,
    l.is_pending AS location_pending
  FROM extensions e
  LEFT JOIN locations l ON l.id = e.location_id AND l.is_active = 1
  WHERE e.is_visible = 1
  ORDER BY
    CASE e.type
      WHEN 'SUCURSAL' THEN 1
      WHEN 'OFICINA' THEN 2
      WHEN 'PANADERIA' THEN 3
      WHEN 'VIGILANCIA' THEN 4
      ELSE 5
    END,
    CAST(e.extension AS UNSIGNED),
    e.extension
`;

router.get('/', (req, res) => res.redirect('/directorio'));

router.get('/directorio', async (req, res, next) => {
  try {
    const rows = await query(directorySelect);
    const sections = groupDirectoryItems(rows);
    const counts = {
      total: rows.length,
      offices: rows.filter((row) => row.type === 'OFICINA').length,
      branches: rows.filter((row) => row.type === 'SUCURSAL').length,
      first: rows.length ? Math.min(...rows.map((row) => Number(row.extension)).filter((num) => !Number.isNaN(num))) : null,
      last: rows.length ? Math.max(...rows.map((row) => Number(row.extension)).filter((num) => !Number.isNaN(num))) : null
    };
    res.render('public/directorio', {
      title: 'Directorio de Extensiones CHC',
      rows,
      sections,
      counts,
      directoryJson: JSON.stringify(rows).replace(/</g, '\\u003c')
    });
  } catch (error) {
    next(error);
  }
});

router.get('/ubicaciones', async (req, res, next) => {
  try {
    const locations = await query(`
      SELECT id, branch_number, store_type, name, municipality, maps_url, status, is_pending
      FROM locations
      WHERE is_active = 1
      ORDER BY
        CASE WHEN municipality = 'Querétaro' THEN 0 ELSE 1 END,
        municipality,
        is_pending,
        name
    `);
    res.render('public/ubicaciones', {
      title: 'Ubicaciones CHC',
      locations,
      locationsJson: JSON.stringify(locations).replace(/</g, '\\u003c')
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
