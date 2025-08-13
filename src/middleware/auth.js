export function requireAuth(req, res, next) {
  if (req.session?.userId) return next();
  return res.redirect('/login');
}

export function attachUser(req, res, next) {
  res.locals.isAuth = Boolean(req.session?.userId);
  try {
    res.locals.csrfToken = req.csrfToken();
  } catch {
    res.locals.csrfToken = '';
  }
  next();
}