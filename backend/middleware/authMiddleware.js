// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

function authenticateToken(req, res, next) {
  logger.info('authenticateToken - Authenticating request', {
    method: req.method,
    url: req.url
  });

  // Retrieve the authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token

  if (token == null) {
    logger.warn('authenticateToken - No token provided', {
      method: req.method,
      url: req.url
    });
    return res.sendStatus(401); // If there's no token, return 401 Unauthorized
  }

  logger.info('authenticateToken - Token found, verifying');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.error('authenticateToken - Token verification failed', {
        error: err.message,
        method: req.method,
        url: req.url
      });
      console.error('Token verification failed:', err);
      return res.sendStatus(403); // Forbidden
    }

    logger.info('authenticateToken - Token verified successfully', {
      userId: user.id,
      username: user.username
    });
    req.user = user; // Attach user information to the request
    next(); // Proceed to the next middleware or route handler
  });
}

module.exports = authenticateToken;
