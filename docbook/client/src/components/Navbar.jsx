import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'badge badge-admin';
      case 'doctor':
        return 'badge badge-doctor';
      case 'patient':
        return 'badge badge-patient';
      default:
        return 'badge';
    }
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 6.5C4.5 4.6 6 3 7.9 3S11.3 4.6 11.3 6.5v5.2c0 2.6 2.1 4.8 4.8 4.8s4.8-2.1 4.8-4.8V10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="19" cy="8.5" r="2" fill="white"/>
              <path d="M4.5 15.5C4.5 17.4 6 19 7.9 19H10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="11" cy="19" r="2" stroke="white" strokeWidth="1.8"/>
            </svg>
          </span>
          <span className="brand-text">Docbook</span>
        </Link>

        <nav className="nav-links">
          {/* Patient navigation */}
          {isAuthenticated && user?.role === 'patient' && (
            <>
              <NavLink to="/doctors" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Doctors
              </NavLink>
              <NavLink to="/book" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Book Slot
              </NavLink>
              <NavLink to="/my-appointments" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                My Appointments
              </NavLink>
            </>
          )}

          {/* Doctor navigation */}
          {isAuthenticated && user?.role === 'doctor' && (
            <>
              <NavLink to="/doctor/appointments" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                My Appointments
              </NavLink>
              <NavLink to="/doctor/slots" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Manage Slots
              </NavLink>
            </>
          )}

          {/* Admin navigation */}
          {isAuthenticated && user?.role === 'admin' && (
            <>
              <NavLink to="/admin/appointments" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                All Appointments
              </NavLink>
              <NavLink to="/admin/doctors" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Manage Doctors
              </NavLink>
            </>
          )}

          {/* Guest navigation */}
          {!isAuthenticated && (
            <>
              <NavLink to="/doctors" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Doctors
              </NavLink>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Login
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">
                Register
              </NavLink>
            </>
          )}
        </nav>

        {/* User profile & Logout */}
        {isAuthenticated && (
          <div className="user-section">
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className={getRoleBadgeClass(user?.role)}>{user?.role}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
