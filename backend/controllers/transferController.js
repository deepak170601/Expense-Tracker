const pool = require('../models/db');
const logger = require('../utils/logger');

exports.transfer = async (req, res) => {
    const { userId } = req.user;
    const { fromAccountId, toAccountId, amount } = req.body;
  
    logger.info('transfer - Request received', { userId, fromAccountId, toAccountId, amount });

    try {
      logger.info('transfer - Starting transaction', { userId });
      await pool.query('BEGIN');

      logger.info('transfer - Deducting from source account', { fromAccountId, amount });
      await pool.query(
        'UPDATE payment_modes SET balance = balance - $1 WHERE id = $2 AND user_id = $3',
        [amount, fromAccountId, userId]
      );

      logger.info('transfer - Adding to destination account', { toAccountId, amount });
      await pool.query(
        'UPDATE payment_modes SET balance = balance + $1 WHERE id = $2 AND user_id = $3',
        [amount, toAccountId, userId]
      );

      await pool.query('COMMIT');
      logger.info('transfer - Success', { userId, fromAccountId, toAccountId, amount });
      res.status(200).json({ message: 'Transfer completed' });
    } catch (err) {
      await pool.query('ROLLBACK');
      logger.error('transfer - Server error', {
        userId,
        fromAccountId,
        toAccountId,
        amount,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({ error: 'Server error' });
    }
  };
