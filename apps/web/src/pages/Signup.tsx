import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountMode, setAccountMode] = useState<'founder' | 'student'>('founder');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup(email, password, name, accountMode);
      navigate('/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-softbg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-light mb-4">
            <Sparkles className="text-primary-dark" size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Let's begin</h1>
          <p className="text-muted mt-1">Your vision starts becoming a plan today.</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          <div>
            <label className="text-sm font-semibold text-ink block mb-1">Name</label>
            <input className="input-field" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink block mb-1">Email</label>
            <input className="input-field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink block mb-1">Password</label>
            <input
              className="input-field"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink block mb-2">I am joining as a...</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountMode('founder')}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  accountMode === 'founder' ? 'border-primary bg-primary-light text-primary-dark' : 'border-line text-muted'
                }`}
              >
                Founder / Entrepreneur
              </button>
              <button
                type="button"
                onClick={() => setAccountMode('student')}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  accountMode === 'student' ? 'border-primary bg-primary-light text-primary-dark' : 'border-line text-muted'
                }`}
              >
                Student
              </button>
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Creating your account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
