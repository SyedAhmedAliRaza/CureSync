'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, signup as apiSignup, logout as apiLogout } from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('curesync_token');
    const savedUser = localStorage.getItem('curesync_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('curesync_token');
        localStorage.removeItem('curesync_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    if (!data.access_token) {
      throw new Error('Please confirm your email address before logging in. Check your inbox.');
    }
    localStorage.setItem('curesync_token', data.access_token);
    localStorage.setItem('curesync_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const signup = async (email, password, fullName) => {
    return await apiSignup(email, password, fullName);
  };

  const logout = async () => {
    await apiLogout();
    localStorage.removeItem('curesync_token');
    localStorage.removeItem('curesync_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
