const pool = require('../models/db');
const logger = require('../utils/logger');

exports.getReports = async (req, res) => {
  let { username, type } = req.query;

  logger.info('getReports - Request received', { username, type });

  if (!username || !type) {
    logger.warn('getReports - Missing required parameters', { username, type });
    return res.status(400).json({ error: 'Username and report type are required' });
  }

  try {
    // Convert username to lowercase for case-insensitive lookup
    username = username.toLowerCase();

    // Fetch the user_id from the users table based on the username
    logger.info('getReports - Fetching userId', { username });
    const userResult = await pool.query('SELECT user_id FROM users WHERE LOWER(username) = $1', [username]);

    if (userResult.rows.length === 0) {
      logger.warn('getReports - User not found', { username });
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].user_id;
    logger.info('getReports - User found, generating report', { username, userId, type });

    // Define the base query and parameters
    let query = '';
    let queryParams = [userId]; // First parameter is always the userId

    switch (type) {
      case 'daily':
        logger.info('getReports - Generating daily report', { userId });
        query = `
          SELECT 
            account_id,
            category,  
            SUM(amount) as total, 
            DATE_TRUNC('day', expense_date) as day 
          FROM expenses 
          WHERE user_id = $1 
            AND expense_date >= NOW() - INTERVAL '15 days' 
            AND category IS NOT NULL
          GROUP BY category, day, account_id
          ORDER BY day DESC
        `;
        break;

      case 'weekly':
        logger.info('getReports - Generating weekly report', { userId });
        query = `
          SELECT 
            account_id,
            category,  
            SUM(amount) as total, 
            DATE_TRUNC('week', expense_date) as week 
          FROM expenses 
          WHERE user_id = $1 
            AND expense_date >= NOW() - INTERVAL '12 weeks' 
            AND category IS NOT NULL
          GROUP BY category, week, account_id
          ORDER BY week DESC
        `;
        break;

      case 'monthly':
        logger.info('getReports - Generating monthly report', { userId });
        query = `
          SELECT 
            account_id,
            category,  
            SUM(amount) as total, 
            DATE_TRUNC('month', expense_date) as month 
          FROM expenses 
          WHERE user_id = $1 
            AND expense_date >= NOW() - INTERVAL '12 months' 
            AND category IS NOT NULL
          GROUP BY category, month, account_id
          ORDER BY month DESC
        `;
        break;

      default:
        logger.warn('getReports - Invalid report type', { type, username });
        return res.status(400).json({ error: 'Invalid report type' });
    }

    // Execute the query
    const results = await pool.query(query, queryParams);

    logger.info('getReports - Query executed', { userId, type, rowCount: results.rows.length });

    // If no results, return an empty array
    if (results.rows.length === 0) {
      logger.info('getReports - No data found', { userId, type });
      return res.json([]); // Return an empty array if no data is found
    }

    // Convert total from string to number for each result
    const formattedResults = results.rows.map(report => ({
      ...report,
      total: parseFloat(report.total) // Convert total to a number
    }));

    logger.info('getReports - Success', { username, userId, type, recordCount: formattedResults.length });
    // Send the formatted results as a JSON response
    res.json(formattedResults);

  } catch (err) {
    logger.error('getReports - Server error', {
      username,
      type,
      error: err.message,
      stack: err.stack
    });
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
