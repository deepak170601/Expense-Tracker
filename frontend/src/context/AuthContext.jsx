import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from '../api/axios.js';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  let logoutTimer; // For tracking inactivity timeout

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    navigate('/'); // Redirect to login page on logout
  }, [navigate]);

  // Reset inactivity timer
  const resetTimer = () => {
    if (logoutTimer) {
      clearTimeout(logoutTimer); // Clear the previous timer
    }
    logoutTimer = setTimeout(logout, 10 * 60 * 1000); // Set new timer for 10 minutes (600,000 ms)
  };

  // Event listener for user activity
  const activityHandler = () => {
    resetTimer(); // Reset timer on any activity
  };

  // On component mount, check for token and username in sessionStorage and listen to user activity
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const username = sessionStorage.getItem('username');
    if (token && username) {
      setUser({ token, username });
    }
    setLoading(false);

    // Add event listeners for user activity
    window.addEventListener('mousemove', activityHandler);
    window.addEventListener('keydown', activityHandler);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('mousemove', activityHandler);
      window.removeEventListener('keydown', activityHandler);
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, [logout]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login', { username, password });
      const { token } = response.data;

      setUser({ token, username });
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('username', username);

      // Navigation is handled by the useEffect in SignIn component
      resetTimer(); // Start the inactivity timer on successful login
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw so SignIn component can handle the error
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
