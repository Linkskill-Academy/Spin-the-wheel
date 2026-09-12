const TOKEN_KEY = 'mecrm_token';

// Relative '/api' works for the browser app (same-origin dev proxy or same-origin prod
// deployment) and the Chrome extension has its own client. The Android app is served from
// a Capacitor webview origin (https://localhost) that cannot reach '/api' on the dev
// machine, so mobile builds set VITE_API_URL to the backend's LAN address at build time
// (see apps/web/.env.mobile and apps/mobile/package.json's build:web script).
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api${path}`, { ...options, headers });

  if (res.status === 204) return undefined as unknown as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
