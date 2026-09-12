import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await onLogin(email, password);
    if (!res.ok) setError(res.error || 'Could not sign in.');
    setBusy(false);
  }

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
          <Sparkles size={16} className="text-primary-dark" />
        </div>
        <p className="font-bold text-ink text-sm">Sign in to continue</p>
      </div>
      <form onSubmit={submit} className="space-y-2">
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1.5">{error}</p>}
        <input className="input-field text-sm" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          className="input-field text-sm"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button disabled={busy} className="btn-primary w-full text-sm" type="submit">
          {busy ? 'Signing in...' : 'Sign In'}
        </button>
        <button
          type="button"
          className="btn-secondary w-full text-sm"
          onClick={() => {
            setEmail('demo@manifestcrm.app');
            setPassword('Demo@1234');
          }}
        >
          Use Demo Account
        </button>
      </form>
      <p className="text-[11px] text-muted mt-3 text-center">
        Connects to your Manifestation & Execution CRM server. Sign in with the same account you use on the web app.
      </p>
    </div>
  );
}
