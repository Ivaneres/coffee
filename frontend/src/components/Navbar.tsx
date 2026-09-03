import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconCup, IconSearch, IconSettings } from './Icons';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';
  const showNav = isAuthenticated && !isAuthRoute;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `tab-link${isActive ? ' active' : ''}`;

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `navbar-link${isActive ? ' active' : ''}`;

  return (
    <>
      <header className={`topbar${showNav ? '' : ' topbar-auth'}`}>
        <div className="topbar-inner">
          <Link to={isAuthenticated ? '/beans' : '/login'} className="navbar-brand">
            Espresso Tracker
          </Link>
          {showNav && (
            <nav className="desktop-nav" aria-label="Main">
              <NavLink to="/beans" className={desktopLinkClass} end={false}>
                Home
              </NavLink>
              <NavLink to="/search" className={desktopLinkClass}>
                Search
              </NavLink>
              <NavLink to="/settings" className={desktopLinkClass}>
                Settings
              </NavLink>
              <span className="navbar-user">{user?.username}</span>
              <button type="button" onClick={handleLogout} className="navbar-logout">
                Logout
              </button>
            </nav>
          )}
        </div>
      </header>

      {showNav && (
        <nav className="tabbar" aria-label="Primary">
          <NavLink to="/beans" className={tabClass}>
            <IconCup size={22} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/search" className={tabClass}>
            <IconSearch size={22} />
            <span>Search</span>
          </NavLink>
          <NavLink to="/settings" className={tabClass}>
            <IconSettings size={22} />
            <span>Settings</span>
          </NavLink>
        </nav>
      )}
    </>
  );
};

export default Navbar;
