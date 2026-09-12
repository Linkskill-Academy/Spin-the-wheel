import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, GraduationCap, Wallet, CheckSquare, Sparkles, GraduationCap as College, CalendarRange } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card, SectionTitle } from '@mecrm/ui';

export default function Me() {
  const { user, logout, refreshUser } = useAuth();
  const [switching, setSwitching] = useState(false);

  async function toggleMode() {
    if (!user) return;
    setSwitching(true);
    try {
      await api.patch('/auth/me', { accountMode: user.accountMode === 'founder' ? 'student' : 'founder' });
      await refreshUser();
    } finally {
      setSwitching(false);
    }
  }

  const links = [
    { to: '/money', label: 'Money Dashboard', icon: Wallet, founderOnly: true },
    { to: '/colleges', label: 'College Outreach', icon: College, founderOnly: true },
    { to: '/habits', label: 'Habits', icon: CheckSquare },
    { to: '/evidence', label: 'Evidence Log', icon: Sparkles },
    { to: '/reviews', label: 'Weekly & Monthly Review', icon: CalendarRange },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Me</h1>
        <p className="text-muted mt-1">Your account and settings.</p>
      </header>

      <Card>
        <p className="text-sm text-muted">Signed in as</p>
        <p className="font-bold text-ink text-lg">{user?.name}</p>
        <p className="text-sm text-muted">{user?.email}</p>
      </Card>

      <Card>
        <SectionTitle>Account Mode</SectionTitle>
        <p className="text-sm text-muted mb-4">
          {user?.accountMode === 'student'
            ? 'Student Mode focuses on career, skills, portfolio and confidence.'
            : 'Founder Mode shows business, money and CRM features.'}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <GraduationCap size={18} className={user?.accountMode === 'student' ? 'text-primary' : 'text-muted'} />
            Student
          </div>
          <button
            onClick={toggleMode}
            disabled={switching}
            className={`relative w-14 h-8 rounded-full transition-colors ${user?.accountMode === 'founder' ? 'bg-primary' : 'bg-line'}`}
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                user?.accountMode === 'founder' ? 'translate-x-6' : ''
              }`}
            />
          </button>
          <span className="text-sm font-semibold">Founder</span>
        </div>
      </Card>

      <Card>
        <SectionTitle>More</SectionTitle>
        <div className="flex flex-col gap-1">
          {links
            .filter((l) => !l.founderOnly || user?.accountMode === 'founder')
            .map((l) => (
              <Link key={l.to} to={l.to} className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-softbg text-ink font-medium">
                <l.icon size={18} className="text-primary" />
                {l.label}
              </Link>
            ))}
        </div>
      </Card>

      <button onClick={logout} className="btn-secondary w-full flex items-center justify-center gap-2 text-red-600">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}
