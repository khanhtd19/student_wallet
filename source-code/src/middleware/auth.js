function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error:'UNAUTHORIZED', message:'Vui lòng đăng nhập để tiếp tục.' });
  req.session.returnTo = req.originalUrl;
  return res.redirect('/login');
}
function attachUser(req, res, next) {
  res.locals.currentUser = req.session?.user || null;
  res.locals.currentPath = req.path;
  res.locals.flash = req.session?.flash || null;
  delete req.session?.flash;
  next();
}
function flash(req, type, message) { req.session.flash = { type, message }; }
module.exports = { requireAuth, attachUser, flash };
