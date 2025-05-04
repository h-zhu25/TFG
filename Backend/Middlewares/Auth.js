// Backend/Middlewares/Auth.js
const jwt = require('jsonwebtoken');

/**
 * Verifies the presence and validity of a JWT in the Authorization header.
 * If valid, attaches `req.user = { id, role }`.
 */
exports.authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Role-based authorization middleware.
 * Pass in one or more allowed roles, e.g. authorizeRole('student', 'teacher', 'admin').
 * If `req.user.role` is not in the list, responds with 403.
 */
exports.authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
};
