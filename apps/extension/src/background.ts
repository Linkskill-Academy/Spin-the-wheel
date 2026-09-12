chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get('serverUrl');
  if (!existing.serverUrl) {
    await chrome.storage.local.set({ serverUrl: 'http://localhost:4000' });
  }
});
