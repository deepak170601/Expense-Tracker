// routes/accountRoutes.js
const express = require('express');
const {
  getAccountBalances,
  addMoney,
  transferMoney
} = require('../controllers/accountController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

// Define the route for getting account balances
router.get('/balances', authenticateToken, getAccountBalances);

// Define the route for adding money
router.post('/add', authenticateToken, addMoney);

// Define the route for transferring money
router.post('/transfer', authenticateToken, transferMoney);

module.exports = router;
