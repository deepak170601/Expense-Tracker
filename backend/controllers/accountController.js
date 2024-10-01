const pool = require('../models/db');
// Get account balances
exports.getAccountBalances = async (req, res) => {
  const { username } = req.user; // Get username from the authenticated user

  try {
    // Fetch userId using username
    const userResult = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].user_id;

    // Fetch account balances for the user
    const result = await pool.query(
      'SELECT account_id, account_name, balance, created_at FROM accounts WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // If no accounts exist for the user, return an empty array
      return res.status(200).json([]);
    }

    // Map the results to a structured response
    const accountBalances = result.rows.map(account => ({
      accountId: account.account_id,
      accountName: account.account_name,
      balance: account.balance,
      createdAt: account.created_at, // Consider formatting if needed
    }));

    res.status(200).json(accountBalances); // Respond with account balances
  } catch (err) {
    console.error('Error fetching account balances:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
// Add money to an account (with check for existing account or create a new one)
// Add money to an account (with check for existing account or create a new one)
exports.addMoney = async (req, res) => {
  const { username } = req.user; // Get username from the authenticated user
  const { accountId, amount, accountName } = req.body; // Get accountId, amount, and accountName from request body

  try {
    // Fetch userId using username
    const userResult = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].user_id;
console.log(accountId, amount, accountName, userId);
    // Check if account exists for the user by account_id
    const accountResult = await pool.query(
      'SELECT balance FROM accounts WHERE user_id = $1 AND account_id = $2',
      [userId, accountId]
    );

    if (accountResult.rows.length > 0) {
      // Account exists, so update the balance
      await pool.query(
        'UPDATE accounts SET balance = balance + $1 WHERE account_id = $2 AND user_id = $3',
        [amount, accountId, userId]
      );
    } else {
      // Account doesn't exist, so create a new one
      const createdAt = new Date(); // Get current timestamp
      const initialBalance = amount; // Starting balance is the amount being added

      await pool.query(
        'INSERT INTO accounts (account_id,user_id, account_name, balance, created_at) VALUES ($1, $2, $3, $4,$5)',
        [accountId,userId, accountName, initialBalance, createdAt]
      );
    }

    // Insert the transaction into the expenses table for tracking purposes
    const timestamp = new Date(); // Current timestamp
    await pool.query(
      'INSERT INTO expenses (user_id, account_id, amount, expense_date, description) VALUES ($1, $2, $3, $4, $5)',
      [userId, accountId, amount, timestamp, 'Added Money']
    );

    res.status(200).json({ message: 'Money added successfully' });
  } catch (err) {
    console.error('Error adding money:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
// Transfer money between accounts
exports.transferMoney = async (req, res) => {
  const { username } = req.user; // Get username from the authenticated user
  const { fromAccountId, toAccountId, amount } = req.body;

  try {
    // Fetch userId using username
    const userResult = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].user_id;

    await pool.query('BEGIN'); // Start transaction

    // Check if the from account has enough balance
    const fromAccountResult = await pool.query(
      'SELECT balance FROM accounts WHERE account_id = $1 AND user_id = $2',
      [fromAccountId, userId]
    );

    if (fromAccountResult.rows.length === 0) {
      await pool.query('ROLLBACK'); // Rollback transaction
      return res.status(404).json({ error: 'From account not found' });
    }

    const fromAccountBalance = fromAccountResult.rows[0].balance;
    if (fromAccountBalance < amount) {
      await pool.query('ROLLBACK'); // Rollback transaction
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Deduct the amount from the fromAccount
    await pool.query(
      'UPDATE accounts SET balance = balance - $1 WHERE account_id = $2 AND user_id = $3',
      [amount, fromAccountId, userId]
    );

    // Check if the toAccount exists, if not create it
    const toAccountResult = await pool.query(
      'SELECT balance FROM accounts WHERE account_id = $1 AND user_id = $2',
      [toAccountId, userId]
    );

    if (toAccountResult.rows.length === 0) {
      // If the to account does not exist, create it with a balance of 0
      await pool.query(
        'INSERT INTO accounts (user_id, account_id, balance, account_name, created_at) VALUES ($1, $2, $3, $4, $5)',
        [userId, toAccountId, 0, 'New Account', new Date()]
      );
    }

    // Add the amount to the toAccount
    await pool.query(
      'UPDATE accounts SET balance = balance + $1 WHERE account_id = $2 AND user_id = $3',
      [amount, toAccountId, userId]
    );

    // Log the transfer into the expenses table
    const timestamp = new Date(); // Current timestamp
    await pool.query(
      'INSERT INTO expenses (user_id, account_id, amount, expense_date, description) VALUES ($1, $2, $3, $4, $5)',
      [userId, fromAccountId, amount, timestamp, 'Transfer Out']
    );
    await pool.query(
      'INSERT INTO expenses (user_id, account_id, amount, expense_date, description) VALUES ($1, $2, $3, $4, $5)',
      [userId, toAccountId, amount, timestamp, 'Transfer In']
    );

    await pool.query('COMMIT'); // Commit transaction

    res.status(200).json({ message: 'Transfer completed successfully' });
  } catch (err) {
    await pool.query('ROLLBACK'); // Rollback transaction on error
    console.error('Error during transfer:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
