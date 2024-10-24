const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/db.js'); // Assuming you have a PostgreSQL connection pool

// Register user
exports.register = async (req, res) => {
  let { username, email, password } = req.body;
  try {
    // Ensure required fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Convert username and email to lowercase for case-insensitive registration
    username = username.toLowerCase();
    email = email.toLowerCase();

    // Check if the user already exists (by email or username)
    let userExists = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    userExists = await pool.query('SELECT * FROM users WHERE LOWER(username) = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Username already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Login user and generate JWT token
exports.login = async (req, res) => {
  let { username, password } = req.body;
  try {
    // Convert username to lowercase for case-insensitive login
    username = username.toLowerCase();

    const user = await pool.query('SELECT * FROM users WHERE LOWER(username) = $1', [username]);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, username: user.rows[0].username },  // Payload
      process.env.JWT_SECRET,  // Secret key from environment variable
      { expiresIn: '7h' }      // Token expiration
    );

    // Send the token to the client
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
