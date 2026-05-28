"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

// 1. Updated UserRole to include all system roles
export type UserRole = 'CLIENT' | 'FREELANCER' | 'ADMIN' | 'SUPPORT';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole; // This will now accept any of the four roles
  fullName: string;
  [key: string]: unknown;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }, userData: AuthUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Only attempt to fetch if we have a token
      if (typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
        setAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await api.get<{ success: boolean; data: AuthUser }>('/api/v1/user/me');

      if (response.data.success && response.data.data) {
        setUser(response.data.data);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Direct login — sets tokens + user state without an extra /me call
  const login = (tokens: { accessToken: string; refreshToken: string }, userData: AuthUser) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
    setUser(userData);
    setAuthenticated(true);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/user/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear tokens and state regardless of API response
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      setUser(null);
      setAuthenticated(false);
      window.location.href = '/';
    }
  };

  return (
    <div style={{ display: 'contents' }}>
      <AuthContext.Provider value={{ user, loading, authenticated, login, logout, refreshUser: fetchProfile }}>
        {children}
      </AuthContext.Provider>
    </div>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};