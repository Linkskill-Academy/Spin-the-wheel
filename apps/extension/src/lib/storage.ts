const DEFAULT_SERVER_URL = 'http://localhost:4000';
const DEFAULT_WEB_URL = 'http://localhost:5173';

export async function getServerUrl(): Promise<string> {
  const res = await chrome.storage.local.get('serverUrl');
  return res.serverUrl || DEFAULT_SERVER_URL;
}

export async function setServerUrl(url: string): Promise<void> {
  await chrome.storage.local.set({ serverUrl: url });
}

export async function getWebUrl(): Promise<string> {
  const res = await chrome.storage.local.get('webUrl');
  return res.webUrl || DEFAULT_WEB_URL;
}

export async function setWebUrl(url: string): Promise<void> {
  await chrome.storage.local.set({ webUrl: url });
}

export async function getToken(): Promise<string | null> {
  const res = await chrome.storage.local.get('token');
  return res.token || null;
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await chrome.storage.local.set({ token });
  else await chrome.storage.local.remove('token');
}
