import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx';
import './styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null); // Create a ref for the sidebar

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleClickOutside = (event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      setIsSidebarOpen(false); // Close sidebar if clicked outside
    }
  };

  useEffect(() => {
    // Attach the click event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Empty dependency array to run only on mount and unmount

  return (
    <>
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
        <div className="menu-icon" onClick={toggleSidebar}>
          <span className={`menu-icon-bar ${isSidebarOpen ? 'open' : ''}`}></span>
          <span className={`menu-icon-bar ${isSidebarOpen ? 'open' : ''}`}></span>
          <span className={`menu-icon-bar ${isSidebarOpen ? 'open' : ''}`}></span>
        </div>
      </nav>

      {/* Sidebar for smaller screens */}
      <div className={`sidebar ${isSidebarOpen ? 'active' : ''}`} ref={sidebarRef}>
        <button className="close-btn" onClick={toggleSidebar}>×</button>
        <ul className="nav-links-sidebar">
          {user ? (
            <>
              <li><Link to="/home" onClick={toggleSidebar}>Home</Link></li>
              <li><Link to="/reports" onClick={toggleSidebar}>Reports</Link></li>
              <li><Link to="/accounts" onClick={toggleSidebar}>Accounts</Link></li>
              <li><Link to="/about" onClick={toggleSidebar}>About</Link></li>
              <li><button onClick={() => { logout(); toggleSidebar(); }}>LOG OUT</button></li>
            </>
          ) : (
            <>
              <li><Link to="/about" onClick={toggleSidebar}>About</Link></li>
              <li><Link to="/" onClick={toggleSidebar}>Login</Link></li>
            </>
          )}
        </ul>
      </div>
    </>
  );
};

export default Navbar;
