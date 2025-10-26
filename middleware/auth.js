const jwt = require('jsonwebtoken');

/**
 * Express middleware to authenticate requests using JWT in the
 * Authorization: Bearer <token> header.
 *
 * Expects tokens created with payload containing `userId` (string).
 * Sets `req.user = payload` on success.
 */
function authenticateToken(req, res, next) { //todo, actually implement this function forrealsies
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const secret = process.env.JWT_SECRET || 'replace_this_with_strong_secret';
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload; // e.g. { userId: '...', email: '...' }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authenticateToken;
