import React, { createContext, useState, useEffect } from 'react';
import axios from '../api/axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); 

  // On component mount, check for token and username in cookies
  useEffect(() => {
    const token = Cookies.get('token'); // Get token from cookies
    const username = Cookies.get('username'); // Get username from cookies
    console.log('Token:', token, 'Username:', username);
    
    if (token && username) {
      setUser({ token, username });  // Set user state with token and username if they exist
    }
    console.log('User:', user);
    
  }, []);

  // Login function: send credentials to the backend and get the token and username
  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login', { username, password });
      const { token } = response.data;

      // Store the token and username in memory and in cookies
      setUser({ token, username }); // Set the user state
      Cookies.set('token', token, { expires: 1 }); // Set token in cookies (1 day expiry)
      Cookies.set('username', username, { expires: 1 }); // Set username in cookies (1 day expiry)

      // Redirect after login
      navigate('/accounts'); // This will work only if the user is logged in successfully
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Logout function: remove the token and username from memory and cookies
  const logout = () => {
    setUser(null);
    Cookies.remove('token');
    Cookies.remove('username');
    navigate('/'); // Redirect to login page on logout
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
