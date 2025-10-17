const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/db.js'); // Assuming you have a PostgreSQL connection pool
const logger = require('../utils/logger');

// Register user
exports.register = async (req, res) => {
  let { username, email, password } = req.body;

  logger.info('register - Request received', { username, email });

  try {
    // Ensure required fields are provided
    if (!username || !email || !password) {
      logger.warn('register - Missing required fields', { username, email, hasPassword: !!password });
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Convert username and email to lowercase for case-insensitive registration
    username = username.toLowerCase();
    email = email.toLowerCase();

    logger.info('register - Checking if email exists', { email });
    // Check if the user already exists (by email or username)
    let userExists = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
    if (userExists.rows.length > 0) {
      logger.warn('register - Email already in use', { email });
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    logger.info('register - Checking if username exists', { username });
    userExists = await pool.query('SELECT * FROM users WHERE LOWER(username) = $1', [username]);
    if (userExists.rows.length > 0) {
      logger.warn('register - Username already in use', { username });
      return res.status(400).json({ message: 'Username already in use' });
    }

    logger.info('register - Hashing password');
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    logger.info('register - Inserting new user into database', { username, email });
    // Insert new user into the database
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );

    logger.info('register - User registered successfully', {
      username,
      email,
      userId: newUser.rows[0].user_id
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0],
    });
  } catch (err) {
    logger.error('register - Server error', {
      username,
      email,
      error: err.message,
      stack: err.stack
    });
    console.error(err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Login user and generate JWT token
exports.login = async (req, res) => {
  let { username, password } = req.body;

  logger.info('login - Request received', { username });

  try {
    // Convert username to lowercase for case-insensitive login
    username = username.toLowerCase();

    logger.info('login - Querying user from database', { username });
    const user = await pool.query('SELECT * FROM users WHERE LOWER(username) = $1', [username]);

    if (user.rows.length === 0) {
      logger.warn('login - User not found', { username });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    logger.info('login - User found, verifying password', { username, userId: user.rows[0].user_id });
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      logger.warn('login - Invalid password', { username });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    logger.info('login - Password verified, generating JWT token', { username });
    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, username: user.rows[0].username },  // Payload
      process.env.JWT_SECRET,  // Secret key from environment variable
      { expiresIn: '7h' }      // Token expiration
    );

    logger.info('login - Login successful', { username, userId: user.rows[0].user_id });
    // Send the token to the client
    res.json({ token });
  } catch (err) {
    logger.error('login - Server error', {
      username,
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: 'Server error' });
  }
};
