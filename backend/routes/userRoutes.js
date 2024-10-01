const express = require('express');
const {getBalance} = require('../controllers/userController');
const router = express.Router();
router.get('/balances', getBalance);
module.exports = router;