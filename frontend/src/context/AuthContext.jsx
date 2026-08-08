import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Session restored error:', err);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/auth/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateFavorites = async (favouriteTools) => {
    try {
      const res = await api.put('/api/auth/favorites', { favouriteTools });
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to update favorites' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout, updateFavorites }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
