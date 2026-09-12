import { useEffect, useState } from 'react';
import { Plus, Trash2, Play, Pause, RotateCcw, Check } from 'lucide-react';
import type { Task, TaskSize } from '@mecrm/types';
import { api, ApiError } from '../lib/api';
import { Card, SectionTitle, Pill } from '@mecrm/ui';

const TABS = ['Focus Session', 'Quick Check-in', '11:11 Reset', '22:22 Builder', '3-3-3 Reset'] as const;
type Tab = (typeof TABS)[number];

export default function Focus() {
  const [tab, setTab] = useState<Tab>('Focus Session');
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Focus</h1>
        <p className="text-muted mt-1">Protect your attention. One action at a time.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border ${
              tab === t ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-line'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Focus Session' && <FocusSession />}
      {tab === 'Quick Check-in' && <QuickCheckin />}
      {tab === '11:11 Reset' && <Reset1111 />}
      {tab === '22:22 Builder' && <Builder2222 />}
      {tab === '3-3-3 Reset' && <Reset333 />}
    </div>
  );
}

const LIMITS: Record<TaskSize, number> = { big: 1, medium: 3, small: 5 };
const SIZE_LABELS: Record<TaskSize, string> = { big: '1 Big Task', medium: '3 Medium Tasks', small: '5 Small Tasks' };

function FocusSession() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [size, setSize] = useState<TaskSize>('big');
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  function load() {
    api.get<{ tasks: Task[] }>('/tasks').then((res) => setTasks(res.tasks));
  }
  useEffect(load, []);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, secondsLeft]);

  async function addTask() {
    if (!title.trim()) return;
    setError('');
    try {
      await api.post('/tasks', { title, size });
      setTitle('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add task.');
    }
  }

  async function toggleDone(t: Task) {
    await api.patch(`/tasks/${t.id}`, { done: !t.done });
    load();
  }

  async function removeTask(id: number) {
    await api.del(`/tasks/${id}`);
    load();
  }

  function startTimer(mins: number) {
    setDuration(mins);
    setSecondsLeft(mins * 60);
    setRunning(true);
  }

  const bySize = (s: TaskSize) => tasks.filter((t) => t.size === s);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Focus Timer</SectionTitle>
        <div className="text-center">
          <p className="text-5xl font-extrabold text-ink my-4 tabular-nums">
            {mm}:{ss}
          </p>
          <div className="flex justify-center gap-2 mb-4">
            {[25, 45, 60].map((m) => (
              <button
                key={m}
                onClick={() => startTimer(m)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                  duration === m ? 'border-primary bg-primary-light text-primary-dark' : 'border-line text-muted'
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-2">
            <button onClick={() => setRunning((r) => !r)} className="btn-primary flex items-center gap-2">
              {running ? <Pause size={16} /> : <Play size={16} />} {running ? 'Pause' : 'Start Focus Session'}
            </button>
            <button
              onClick={() => {
                setRunning(false);
                setSecondsLeft(duration * 60);
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>1-3-5 Today</SectionTitle>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>}

        {(['big', 'medium', 'small'] as TaskSize[]).map((s) => (
          <div key={s} className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Pill tone="primary">{SIZE_LABELS[s]}</Pill>
              <span className="text-xs text-muted">
                {bySize(s).length}/{LIMITS[s]}
              </span>
            </div>
            <div className="space-y-2">
              {bySize(s).map((t) => (
                <div key={t.id} className="flex items-center gap-2 bg-softbg rounded-xl px-3 py-2.5">
                  <button
                    onClick={() => toggleDone(t)}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      t.done ? 'bg-primary border-primary' : 'border-line'
                    }`}
                  >
                    {t.done && <Check size={12} className="text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${t.done ? 'line-through text-muted' : 'text-ink'}`}>{t.title}</span>
                  <button onClick={() => removeTask(t.id)} className="text-muted hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex gap-2 mt-2">
          <select value={size} onChange={(e) => setSize(e.target.value as TaskSize)} className="input-field w-32">
            <option value="big">Big</option>
            <option value="medium">Medium</option>
            <option value="small">Small</option>
          </select>
          <input
            className="input-field flex-1"
            placeholder="Add a task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
          <button onClick={addTask} className="btn-primary px-4">
            <Plus size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
}

function QuickCheckin() {
  const [completedTasks, setCompletedTasks] = useState('');
  const [pendingTasks, setPendingTasks] = useState('');
  const [distractions, setDistractions] = useState('');
  const [oneTask, setOneTask] = useState('');
  const [saved, setSaved] = useState(false);

  async function reset() {
    await api.post('/checkins', { type: 'quick', completedTasks, pendingTasks, distractions, oneTask });
    setSaved(true);
  }

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink mb-1">What have you completed?</p>
        <textarea className="input-field min-h-[70px]" value={completedTasks} onChange={(e) => setCompletedTasks(e.target.value)} />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink mb-1">What is pending?</p>
        <textarea className="input-field min-h-[70px]" value={pendingTasks} onChange={(e) => setPendingTasks(e.target.value)} />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink mb-1">What distracted you?</p>
        <textarea className="input-field min-h-[70px]" value={distractions} onChange={(e) => setDistractions(e.target.value)} />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink mb-1">What ONE task would make the rest of today successful?</p>
        <input className="input-field" value={oneTask} onChange={(e) => setOneTask(e.target.value)} />
      </div>
      <button onClick={reset} className="btn-primary w-full">
        Reset My Focus
      </button>
      {saved && oneTask && (
        <div className="bg-primary-light rounded-xl px-4 py-3 text-primary-dark font-semibold">Your next move: {oneTask}</div>
      )}
    </Card>
  );
}

function Reset1111() {
  const [gratitude, setGratitude] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [done, setDone] = useState(false);

  async function doIt() {
    await api.post('/checkins', { type: '1111', oneTask: nextAction, extra: { gratitude } });
    setDone(true);
  }

  return (
    <Card className="space-y-4 text-center">
      <p className="text-lg font-extrabold text-ink">STOP</p>
      <p className="text-muted">Pause whatever you're doing for a moment.</p>
      <p className="text-lg font-extrabold text-ink">BREATHE</p>
      <p className="text-muted">Take one slow, deep breath.</p>
      <p className="text-lg font-extrabold text-ink">REMEMBER YOUR VISION</p>
      <p className="text-muted">Picture where this day is taking you.</p>
      <div className="text-left">
        <p className="text-sm font-semibold text-ink mb-1">One gratitude, right now</p>
        <input className="input-field" value={gratitude} onChange={(e) => setGratitude(e.target.value)} />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-ink mb-1">What is the next action my future self would take?</p>
        <input className="input-field" value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
      </div>
      <button onClick={doIt} className="btn-primary w-full">
        Do It Now
      </button>
      {done && <p className="text-primary-dark font-semibold">Good. Go do that one thing.</p>}
    </Card>
  );
}

const BUILD_AREAS = ['Sales', 'Marketing', 'Lead Generation', 'Courses', 'Partnerships', 'Team', 'Finances', 'Content', 'Personal Discipline'];

function Builder2222() {
  const [area, setArea] = useState('Sales');
  const [problem, setProblem] = useState('');
  const [system, setSystem] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [saved, setSaved] = useState(false);

  async function save() {
    await api.post('/checkins', { type: '2222', oneTask: nextAction, extra: { area, problem, system } });
    setSaved(true);
  }

  return (
    <Card className="space-y-4">
      <p className="text-sm font-semibold text-ink">What system am I building instead of depending on motivation?</p>
      <div className="flex flex-wrap gap-2">
        {BUILD_AREAS.map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              area === a ? 'border-primary bg-primary-light text-primary-dark' : 'border-line text-muted'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-ink mb-1">Current problem</p>
        <textarea className="input-field min-h-[70px]" value={problem} onChange={(e) => setProblem(e.target.value)} />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink mb-1">System to create</p>
        <textarea className="input-field min-h-[70px]" value={system} onChange={(e) => setSystem(e.target.value)} />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink mb-1">Next action</p>
        <input className="input-field" value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
      </div>
      <button onClick={save} className="btn-primary w-full">
        Save Build Note
      </button>
      {saved && <p className="text-primary-dark font-semibold text-center">System captured. One action can start it now.</p>}
    </Card>
  );
}

function Reset333() {
  const [g, setG] = useState(['', '', '']);
  const [achieved, setAchieved] = useState(['', '', '']);
  const [actions, setActions] = useState(['', '', '']);
  const [chosen, setChosen] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  function updateArr(arr: string[], set: (v: string[]) => void, i: number, val: string) {
    const copy = [...arr];
    copy[i] = val;
    set(copy);
  }

  async function start() {
    if (chosen === null) return;
    await api.post('/checkins', {
      type: '333',
      oneTask: actions[chosen],
      extra: { gratitude: g, achieved, actions },
    });
    setSaved(true);
  }

  return (
    <Card className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-ink mb-2">3 things I am grateful for</p>
        {g.map((v, i) => (
          <input key={i} className="input-field mb-2" value={v} onChange={(e) => updateArr(g, setG, i, e.target.value)} />
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-ink mb-2">3 things I have already achieved</p>
        {achieved.map((v, i) => (
          <input key={i} className="input-field mb-2" value={v} onChange={(e) => updateArr(achieved, setAchieved, i, e.target.value)} />
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-ink mb-2">3 actions I can take next</p>
        {actions.map((v, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input className="input-field flex-1" value={v} onChange={(e) => updateArr(actions, setActions, i, e.target.value)} />
            <button
              onClick={() => setChosen(i)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                chosen === i ? 'bg-primary border-primary text-white' : 'border-line'
              }`}
            >
              {chosen === i && <Check size={14} />}
            </button>
          </div>
        ))}
        <p className="text-xs text-muted">Tap the circle to choose your ONE action to start now.</p>
      </div>
      <button disabled={chosen === null} onClick={start} className="btn-primary w-full">
        Start This Action Now
      </button>
      {saved && <p className="text-primary-dark font-semibold text-center">Momentum starts with this one move.</p>}
    </Card>
  );
}
