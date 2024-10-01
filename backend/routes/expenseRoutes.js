const express = require('express');
const { addExpense, updateExpense, deleteExpense,getExpenses } = require('../controllers/expenseController'); // Ensure all necessary controllers are imported
const authenticateToken = require('../middleware/authMiddleware'); // Middleware for authentication
const router = express.Router();

// Add a new expense
router.post('/add', authenticateToken, addExpense);

// Update an existing expense
router.put('/update', authenticateToken, updateExpense);

// Delete an expense by ID
router.delete('/delete/:expenseId', authenticateToken, deleteExpense);

router.get('/get', authenticateToken, getExpenses);
module.exports = router;
