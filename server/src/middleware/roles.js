export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: 'Unauthenticated' });
    if (!roles.includes(role) && role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}
