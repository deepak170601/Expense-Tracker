const pool = require('../models/db');
const { use } = require('../routes/authRoutes');
const logger = require('../utils/logger');

exports.addExpense = async (req, res) => {
  let { username, amount, category, accountId } = req.body;

  logger.info('addExpense - Request received', { username, amount, category, accountId });

  try {
    // Convert username to lowercase for case-insensitive lookup
    username = username.toLowerCase();

    logger.info('addExpense - Fetching user from database', { username });
    const userQuery = await pool.query('SELECT user_id FROM users WHERE LOWER(username) = $1', [username]);
    if (userQuery.rows.length === 0) {
      logger.warn('addExpense - User not found', { username });
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = userQuery.rows[0].user_id;
    logger.info('addExpense - User found', { username, userId });

    let paymentMode;
    if(accountId==1){
      paymentMode='cashInHand';
    }
    else if(accountId==2){
      paymentMode='debitCardMoney';
    }
    else{
      paymentMode='creditCardMoney';
    }

    logger.info('addExpense - Checking account balance', { userId, paymentMode, accountId });
    const accountQuery = await pool.query('SELECT account_id, balance FROM accounts WHERE user_id = $1 AND account_name = $2', [userId, paymentMode]);
    
    if (!accountQuery.rows.length) {
      logger.warn('addExpense - Account not found', { userId, paymentMode, accountId });
      return res.status(404).json({ message: 'Account not found' });
    }

    const account = accountQuery.rows[0];
    const currentBalance = account.balance;

    logger.info('addExpense - Current balance checked', {
      accountId,
      currentBalance,
      expenseAmount: amount
    });

    if (currentBalance < parseFloat(amount)) {
      logger.warn('addExpense - Insufficient balance', {
        accountId,
        currentBalance,
        requiredAmount: amount
      });
      return res.status(400).json({ message: 'Transaction error: Insufficient balance' });
    }

    logger.info('addExpense - Updating account balance', { accountId, amount });
    await pool.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, accountId]);

    const description = req.body.description || 'No description'; // Handle optional description

    logger.info('addExpense - Recording expense', { userId, accountId, category, amount, description });
    await pool.query(
      'INSERT INTO expenses (user_id, account_id, category, amount, description, expense_date, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIMESTAMP)',
      [userId, accountId, category, amount, description]
    );

    logger.info('addExpense - Success', { username, userId, accountId, amount, category });
    res.status(200).json({ message: 'Expense added successfully and balance updated' });
  } catch (error) {
    logger.error('addExpense - Server error', {
      username,
      amount,
      category,
      accountId,
      error: error.message,
      stack: error.stack
    });
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateExpense = async (req, res) => {
  logger.info('updateExpense - Request body', req.body);
  let { username, expense_id, expenseId, amount, category, accountId, prevAccountId, description, expense_date } = req.body;

  // Handle both expenseId and expense_id for compatibility
  const finalExpenseId = expenseId || expense_id;

  logger.info('updateExpense - Request received', {
    username,
    expenseId: finalExpenseId,
    amount,
    category,
    accountId,
    prevAccountId
  });

  try {
    // Convert username to lowercase for case-insensitive lookup
    username = username.toLowerCase();

    // Check if the user exists
    logger.info('updateExpense - Fetching user from database', { username });
    const userQuery = await pool.query('SELECT user_id FROM users WHERE LOWER(username) = $1', [username]);
    if (userQuery.rows.length === 0) {
      logger.warn('updateExpense - User not found', { username });
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userQuery.rows[0].user_id;
    logger.info('updateExpense - User found', { userId });

    logger.info('updateExpense - Fetching account details', {
      userId,
      prevAccountId,
      accountId
    });

    // Fetch the current expense to get the old amount
    const currentExpenseQuery = await pool.query(
      'SELECT amount, account_id FROM expenses WHERE expense_id = $1 AND user_id = $2',
      [finalExpenseId, userId]
    );

    if (!currentExpenseQuery.rows.length) {
      logger.warn('updateExpense - Expense not found', { expenseId: finalExpenseId, userId });
      return res.status(404).json({ message: 'Expense not found' });
    }

    const oldAmount = currentExpenseQuery.rows[0].amount;
    const oldAccountId = currentExpenseQuery.rows[0].account_id;

    logger.info('updateExpense - Current expense details', {
      oldAmount,
      oldAccountId,
      newAmount: amount,
      newAccountId: accountId
    });

    // Fetch account details for previous and new payment modes
    const prevAccountQuery = await pool.query('SELECT account_id, balance FROM accounts WHERE user_id = $1 AND account_id = $2', [userId, prevAccountId]);
    const newAccountQuery = await pool.query('SELECT account_id, balance FROM accounts WHERE user_id = $1 AND account_id = $2', [userId, accountId]);

    // Ensure both accounts exist
    if (!prevAccountQuery.rows.length || !newAccountQuery.rows.length) {
      logger.warn('updateExpense - Account not found', {
        userId,
        prevAccountFound: prevAccountQuery.rows.length > 0,
        newAccountFound: newAccountQuery.rows.length > 0
      });
      return res.status(404).json({ message: 'Account not found' });
    }

    const prevAccount = prevAccountQuery.rows[0];
    const newAccount = newAccountQuery.rows[0];

    // If payment mode has changed, handle balance updates
    if (prevAccountId !== accountId) {
      logger.info('updateExpense - Payment mode changed, updating balances', {
        prevAccountId: prevAccount.account_id,
        newAccountId: newAccount.account_id
      });

      // Restore balance to previous account (add old amount back)
      await pool.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [oldAmount, prevAccount.account_id]);

      // Check for sufficient balance in the new account
      if (newAccount.balance < parseFloat(amount)) {
        logger.warn('updateExpense - Insufficient balance in new account', {
          newAccountId: newAccount.account_id,
          balance: newAccount.balance,
          requiredAmount: amount
        });
        // Rollback the previous account update
        await pool.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [oldAmount, prevAccount.account_id]);
        return res.status(400).json({ message: 'Transaction error: Insufficient balance in new account' });
      }

      // Deduct from the new account
      await pool.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, newAccount.account_id]);
    } else {
      // Same account but amount changed
      const amountDifference = parseFloat(amount) - parseFloat(oldAmount);

      if (amountDifference > 0) {
        // New amount is higher, need to deduct more
        if (newAccount.balance < amountDifference) {
          logger.warn('updateExpense - Insufficient balance for amount increase', {
            accountId: newAccount.account_id,
            balance: newAccount.balance,
            requiredAmount: amountDifference
          });
          return res.status(400).json({ message: 'Transaction error: Insufficient balance for increased amount' });
        }
        await pool.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amountDifference, accountId]);
      } else if (amountDifference < 0) {
        // New amount is lower, need to refund the difference
        await pool.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [Math.abs(amountDifference), accountId]);
      }
      // If amountDifference is 0, no balance update needed
    }

    logger.info('updateExpense - Updating expense record', { expenseId: finalExpenseId, userId });
    // Update the expense
    const updateQuery = expense_date
      ? 'UPDATE expenses SET amount = $1, category = $2, account_id = $3, expense_date = $4, description = $5 WHERE expense_id = $6 AND user_id = $7'
      : 'UPDATE expenses SET amount = $1, category = $2, account_id = $3, description = $4 WHERE expense_id = $5 AND user_id = $6';

    const updateParams = expense_date
      ? [amount, category, accountId, expense_date, description, finalExpenseId, userId]
      : [amount, category, accountId, description, finalExpenseId, userId];

    await pool.query(updateQuery, updateParams);

    logger.info('updateExpense - Success', { expenseId: finalExpenseId, userId, amount, category });
    res.status(200).json({ message: 'Expense updated successfully' });
  } catch (error) {
    logger.error('updateExpense - Server error', {
      username,
      expenseId: finalExpenseId,
      error: error.message,
      stack: error.stack
    });
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Expense Function
exports.deleteExpense = async (req, res) => {
  const { expenseId } = req.params;
  let { username } = req.user;

  logger.info('deleteExpense - Request received', { username, expenseId });

  try {
    // Convert username to lowercase for case-insensitive lookup
    username = username.toLowerCase();

    const userQuery = await pool.query('SELECT user_id FROM users WHERE LOWER(username) = $1', [username]);
    if (userQuery.rows.length === 0) {
      logger.warn('deleteExpense - User not found', { username });
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userQuery.rows[0].user_id;
    logger.info('deleteExpense - User found, fetching expense details', { username, userId, expenseId });

    // Fetch expense details
    const expenseQuery = await pool.query('SELECT account_id, amount FROM expenses WHERE expense_id = $1 AND user_id = $2', [expenseId, userId]);
    if (!expenseQuery.rows.length) {
      logger.warn('deleteExpense - Expense not found', { expenseId, userId });
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { account_id, amount } = expenseQuery.rows[0];
    logger.info('deleteExpense - Expense found, updating account balance', {
      expenseId,
      account_id,
      amount
    });

    // Update the balance of the corresponding account by adding the deleted expense amount
    await pool.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [amount, account_id]);

    logger.info('deleteExpense - Deleting expense record', { expenseId });
    // Delete the expense
    await pool.query('DELETE FROM expenses WHERE expense_id = $1', [expenseId]);

    logger.info('deleteExpense - Success', { username, userId, expenseId, amount });
    res.status(200).json({ message: 'Expense deleted and balance updated successfully' });
  } catch (error) {
    logger.error('deleteExpense - Server error', {
      username,
      expenseId,
      error: error.message,
      stack: error.stack
    });
    console.error('Error deleting expense:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetch expenses with pagination (excluding transfers)
exports.getExpenses = async (req, res) => {
  let { username } = req.user;
  const limit = parseInt(req.query.limit) || 10; // Limit to 10 if not specified
  const offset = parseInt(req.query.offset) || 0; // Start at offset 0 if not specified

  logger.info('getExpenses - Request received', { username, limit, offset });

  try {
    // Convert username to lowercase for case-insensitive lookup
    username = username.toLowerCase();

    // Fetch userId using username
    logger.info('getExpenses - Fetching userId', { username });
    const userResult = await pool.query('SELECT user_id FROM users WHERE LOWER(username) = $1', [username]);

    if (userResult.rows.length === 0) {
      logger.warn('getExpenses - User not found', { username });
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
    res.status(200).json(expensesResult.rows);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
