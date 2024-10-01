import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './styles/Navbar.css'; // Import a separate CSS file for Navbar component styles
const Navbar = () => {
  const { user, logout } = useContext(AuthContext); // Use user and logout from context
  return (
    <nav className="navbar">
      <h1 className="logo">
        Expense <span>Tracker</span>
      </h1>
      <ul className="nav-links">
        {user ? (
          <>
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/reports">Reports</Link></li>
            <li><Link to="/accounts">Accounts</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><button onClick={logout}>LOG OUT</button></li>
          </>
        ) : (
            <>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/">Login</Link></li>
            </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
