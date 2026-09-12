import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, AuthResponse } from '@mecrm/types';
import { api, ApiError, getToken, setToken } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** True when a token exists but the server could not be reached (not an auth failure). */
  connectionError: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, accountMode: 'founder' | 'student') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  async function refreshUser() {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      setUser(res.user);
      setConnectionError(false);
    } catch (err) {
      // Only a real auth failure (invalid/expired token) should sign the user out.
      // A network error or a temporarily unreachable server must not wipe a valid session.
      if (err instanceof ApiError && err.status === 401) {
        setToken(null);
        setUser(null);
        setConnectionError(false);
      } else {
        setConnectionError(true);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshUser();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    setToken(res.token);
    setUser(res.user);
  }

  async function signup(email: string, password: string, name: string, accountMode: 'founder' | 'student') {
    const res = await api.post<AuthResponse>('/auth/signup', { email, password, name, accountMode });
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, connectionError, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
