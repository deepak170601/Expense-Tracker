const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg'); // PostgreSQL client
const initDb = require('./models/initDb'); // Import database initialization
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const transferRoutes = require('./routes/transferRoutes');
const reportRoutes = require('./routes/reportRoutes');
const accountRoutes = require('./routes/accountRoutes');
const userRoutes = require('./routes/userRoutes');
const logger = require('./utils/logger');

dotenv.config(); // Load environment variables from .env

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming Request', {
    method: req.method,
    url: req.url,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    logger.info('Outgoing Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
    originalSend.call(this, data);
  };

  next();
});

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Check PostgreSQL connection and initialize database
pool.connect(async (err) => {
  if (err) {
    logger.error('Database connection failed', { error: err.stack });
    console.error('Database connection failed:', err.stack);
  } else {
    logger.info('Database connected successfully');
    console.log('Database connected successfully');
    // Initialize database tables
    try {
      await initDb();
      logger.info('Database tables initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database tables', { error: error.message, stack: error.stack });
      console.error('Failed to initialize database tables:', error);
    }
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/user', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled Error', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack
  });
  res.status(500).json({ message: 'Internal Server Error' });
});

// Server listening on port defined in .env or fallback to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

module.exports = pool; // Export pool for use in other files (if needed)
