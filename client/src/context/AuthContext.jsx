import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const DEMO_USERS_MAP = {
  'admin@shopsphere.com': {
    _id: 'demo-admin-id',
    name: 'Sarah Connor',
    email: 'admin@shopsphere.com',
    role: 'Platform Admin',
  },
  'customer@shopsphere.com': {
    _id: 'demo-customer-id',
    name: 'Alex Johnson',
    email: 'customer@shopsphere.com',
    role: 'Customer',
  },
  'seller@shopsphere.com': {
    _id: 'demo-seller-id',
    name: 'Marcus Vance',
    email: 'seller@shopsphere.com',
    role: 'Seller',
    store: { _id: 'demo-store-1', storeName: 'TechSphere Official', isApproved: true },
  },
  'seller2@shopsphere.com': {
    _id: 'demo-seller-2-id',
    name: 'Elena Rostova',
    email: 'seller2@shopsphere.com',
    role: 'Seller',
    store: { _id: 'demo-store-2', storeName: 'EcoVibe Studio', isApproved: true },
  },
  'seller3@shopsphere.com': {
    _id: 'demo-seller-3-id',
    name: 'David Chen',
    email: 'seller3@shopsphere.com',
    role: 'Seller',
    store: { _id: 'demo-store-3', storeName: 'NovaSound Labs', isApproved: false },
  },
  'support@shopsphere.com': {
    _id: 'demo-support-id',
    name: 'Michael Scott',
    email: 'support@shopsphere.com',
    role: 'Support Agent',
  },
  'delivery@shopsphere.com': {
    _id: 'demo-delivery-id',
    name: 'Jordan Sparks',
    email: 'delivery@shopsphere.com',
    role: 'Delivery Partner',
  },
  'test@mail.com': {
    _id: 'demo-admin-test-id',
    name: 'Platform Admin',
    email: 'test@mail.com',
    role: 'Platform Admin',
  },
};

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
      if (token.startsWith('demo_token_')) {
        return;
      }
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
    const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password.trim() : '';

    try {
      const res = await authAPI.login({ email: sanitizedEmail, password: cleanPassword });
      const { user: userData, accessToken, refreshToken } = res.data.data;
      localStorage.setItem('shopsphere_access_token', accessToken);
      localStorage.setItem('shopsphere_refresh_token', refreshToken);
      localStorage.setItem('shopsphere_user', JSON.stringify(userData));
      setUser(userData);
      setToken(accessToken);
      setLoading(false);
      return userData;
    } catch (err) {
      const isDemoPassword = cleanPassword === 'password123' || cleanPassword === '1234567890';
      const isNetworkOr404 = !err.response || err.response.status === 404 || err.code === 'ERR_NETWORK' || err.message === 'Network Error';

      // If backend is unavailable or not proxying on static host, authenticate demo users directly
      if (isNetworkOr404 && DEMO_USERS_MAP[sanitizedEmail] && isDemoPassword) {
        const demoUser = DEMO_USERS_MAP[sanitizedEmail];
        const dummyToken = 'demo_token_' + Date.now();
        localStorage.setItem('shopsphere_access_token', dummyToken);
        localStorage.setItem('shopsphere_refresh_token', dummyToken);
        localStorage.setItem('shopsphere_user', JSON.stringify(demoUser));
        setUser(demoUser);
        setToken(dummyToken);
        setLoading(false);
        return demoUser;
      }

      setLoading(false);
      let msg = 'Invalid credentials. Please check your email and password.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.response?.status === 404) {
        msg = 'API server returned 404 Not Found. Please verify your backend API is online.';
      } else if (isNetworkOr404) {
        msg = 'Cannot connect to backend API server. Please verify your backend service is running and VITE_API_URL is configured.';
      }
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
