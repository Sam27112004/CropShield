'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'admin' | 'farmer';

export interface AuthUser {
  role: UserRole;
  name: string;
  email?: string;
  picture?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginAdmin: (username: string, password: string) => { success: boolean; message?: string };
  loginFarmerWithGoogleCredential: (credential: string) => { success: boolean; message?: string };
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'cropshield_auth_v1';
const AuthContext = createContext<AuthContextType | null>(null);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed?.role && parsed?.name) {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const loginAdmin = useCallback((username: string, password: string) => {
    if (username.trim() === 'admin' && password === 'admin') {
      persist({ role: 'admin', name: 'Admin' });
      return { success: true };
    }
    return { success: false, message: 'Invalid admin credentials. Use admin / admin.' };
  }, [persist]);

  const loginFarmerWithGoogleCredential = useCallback((credential: string) => {
    const payload = decodeJwtPayload(credential);
    if (!payload) {
      return { success: false, message: 'Unable to read Google credential.' };
    }

    const email = typeof payload.email === 'string' ? payload.email : '';
    const name = typeof payload.name === 'string' ? payload.name : 'Farmer';
    const picture = typeof payload.picture === 'string' ? payload.picture : undefined;

    if (!email) {
      return { success: false, message: 'Google account email is required.' };
    }

    persist({ role: 'farmer', name, email, picture });
    return { success: true };
  }, [persist]);

  const logout = useCallback(() => {
    persist(null);
  }, [persist]);

  const value = useMemo<AuthContextType>(
    () => ({ user, isLoading, loginAdmin, loginFarmerWithGoogleCredential, logout }),
    [user, isLoading, loginAdmin, loginFarmerWithGoogleCredential, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
