
const jwt = require('jsonwebtoken');

exports.authenticateJWT = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'falta token' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload.id, payload.role
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invaku' });
  }
};

exports.authorizeRole = (requiredRole) => (req, res, next) => {
  if (req.user.role !== requiredRole) {
    return res.status(403).json({ message: 'Falta Permission' });
  }
  next();
};
