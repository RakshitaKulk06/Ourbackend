const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT issued by the Authentication Module.
 * Expects: Authorization: Bearer <token>
 *
 * INTEGRATION NOTE: if the real auth module signs tokens with a different
 * payload shape than { id, role }, adjust the destructuring below to match
 * (ask Shantika / Laxminarasimha for their exact payload).
 */
function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id || decoded._id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

const requireAdmin = [verifyToken, requireRole('admin')];
const requireStudent = [verifyToken, requireRole('student', 'admin')];

module.exports = { verifyToken, requireRole, requireAdmin, requireStudent };
