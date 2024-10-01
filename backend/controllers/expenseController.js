const pool = require('../models/db');
const { use } = require('../routes/authRoutes');
exports.addExpense = async (req, res) => {
  const { username, amount, category, accountId } = req.body;
  console.log(req.body);
  try {
    const userQuery = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(userQuery.rows);
    const userId = userQuery.rows[0].user_id;
    if(accountId==1){
      paymentMode='cashInHand';
    }
    else if(accountId==2){
      paymentMode='debitCardMoney';
    }
    else{
      paymentMode='creditCardMoney';
    }
    const accountQuery = await pool.query('SELECT account_id, balance FROM accounts WHERE user_id = $1 AND account_name = $2', [userId, paymentMode]);
    console.log(accountQuery.rows);
    
    if (!accountQuery.rows.length) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const account = accountQuery.rows[0];
    const currentBalance = account.balance;

    if (currentBalance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Transaction error: Insufficient balance' });
    }

    await pool.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, accountId]);

    const description = req.body.description || 'No description'; // Handle optional description
    await pool.query(
      'INSERT INTO expenses (user_id, account_id, category, amount, description, expense_date, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIMESTAMP)',
      [userId, accountId, category, amount, description]
    );

    res.status(200).json({ message: 'Expense added successfully and balance updated' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.updateExpense = async (req, res) => {
  const { user_id, expense_id, amount, category, paymentMode, prevPaymentMode, description, expense_date } = req.body;
  console.log(req.body);
  try {
    // Check if the user exists
    const userQuery = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [user_id]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userQuery.rows[0].user_id;
    let paymentModeId;
    if(paymentMode=='Cash in Hand'){
      paymentModeId=1;
    }
    else if(paymentMode=='Debit Card'){
      paymentModeId=2;
    }
    else{
      paymentModeId=3;
    }
    // Fetch account details for previous and new payment modes
    const prevAccountQuery = await pool.query('SELECT account_id, balance FROM accounts WHERE user_id = $1 AND account_id = $2', [userId, prevPaymentMode]);
    const newAccountQuery = await pool.query('SELECT account_id, balance FROM accounts WHERE user_id = $1 AND account_id = $2', [userId, paymentModeId]);

    // Ensure both accounts exist
    if (!prevAccountQuery.rows.length || !newAccountQuery.rows.length) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const prevAccount = prevAccountQuery.rows[0];
    const newAccount = newAccountQuery.rows[0];

    // If payment mode has changed, handle balance updates
    if (prevPaymentMode !== paymentMode) {
      // Update balance of previous account
      await pool.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [amount, prevAccount.account_id]);

      // Check for sufficient balance in the new account
      if (newAccount.balance < parseFloat(amount)) {
        return res.status(400).json({ message: 'Transaction error: Insufficient balance in new account' });
      }

      // Update balance of the new account
      await pool.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, newAccount.account_id]);
    }

    // Update the expense
    await pool.query(
      'UPDATE expenses SET amount = $1, category = $2, account_id = $3, expense_date = $4, description = $5 WHERE expense_id = $6 AND user_id = $7',
      [amount, category, newAccount.account_id, expense_date, description, expense_id, userId] // Added description and expense_date
    );

    res.status(200).json({ message: 'Expense updated successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
// Delete Expense Function
exports.deleteExpense = async (req, res) => {
  const { username } = req.body; // Ensure username is received in the body
  const { expenseId } = req.params;

  try {
    // Fetch user details based on the username
    const userQuery = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]); // Fetch user_id based on username
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userQuery.rows[0].user_id;

    // Fetch expense details
    const expenseQuery = await pool.query('SELECT account_id, amount FROM expenses WHERE expense_id = $1 AND user_id = $2', [expenseId, userId]);
    if (!expenseQuery.rows.length) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { account_id, amount } = expenseQuery.rows[0];

    // Update the balance of the corresponding account by adding the deleted expense amount
    await pool.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [amount, account_id]);

    // Delete the expense
    await pool.query('DELETE FROM expenses WHERE expense_id = $1', [expenseId]);

    res.status(200).json({ message: 'Expense deleted and balance updated successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetch expenses with pagination (excluding transfers)
exports.getExpenses = async (req, res) => {
  const { username } = req.user;
  const limit = parseInt(req.query.limit) || 10; // Limit to 10 if not specified
  const offset = parseInt(req.query.offset) || 0; // Start at offset 0 if not specified

  try {
    // Fetch userId using username
    const userResult = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].user_id;

    // Fetch expenses with limit and offset for pagination, excluding transfers
    // Assuming there's a 'category' column and 'Transfer' is the category used for account transfers
    const expensesResult = await pool.query(
      `SELECT * FROM expenses 
       WHERE user_id = $1 AND category is not null
       ORDER BY expense_date DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    console.log('Expenses fetched:', expensesResult.rows);
    res.status(200).json(expensesResult.rows);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
