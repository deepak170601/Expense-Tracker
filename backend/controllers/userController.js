const pool = require('../models/db');

// Fetch user balance for a specific account
exports.getBalance= async (req, res) => {
    const { username, account_id } = req.query;
  
    try {
      const userQuery = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);
      if (userQuery.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const userId = userQuery.rows[0].user_id;
      const balanceQuery = await pool.query(
        'SELECT balance FROM accounts WHERE user_id = $1 AND account_id = $2',
        [userId, account_id]
      );
  
      if (balanceQuery.rows.length === 0) {
        return res.status(404).json({ message: 'Account not found' });
      }
  
      const balance = balanceQuery.rows[0].balance;
      res.json({ balance });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: 'Server error' });
    }
  };
  