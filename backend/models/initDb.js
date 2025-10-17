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

    // Create accounts table with proper structure
    // account_id represents the account type: 1=Cash in Hand, 2=Debit Card, 3=Credit Card
    // Each user can have multiple account types
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        user_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, account_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CHECK (account_id IN (1, 2, 3)),
        CHECK (balance >= 0)
      );
    `);
    console.log('✓ Accounts table ready');

    // Create expenses table
    // This tracks all financial transactions including expenses, money additions, and transfers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        expense_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        category VARCHAR(255),
        amount DECIMAL(15, 2) NOT NULL,
        description TEXT,
        expense_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id, account_id) REFERENCES accounts(user_id, account_id) ON DELETE CASCADE,
        CHECK (amount > 0)
      );
    `);
    console.log('✓ Expenses table ready');

    // Create indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id
      ON accounts(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_user_id
      ON expenses(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_user_account
      ON expenses(user_id, account_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_date
      ON expenses(expense_date DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_category
      ON expenses(category) WHERE category IS NOT NULL;
    `);

    console.log('✓ Database indexes ready');

    // Create trigger to update updated_at timestamp on accounts
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
    `);

    await pool.query(`
      CREATE TRIGGER update_accounts_updated_at
      BEFORE UPDATE ON accounts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✓ Database triggers ready');

    console.log('✅ Database initialization completed successfully!');
    console.log('');
    console.log('📊 Database Schema:');
    console.log('   • users: Stores user authentication data');
    console.log('   • accounts: Stores user account balances (1=Cash, 2=Debit, 3=Credit)');
    console.log('   • expenses: Stores all transactions (expenses, additions, transfers)');
    console.log('');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

module.exports = createTables;
