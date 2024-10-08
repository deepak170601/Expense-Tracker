const pool = require('../models/db');

exports.getReports = async (req, res) => {
  const { username, type } = req.query; // Extract username and report type from query params
  console.log(username, type);
  
  if (!username || !type) {
    return res.status(400).json({ error: 'Username and report type are required' });
  }

  try {
    // Fetch the user_id from the users table based on the username
    const userResult = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);
    
    // If the user is not found, return an error
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].user_id; // Extract user_id

    // Define the query based on the report type
    let query = '';
    let queryParams = [userId]; // First parameter is always the userId
    console.log(userId);
    
    switch (type) {
      case 'daily':
        query = `
          SELECT 
            account_id,
            category,  
            SUM(amount) as total, 
            DATE_TRUNC('day', expense_date) as day 
          FROM expenses 
          WHERE user_id = $1 
            AND expense_date >= NOW() - INTERVAL '10 days' and category is not null
          GROUP BY category, day ,account_id
          ORDER BY day DESC
        `;
        break;

      case 'weekly':
        query = `
          SELECT 
            account_id,
            category,  
            SUM(amount) as total, 
            DATE_TRUNC('week', expense_date) as week 
          FROM expenses 
          WHERE user_id = $1 
            AND expense_date >= NOW() - INTERVAL '8 weeks' and category is not null
          GROUP BY category, week ,account_id
          ORDER BY week DESC
        `;
        break;

      case 'monthly':
        query = `
          SELECT 
            account_id,
            category,  
            SUM(amount) as total, 
            DATE_TRUNC('month', expense_date) as month 
          FROM expenses 
          WHERE user_id = $1 
            AND expense_date >= NOW() - INTERVAL '12 months' and category is not null
          GROUP BY category, month ,account_id
          ORDER BY month DESC
        `;
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    // Execute the query and return the result
    const results = await pool.query(query, queryParams);

    // If there are no results, return an empty array
    if (results.rows.length === 0) {
      return res.json([]); // Return an empty array if no data is found
    }

    // Convert total from string to number for each result
    const formattedResults = results.rows.map(report => ({
      ...report,
      total: parseFloat(report.total) // Convert total to a number
    }));

    // Send the formatted results as a JSON response
    res.json(formattedResults);

  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
};