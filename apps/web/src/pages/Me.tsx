import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut,
  GraduationCap,
  Wallet,
  CheckSquare,
  Sparkles,
  GraduationCap as College,
  CalendarRange,
  Download,
  Loader2,
} from 'lucide-react';
import type { CurrencyCode } from '@mecrm/types';
import { useAuth } from '../context/AuthContext';
import { api, getToken } from '../lib/api';
import { Card, SectionTitle } from '@mecrm/ui';

async function downloadFile(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Me() {
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [dailyTarget, setDailyTarget] = useState(String(user?.dailyOutreachTarget ?? 10));
  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [exportError, setExportError] = useState('');

  async function toggleMode() {
    if (!user) return;
    setSwitchingMode(true);
    try {
      await api.patch('/auth/me', { accountMode: user.accountMode === 'founder' ? 'student' : 'founder' });
      await refreshUser();
    } finally {
      setSwitchingMode(false);
    }
  }

  async function saveName() {
    if (!name.trim() || name === user?.name) return;
    setSavingName(true);
    try {
      await api.patch('/auth/me', { name });
      await refreshUser();
    } finally {
      setSavingName(false);
    }
  }

  async function updateCurrency(currency: CurrencyCode) {
    await api.patch('/auth/me', { currency });
    await refreshUser();
  }

  async function saveDailyTarget() {
    const value = Math.max(1, Math.min(100, Number(dailyTarget) || 10));
    await api.patch('/auth/me', { dailyOutreachTarget: value });
    await refreshUser();
  }

  async function toggleReminder(key: 'morningReminderEnabled' | 'nightReviewReminderEnabled') {
    if (!user) return;
    await api.patch('/auth/me', { [key]: !user[key] });
    await refreshUser();
  }

  async function handleExport(key: string, path: string, filename: string) {
    setExportError('');
    setExportBusy(key);
    try {
      await downloadFile(path, filename);
    } catch {
      setExportError("Couldn't export right now. Check your connection and try again.");
    } finally {
      setExportBusy(null);
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
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
        <p className="text-muted mt-1">Your account, preferences, and data.</p>
      </header>

      <Card>
        <SectionTitle>Name</SectionTitle>
        <p className="text-sm text-muted mb-3">{user?.email}</p>
        <div className="flex gap-2">
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
          <button disabled={savingName || !name.trim() || name === user?.name} onClick={saveName} className="btn-secondary shrink-0">
            {savingName ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Account Type</SectionTitle>
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
            disabled={switchingMode}
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
        <SectionTitle>Currency</SectionTitle>
        <p className="text-sm text-muted mb-3">Applies to Money, Goals, CRM and College Outreach.</p>
        <div className="grid grid-cols-2 gap-2">
          {(['INR', 'USD'] as CurrencyCode[]).map((c) => (
            <button
              key={c}
              onClick={() => updateCurrency(c)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                user?.currency === c ? 'border-primary bg-primary-light text-primary-dark' : 'border-line text-muted'
              }`}
            >
              {c === 'INR' ? '₹ INR' : '$ USD'}
            </button>
          ))}
        </div>
      </Card>

      {user?.accountMode === 'founder' && (
        <Card>
          <SectionTitle>Daily Outreach Target</SectionTitle>
          <p className="text-sm text-muted mb-3">How many colleges you aim to contact each day.</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={100}
              className="input-field"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
            />
            <button onClick={saveDailyTarget} className="btn-secondary shrink-0">
              Save
            </button>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Reminders</SectionTitle>
        <div className="space-y-3">
          <ReminderRow
            label="Morning Routine reminder"
            enabled={!!user?.morningReminderEnabled}
            onToggle={() => toggleReminder('morningReminderEnabled')}
          />
          <ReminderRow
            label="Night Review reminder"
            enabled={!!user?.nightReviewReminderEnabled}
            onToggle={() => toggleReminder('nightReviewReminderEnabled')}
          />
        </div>
        <p className="text-xs text-muted mt-3">
          Saved as a preference for now — push/email delivery is on the roadmap, not wired up yet.
        </p>
      </Card>

      <Card>
        <SectionTitle>Export Your Data</SectionTitle>
        <p className="text-sm text-muted mb-3">Your data lives in your own database. Take a copy any time.</p>
        {exportError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{exportError}</p>}
        <div className="grid grid-cols-2 gap-2">
          <ExportButton
            label="Everything (JSON)"
            busy={exportBusy === 'json'}
            onClick={() => handleExport('json', '/export/json', 'manifestation-crm-export.json')}
          />
          <ExportButton
            label="Leads (CSV)"
            busy={exportBusy === 'leads'}
            onClick={() => handleExport('leads', '/export/csv/leads', 'leads.csv')}
          />
          <ExportButton
            label="Money (CSV)"
            busy={exportBusy === 'money'}
            onClick={() => handleExport('money', '/export/csv/money', 'money.csv')}
          />
          <ExportButton
            label="Evidence (CSV)"
            busy={exportBusy === 'evidence'}
            onClick={() => handleExport('evidence', '/export/csv/evidence', 'evidence.csv')}
          />
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

function ReminderRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button onClick={onToggle} className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-line'}`}>
        <span
          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}

function ExportButton({ label, busy, onClick }: { label: string; busy: boolean; onClick: () => void }) {
  return (
    <button disabled={busy} onClick={onClick} className="btn-secondary text-sm flex items-center justify-center gap-2">
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {label}
    </button>
  );
}
