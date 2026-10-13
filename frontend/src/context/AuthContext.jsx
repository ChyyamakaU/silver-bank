import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { clearAccessToken, setAccessToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/auth/me');
      setUser(data.data?.user || null);
      setAccount(data.data?.account || null);
    } catch (err) {
      clearAccessToken();
      setUser(null);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    const token = data?.data?.accessToken;
    if (token) {
      setAccessToken(token);
    }
    setUser(data?.data?.user || null);
    setAccount(data?.data?.account || null);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      setUser(null);
      setAccount(null);
    }
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  };

  const refreshAccount = async () => {
    try {
      const { data } = await api.get('/accounts/me');
      setAccount(data?.data || null);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        loading,
        error,
        login,
        logout,
        register,
        loadProfile,
        refreshAccount,
        setAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
