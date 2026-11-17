import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('medislot_token') || null);
  const [loading, setLoading] = useState(true);

  // Restore user session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('medislot_token');
      const storedUser = localStorage.getItem('medislot_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Optionally verify with server
          const res = await api.get('/auth/me');
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('medislot_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('medislot_token', receivedToken);
    localStorage.setItem('medislot_user', JSON.stringify(receivedUser));

    return receivedUser;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('medislot_token', receivedToken);
    localStorage.setItem('medislot_user', JSON.stringify(receivedUser));

    return receivedUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('medislot_token');
    localStorage.removeItem('medislot_user');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    role: user?.role || null,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
