import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard component based on authentication state and user roles
 * @param {Array<string>} allowedRoles Allowed roles for this route (e.g. ['patient'])
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect user to their own role dashboard
    if (user?.role === 'patient') return <Navigate to="/doctors" replace />;
    if (user?.role === 'doctor') return <Navigate to="/doctor/appointments" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin/appointments" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
