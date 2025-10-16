const pool = require('./db');

const createTables = async () => {
  try {
    console.log('Checking and creating database tables if they do not exist...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table ready');

    // Create accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        account_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (account_id, user_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `);
    console.log('✓ Accounts table ready');

    // Create expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        expense_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        category VARCHAR(255),
        amount DECIMAL(15, 2) NOT NULL,
        description TEXT,
        expense_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `);
    console.log('✓ Expenses table ready');

    // Create indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
    `);
    console.log('✓ Database indexes ready');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

module.exports = createTables;

