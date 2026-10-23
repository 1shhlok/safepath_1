import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, setAuthToken, getStoredToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        setAuthToken(token);
        const res = await authAPI.getMe();
        setUser(res.data.user);
      } catch (err) {
        console.warn('Session expired or token invalid:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const receivedToken = res.data?.token || res.data?.accessToken;
    const receivedUser = res.data?.user;

    if (receivedToken) {
      localStorage.setItem('safepath_token', receivedToken);
      localStorage.setItem('token', receivedToken);
      setAuthToken(receivedToken);
      setToken(receivedToken);
    }
    setUser(receivedUser);
    return receivedUser;
  };

  const signup = async (name, email, password, role = 'user') => {
    const res = await authAPI.signup({ name, email, password, role });
    const receivedToken = res.data?.token || res.data?.accessToken;
    const receivedUser = res.data?.user;

    if (receivedToken) {
      localStorage.setItem('safepath_token', receivedToken);
      localStorage.setItem('token', receivedToken);
      setAuthToken(receivedToken);
      setToken(receivedToken);
    }
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('safepath_token');
    localStorage.removeItem('token');
    sessionStorage.removeItem('safepath_token');
    sessionStorage.removeItem('token');
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    logout
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
