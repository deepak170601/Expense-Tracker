import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext); // Access the user state and loading state from AuthContext

  // Show a loading indicator while checking authentication
  if (loading) {
    return <div>Loading...</div>; // Optionally, you can return a loading spinner or message
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/" />; // Redirect to login page if not authenticated
  }

  return children; // Render the protected component
};

export default ProtectedRoute;
