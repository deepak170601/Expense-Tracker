exports.transfer = async (req, res) => {
    const { userId } = req.user;
    const { fromAccountId, toAccountId, amount } = req.body;
  
    try {
      await pool.query('BEGIN');
      await pool.query(
        'UPDATE payment_modes SET balance = balance - $1 WHERE id = $2 AND user_id = $3',
        [amount, fromAccountId, userId]
      );
      await pool.query(
        'UPDATE payment_modes SET balance = balance + $1 WHERE id = $2 AND user_id = $3',
        [amount, toAccountId, userId]
      );
      await pool.query('COMMIT');
      res.status(200).json({ message: 'Transfer completed' });
    } catch (err) {
      await pool.query('ROLLBACK');
      res.status(500).json({ error: 'Server error' });
    }
  };
  