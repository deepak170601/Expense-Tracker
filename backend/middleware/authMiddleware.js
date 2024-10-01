// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Retrieve the authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1]; // Extract toke
  console.log("==========================================================")

  console.log(token);
  if (token == null) return res.sendStatus(401); // If there's no token, return 401 Unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err);
      return res.sendStatus(403); // Forbidden
    }

    req.user = user; // Attach user information to the request
    next(); // Proceed to the next middleware or route handler
  });
}

module.exports = authenticateToken;
