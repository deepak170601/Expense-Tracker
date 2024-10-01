const pool = require('../models/db');

exports.getReports = async (req, res) => {
  const { userId } = req.user;
  const { type, startDate, endDate } = req.query;

  let query = '';
  switch (type) {
    case 'daily':
      query = 'SELECT category_id, SUM(amount) as total FROM expenses WHERE user_id = $1 AND date = $2 GROUP BY category_id';
      break;
    case 'weekly':
      query = 'SELECT category_id, SUM(amount) as total FROM expenses WHERE user_id = $1 AND date BETWEEN $2 AND $3 GROUP BY category_id';
      break;
    case 'monthly':
      query = 'SELECT category_id, SUM(amount) as total FROM expenses WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 GROUP BY category_id';
      break;
    default:
      return res.status(400).json({ error: 'Invalid report type' });
  }

  try {
    const results = await pool.query(query, [userId, startDate, endDate]);
    res.json(results.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
