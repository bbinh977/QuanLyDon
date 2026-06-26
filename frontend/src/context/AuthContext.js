import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, configAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requireAuth, setRequireAuth] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if auth is required
      const configRes = await configAPI.get();
      setRequireAuth(configRes.data.require_auth);

      // If auth not required, skip login check
      if (!configRes.data.require_auth) {
        setLoading(false);
        return;
      }

      // Check if user is logged in
      const token = localStorage.getItem('auth_token');
      if (token) {
        const res = await authAPI.getMe();
        setUser(res.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access_token, user } = res.data;
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (username, email, password, full_name) => {
    const res = await authAPI.register({ username, email, password, full_name });
    const { access_token, user } = res.data;
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    requireAuth,
    login,
    register,
    logout,
    isAuthenticated: !!user || !requireAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;