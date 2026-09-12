import { useEffect, useState, useCallback } from 'react';
import type { User, AuthResponse } from '@mecrm/types';
import { api, ApiError } from '../lib/api';
import { getToken, setToken } from '../lib/storage';

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      setUser(res.user);
    } catch {
      await setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function login(email: string, password: string) {
    try {
      const res = await api.post<AuthResponse>('/auth/login', { email, password });
      await setToken(res.token);
      setUser(res.user);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, error: err instanceof ApiError ? err.message : 'Could not sign in.' };
    }
  }

  async function logout() {
    await setToken(null);
    setUser(null);
  }

  return { user, loading, login, logout, refresh };
}
