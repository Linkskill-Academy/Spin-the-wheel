import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, ExternalLink } from 'lucide-react';
import type { DashboardSummary } from '@mecrm/types';
import { progressPercent, streakMessage } from '@mecrm/shared';
import { Card, ProgressBar } from '@mecrm/ui';
import { api } from '../lib/api';
import { getWebUrl } from '../lib/storage';
import { useSession } from '../hooks/useSession';
import { LoginForm } from '../components/LoginForm';

const MOTIVATIONAL = [
  "One action can change today's score.",
  "You're building momentum.",
  'Progress begins with the next move.',
  'You have another opportunity today.',
];

function openWebPage(path: string) {
  getWebUrl().then((url) => chrome.tabs.create({ url: `${url}${path}` }));
}

export default function NewTab() {
  const { user, loading, connectionError, login, refresh } = useSession();

  return (
    <div className="min-h-screen bg-softbg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {loading ? null : !user && connectionError ? (
          <Unreachable onRetry={refresh} />
        ) : user ? (
          <Home />
        ) : (
          <LoggedOut onLogin={login} />
        )}
      </div>
    </div>
  );
}

function Unreachable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center card max-w-sm mx-auto">
      <p className="font-bold text-ink mb-1">Can't reach the server</p>
      <p className="text-sm text-muted mb-4">Your session is still saved. Check your connection and try again.</p>
      <button onClick={onRetry} className="btn-primary w-full">
        Retry
      </button>
    </div>
  );
}

function LoggedOut({ onLogin }: { onLogin: (e: string, p: string) => Promise<{ ok: boolean; error?: string }> }) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-extrabold text-ink mb-6">What are we creating today?</h1>
      <div className="card max-w-sm mx-auto text-left">
        <LoginForm onLogin={onLogin} />
      </div>
    </div>
  );
}

function Home() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const message = MOTIVATIONAL[new Date().getDate() % MOTIVATIONAL.length];

  useEffect(() => {
    api.get<DashboardSummary>('/dashboard').then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, seconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const topGoal = data?.goals[0];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-ink">What are we creating today?</h1>
        <p className="text-muted mt-2">{message}</p>
      </div>

      {data && (
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-3">Today's Big 3</p>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <Big3 label="Revenue / Business" value={data.todayFocus.priority} />
            <Big3 label="Money Move" value={data.todayFocus.moneyMove} />
            <Big3 label="Courage Action" value={data.todayFocus.courageAction} />
          </div>
        </Card>
      )}

      {topGoal && (
        <Card>
          <div className="flex justify-between mb-1">
            <p className="font-bold text-ink">{topGoal.title}</p>
            <span className="font-bold text-primary">{progressPercent(topGoal.progressCurrent, topGoal.progressTarget)}%</span>
          </div>
          <ProgressBar percent={progressPercent(topGoal.progressCurrent, topGoal.progressTarget)} />
          <p className="text-xs text-muted mt-2">{topGoal.todayAction}</p>
        </Card>
      )}

      {data && (
        <p className="text-center text-sm text-muted">{streakMessage(data.streaks.execution)}</p>
      )}

      <Card>
        <p className="text-xs font-semibold text-muted uppercase mb-2 text-center">Focus Timer</p>
        <p className="text-4xl font-extrabold text-ink text-center tabular-nums my-3">
          {mm}:{ss}
        </p>
        <div className="flex justify-center gap-2">
          <button onClick={() => setRunning((r) => !r)} className="btn-primary flex items-center gap-2">
            {running ? <Pause size={16} /> : <Play size={16} />} {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setSeconds(25 * 60);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </Card>

      <div className="text-center">
        <button onClick={() => openWebPage('/')} className="btn-secondary inline-flex items-center gap-2">
          Open Full Dashboard <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}

function Big3({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-softbg rounded-xl p-3">
      <p className="text-[10px] font-semibold text-muted uppercase">{label}</p>
      <p className="text-sm font-semibold text-ink mt-0.5">{value || '—'}</p>
    </div>
  );
}
