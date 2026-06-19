function attachAuthLocals(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  req.session.flash = { type: 'error', message: 'Inicia sesión para entrar al panel.' };
  return res.redirect('/admin/login');
}

function flash(req, type, message) {
  req.session.flash = { type, message };
}

module.exports = { attachAuthLocals, requireAdmin, flash };
