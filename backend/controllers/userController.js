const pool = require('../models/db');
const logger = require('../utils/logger');

// Fetch user balance for a specific account
exports.getBalance= async (req, res) => {
    let { username, account_id } = req.query;

    logger.info('getBalance - Request received', { username, account_id });

    try {
      // Validate input parameters
      if (!username || !account_id) {
        logger.warn('getBalance - Missing required parameters', { username, account_id });
        return res.status(400).json({ message: 'Username and account_id are required' });
      }

      // Convert username to lowercase for case-insensitive lookup
      username = username.toLowerCase();

      logger.info('getBalance - Querying user from database', { username });
      const userQuery = await pool.query('SELECT user_id FROM users WHERE LOWER(username) = $1', [username]);

      if (userQuery.rows.length === 0) {
        logger.warn('getBalance - User not found', { username });
        return res.status(404).json({ message: 'User not found' });
      }
  
      const userId = userQuery.rows[0].user_id;
      logger.info('getBalance - User found', { username, userId });

      // Convert account_id to integer since query params are strings
      const accountIdInt = parseInt(account_id, 10);

      if (isNaN(accountIdInt)) {
        logger.warn('getBalance - Invalid account_id format', { account_id });
        return res.status(400).json({ message: 'Invalid account_id format' });
      }

      logger.info('getBalance - Querying account balance', { userId, accountIdInt });
      const balanceQuery = await pool.query(
        'SELECT balance FROM accounts WHERE user_id = $1 AND account_id = $2',
        [userId, accountIdInt]
      );
  
      if (balanceQuery.rows.length === 0) {
        logger.warn('getBalance - Account not found', { userId, accountIdInt });
        return res.status(404).json({ message: 'Account not found' });
      }
  
      const balance = balanceQuery.rows[0].balance;
      logger.info('getBalance - Success', { username, accountIdInt, balance });
      res.json({ balance });
    } catch (error) {
      logger.error('getBalance - Server error', {
        username,
        account_id,
        error: error.message,
        stack: error.stack
      });
      console.error(error.message);
      res.status(500).json({ message: 'Server error' });
    }
  };
