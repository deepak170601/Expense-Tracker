import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext); // Access the user state from AuthContext
  console.log('ProtectedRoute user:', user);
    
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/" />; // Redirect to login page if not authenticated
  }

  return children; // Render the protected component
};

export default ProtectedRoute;
