const express = require('express');
const { transfer } = require('../controllers/transferController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/transfer', authenticateToken, transfer);

module.exports = router;
