import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('shopsphere_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('shopsphere_access_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync current user on reload
  useEffect(() => {
    if (token && !user) {
      authAPI
        .getMe()
        .then((res) => {
          setUser(res.data.data.user);
          localStorage.setItem('shopsphere_user', JSON.stringify(res.data.data.user));
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      const res = await authAPI.login({ email: sanitizedEmail, password });
      const { user: userData, accessToken, refreshToken } = res.data.data;
      localStorage.setItem('shopsphere_access_token', accessToken);
      localStorage.setItem('shopsphere_refresh_token', refreshToken);
      localStorage.setItem('shopsphere_user', JSON.stringify(userData));
      setUser(userData);
      setToken(accessToken);
      setLoading(false);
      return userData;
    } catch (err) {
      setLoading(false);
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      const msg = err.response?.data?.message || (isNetworkError
        ? 'Cannot connect to backend API server. Please verify your backend service is running and VITE_API_URL is configured.'
        : 'Invalid credentials. Please check your email and password.');
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.register(formData);
      const { user: userData, accessToken, refreshToken } = res.data.data;
      localStorage.setItem('shopsphere_access_token', accessToken);
      localStorage.setItem('shopsphere_refresh_token', refreshToken);
      localStorage.setItem('shopsphere_user', JSON.stringify(userData));
      setUser(userData);
      setToken(accessToken);
      setLoading(false);
      return userData;
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('shopsphere_access_token');
      localStorage.removeItem('shopsphere_refresh_token');
      localStorage.removeItem('shopsphere_user');
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'Guest',
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
