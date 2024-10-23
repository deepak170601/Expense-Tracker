const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg'); // PostgreSQL client
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const transferRoutes = require('./routes/transferRoutes');
const reportRoutes = require('./routes/reportRoutes');
const accountRoutes = require('./routes/accountRoutes');
const userRoutes = require('./routes/userRoutes');
dotenv.config(); // Load environment variables from .env

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Check PostgreSQL connection
pool.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
  } else {
    console.log('Database connected successfully');
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/user', userRoutes);

// Test Route 1: GET request to test if the server is running
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'Backend is running successfully!',
  });
});

// Test Route 2: POST request to test sending data to the backend
app.post('/api/test', (req, res) => {
  const { testField } = req.body; // Extract data from the request body
  if (testField) {
    res.status(200).json({
      message: 'Data received successfully!',
      receivedData: testField,
    });
  } else {
    res.status(400).json({
      message: 'No data received!',
    });
  }
});

// Server listening on port defined in .env or fallback to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = pool; // Export pool for use in other files (if needed)
