import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios.js';
import { useFlashMessage } from '../context/FlashMessageContext.jsx';
import './styles/Funny.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { showMessage } = useFlashMessage();

  const validateUsername = (username) => {
    return username.trim().length >= 3;
  };

  const validatePasswords = (password, confirmPassword) => {
    return password === confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateUsername(username)) {
      showMessage("Username must be at least 3 characters long.", 'warning');
      return;
    }

    if (!validatePasswords(password, confirmPassword)) {
      showMessage("Passwords do not match!", 'warning');
      return;
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage("Please enter a valid email address.", 'warning');
      return;
    }

    try {
      setIsSubmitting(true); // Disable button during submission
      setErrorMessage(''); // Clear previous error messages

      const response = await axios.post('/auth/register', { 
        username: username.trim(),  // Trim whitespaces
        email: email.trim().toLowerCase(),  // Normalize email
        password 
      });

      if (response.status === 201) {
        showMessage("Registration successful. Please log in.", 'success');
        navigate('/'); // Redirect to SignIn after successful registration
      } else {
        showMessage("Registration failed. Please try again.", 'error');
      }
    } catch (error) {
      console.error('Registration failed:', error);

      // Display a more detailed error message if available
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(`Error: ${error.response.data.message}`);
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false); // Enable button after submission
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
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
      {errorMessage && (
        <div className="error-message" aria-live="polite">
          {errorMessage}
        </div>
      )}
      <button 
        type="submit" 
        className="submit-button" 
        disabled={isSubmitting} // Disable button while submitting
      >
        {isSubmitting ? 'Signing up...' : 'Sign Up'}
      </button>
    </form> 
  );
};

export default Register;

{
//   <div className="auth-container">
//   <h1>Build Your Own App!</h1>
//   <p className="app-message">
//     It's easier than herding cats... 
//     <span className="rotating-emoji">🐱</span> 
//     <span className="rotating-emoji">💻</span>
//   </p>
//   <div className="running-code">
//   <span>{'Brewing coffee for the server... Please wait !'}</span>
//   </div>
// </div>
}