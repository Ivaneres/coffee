import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/beans" className="navbar-brand">
          ☕ Espresso Tracker
        </Link>
        {isAuthenticated && (
          <div className="navbar-menu">
            <Link to="/beans" className="navbar-link">
              Beans
            </Link>
            <Link to="/search" className="navbar-link">
              Search
            </Link>
            <Link to="/settings" className="navbar-link">
              Settings
            </Link>
            <span className="navbar-user">{user?.username}</span>
            <button onClick={handleLogout} className="navbar-logout">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
