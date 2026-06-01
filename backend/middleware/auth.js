const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'codelink-secret-key-change-in-production';

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication is required' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  JWT_SECRET,
  verifyToken
};
