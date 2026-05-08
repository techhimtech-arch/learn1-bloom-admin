import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    schoolName: string;
    schoolEmail: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    const resData = data.data;
    const userData = resData.user;
    const accessToken = resData.accessToken || resData.token;
    const refreshToken = resData.refreshToken || '';
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const register = useCallback(async (regData: {
    schoolName: string;
    schoolEmail: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => {
    const { data } = await authApi.register(regData);
    const resData = data.data;
    const token = resData.accessToken || resData.token || '';
    localStorage.setItem('accessToken', token);
    if (resData.refreshToken) localStorage.setItem('refreshToken', resData.refreshToken);
    // Register may not return user object - auto-login after register
    if (resData.user) {
      localStorage.setItem('user', JSON.stringify(resData.user));
      setUser(resData.user);
    } else {
      // If no user returned, redirect to login
      window.location.href = '/login';
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
