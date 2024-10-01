const express = require('express');
const { getReports } = require('../controllers/reportController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/reports', authenticateToken, getReports);

module.exports = router;
