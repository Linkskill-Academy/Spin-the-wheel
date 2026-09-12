import { useEffect, useState } from 'react';
import { Sparkles, Timer, LogOut, ExternalLink, Plus } from 'lucide-react';
import type { DashboardSummary, Task } from '@mecrm/types';
import { progressPercent } from '@mecrm/shared';
import { Card, ProgressBar } from '@mecrm/ui';
import { api, ApiError } from '../lib/api';
import { getWebUrl } from '../lib/storage';
import { useSession } from '../hooks/useSession';
import { LoginForm } from '../components/LoginForm';

function openWebPage(path: string) {
  getWebUrl().then((url) => chrome.tabs.create({ url: `${url}${path}` }));
}

export default function Popup() {
  const { user, loading, login, logout } = useSession();

  if (loading) {
    return <div className="p-6 text-sm text-muted">Loading...</div>;
  }

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  return <PopupHome onLogout={logout} />;
}

function PopupHome({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [gratitude, setGratitude] = useState('');
  const [gratitudeSaved, setGratitudeSaved] = useState(false);
  const [capture, setCapture] = useState('');
  const [captureMsg, setCaptureMsg] = useState('');

  function load() {
    api.get<DashboardSummary>('/dashboard').then(setData);
    api.get<{ tasks: Task[] }>('/tasks').then((res) => setTasks(res.tasks));
  }
  useEffect(load, []);

  async function saveGratitude() {
    if (!gratitude.trim()) return;
    await api.post('/checkins', { type: '1111', extra: { gratitude } });
    setGratitude('');
    setGratitudeSaved(true);
    setTimeout(() => setGratitudeSaved(false), 2000);
  }

  async function quickCapture(as: 'task' | 'lead') {
    if (!capture.trim()) return;
    try {
      if (as === 'task') {
        await api.post('/tasks', { title: capture, size: 'small' });
      } else {
        await api.post('/leads', { name: capture, status: 'New Lead' });
      }
      setCapture('');
      setCaptureMsg(as === 'task' ? 'Saved as a task.' : 'Saved as a new lead.');
      load();
      setTimeout(() => setCaptureMsg(''), 2000);
    } catch (err) {
      setCaptureMsg(err instanceof ApiError ? err.message : 'Could not save.');
    }
  }

  const big3Done = tasks.filter((t) => t.size === 'big' && t.done).length;
  const totalDone = tasks.filter((t) => t.done).length;

  return (
    <div className="p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <p className="font-extrabold text-ink">What are we creating today?</p>
        </div>
        <button onClick={onLogout} className="text-muted hover:text-red-600">
          <LogOut size={14} />
        </button>
      </div>

      {data && (
        <>
          <Card className="!p-3">
            <p className="text-[10px] font-semibold text-muted uppercase">Today's #1 Priority</p>
            <p className="font-semibold text-ink text-sm mt-0.5">{data.todayFocus.priority || 'Not set yet — open the app to plan today.'}</p>
          </Card>
          <Card className="!p-3">
            <p className="text-[10px] font-semibold text-muted uppercase">Money / Career Move</p>
            <p className="font-semibold text-ink text-sm mt-0.5">{data.todayFocus.moneyMove || 'Not set yet.'}</p>
          </Card>
          <Card className="!p-3">
            <p className="text-[10px] font-semibold text-muted uppercase">Courage Action</p>
            <p className="font-semibold text-ink text-sm mt-0.5">{data.todayFocus.courageAction || 'Not set yet.'}</p>
          </Card>

          <Card className="!p-3">
            <div className="flex justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted uppercase">Task Progress Today</p>
              <span className="text-xs font-bold text-primary">{totalDone}/{tasks.length || 0}</span>
            </div>
            <ProgressBar percent={progressPercent(totalDone, tasks.length || 1)} />
          </Card>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => openWebPage('/focus')} className="btn-primary text-xs flex items-center justify-center gap-1">
          <Timer size={14} /> Focus
        </button>
        <button onClick={() => openWebPage('/focus')} className="btn-secondary text-xs">
          11:11 Reset
        </button>
      </div>

      <Card className="!p-3">
        <p className="text-[10px] font-semibold text-muted uppercase mb-1.5">Quick Gratitude</p>
        <div className="flex gap-1.5">
          <input className="input-field text-xs" value={gratitude} onChange={(e) => setGratitude(e.target.value)} placeholder="I'm grateful for..." />
          <button onClick={saveGratitude} className="btn-primary text-xs px-3">
            Save
          </button>
        </div>
        {gratitudeSaved && <p className="text-[11px] text-primary-dark mt-1">Saved. Good start.</p>}
      </Card>

      <Card className="!p-3">
        <p className="text-[10px] font-semibold text-muted uppercase mb-1.5">Quick Capture</p>
        <input
          className="input-field text-xs mb-1.5"
          value={capture}
          onChange={(e) => setCapture(e.target.value)}
          placeholder="A task or a new lead..."
        />
        <div className="flex gap-1.5">
          <button onClick={() => quickCapture('task')} className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1">
            <Plus size={12} /> Task
          </button>
          <button onClick={() => quickCapture('lead')} className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1">
            <Plus size={12} /> Lead
          </button>
        </div>
        {captureMsg && <p className="text-[11px] text-primary-dark mt-1">{captureMsg}</p>}
      </Card>

      <button onClick={() => openWebPage('/')} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
        Open Full Dashboard <ExternalLink size={14} />
      </button>
    </div>
  );
}
