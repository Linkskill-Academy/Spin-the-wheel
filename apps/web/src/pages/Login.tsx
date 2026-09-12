import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function fillDemo() {
    setEmail('demo@manifestcrm.app');
    setPassword('Demo@1234');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-softbg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-light mb-4">
            <Sparkles className="text-primary-dark" size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Welcome back</h1>
          <p className="text-muted mt-1">What are we creating today?</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          <div>
            <label className="text-sm font-semibold text-ink block mb-1">Email</label>
            <input className="input-field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink block mb-1">Password</label>
            <input className="input-field" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
          <button type="button" onClick={fillDemo} className="btn-secondary w-full">
            Use Demo Account
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          New here?{' '}
          <Link to="/signup" className="text-primary font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
