const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and attach user payload to req.user
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medislot_super_secret_jwt_key_2026');
    req.user = decoded; // { id, name, email, role, doctor_id }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Middleware to restrict access based on user role(s)
 * @param {string | string[]} roles Allowed role or array of roles
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] role(s).`,
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
};
