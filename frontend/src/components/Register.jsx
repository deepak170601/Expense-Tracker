import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios.js'; // Import axios instance
import './styles/Funny.css';
const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true); // Disable button during submission

      const response = await axios.post('/auth/register', { 
        username: username.trim(),  // Trim whitespaces
        email: email.trim().toLowerCase(),  // Normalize email
        password 
      });

      if (response.status === 201) {
        alert("Registration successful. Please log in.");
        navigate('/'); // Redirect to SignIn after successful registration
      } else {
        alert("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error('Registration failed:', error);

      // Display a more detailed error message if available
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false); // Enable button after submission
    }
  };

  return (
    <div className="auth-container">
    <h1>Build Your Own App!</h1>
    <p className="app-message">
      It's easier than herding cats... 
      <span className="rotating-emoji">🐱</span> 
      <span className="rotating-emoji">💻</span>
    </p>
    <div className="running-code">
    <span>{'Brewing coffee for the server... Please wait !'}</span>
    </div>
  </div>
  );
};

export default Register;


{/* <form className="auth-form" onSubmit={handleSubmit}>
  <div className="form-group">
    <label htmlFor="username">Username:</label>
    <input
      type="text"
      id="username"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      required
    />
  </div>
  <div className="form-group">
    <label htmlFor="email">Email:</label>
    <input
      type="email"
      id="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
    />
  </div>
  <div className="form-group">
    <label htmlFor="password">Password:</label>
    <input
      type="password"
      id="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
    />
  </div>
  <div className="form-group">
    <label htmlFor="confirmPassword">Confirm Password:</label>
    <input
      type="password"
      id="confirmPassword"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      required
    />
  </div>
  <button 
    type="submit" 
    className="submit-button" 
    disabled={isSubmitting} // Disable button while submitting
  >
    {isSubmitting ? 'Signing up...' : 'Sign Up'}
  </button>
</form> */}