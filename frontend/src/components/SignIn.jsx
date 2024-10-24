import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Auth.css';
import AuthContext from '../context/AuthContext.jsx';

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true); // Disable button during login
      await login(username.trim(), password); // Trim whitespaces for username
      // Redirection happens in AuthProvider based on saved route or default accounts
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false); // Enable button after attempt
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Sign In</h2>
      <form className="auth-form" onSubmit={handleSignIn}>
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
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button 
          type="submit" 
          className="submit-button" 
          disabled={isSubmitting} // Disable button while logging in
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <button className="register-button" onClick={() => navigate('/register')}>
        Don't have an account? Register
      </button>
    </div>
  );
};

export default SignIn;
