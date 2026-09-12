import { useEffect, useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import type { Goal, GoalCategory } from '@mecrm/types';
import { progressPercent } from '@mecrm/shared';
import { api } from '../lib/api';
import { Card, ProgressBar, SectionTitle, Pill } from '@mecrm/ui';

const CATEGORIES: GoalCategory[] = [
  'Business',
  'Money',
  'Home',
  'Family',
  'Health',
  'Career',
  'Lifestyle',
  'Learning',
  'Impact',
];

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<GoalCategory | 'All'>('All');

  function load() {
    api.get<{ goals: Goal[] }>('/goals').then((res) => setGoals(res.goals));
  }
  useEffect(load, []);

  async function updateProgress(g: Goal, value: number) {
    await api.patch(`/goals/${g.id}`, { progressCurrent: value });
    load();
  }

  async function remove(id: number) {
    await api.del(`/goals/${id}`);
    load();
  }

  const filtered = filter === 'All' ? goals : goals.filter((g) => g.category === filter);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Vision & Goals</h1>
          <p className="text-muted mt-1">Every vision becomes a today action.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Goal
        </button>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('All')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
            filter === 'All' ? 'border-primary bg-primary-light text-primary-dark' : 'border-line text-muted'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
              filter === c ? 'border-primary bg-primary-light text-primary-dark' : 'border-line text-muted'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <Card className="text-center text-muted">No goals in this category yet.</Card>}

      {filtered.map((g) => (
        <Card key={g.id}>
          <div className="flex items-start justify-between">
            <div>
              <Pill>{g.category}</Pill>
              <h3 className="font-bold text-ink text-lg mt-2">{g.title}</h3>
              <p className="text-sm text-muted mt-1">{g.vision}</p>
            </div>
            <button onClick={() => remove(g.id)} className="text-muted hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted">
                {g.progressCurrent} / {g.progressTarget} {g.unit}
              </span>
              <span className="font-semibold text-primary">{progressPercent(g.progressCurrent, g.progressTarget)}%</span>
            </div>
            <ProgressBar percent={progressPercent(g.progressCurrent, g.progressTarget)} />
            <input
              type="range"
              min={0}
              max={g.progressTarget}
              value={g.progressCurrent}
              onChange={(e) => updateProgress(g, Number(e.target.value))}
              className="w-full mt-2 accent-[#16A34A]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-sm">
            <MiniTarget label="90-Day" value={g.target90d} />
            <MiniTarget label="30-Day" value={g.target30d} />
            <MiniTarget label="This Week" value={g.targetWeekly} />
            <MiniTarget label="Today" value={g.todayAction} />
          </div>
        </Card>
      ))}

      {showForm && <GoalForm onClose={() => setShowForm(false)} onSaved={load} />}
    </div>
  );
}

function MiniTarget({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-softbg rounded-xl p-2.5">
      <p className="text-[10px] font-semibold text-muted uppercase">{label}</p>
      <p className="text-xs font-semibold text-ink mt-0.5 line-clamp-2">{value || '—'}</p>
    </div>
  );
}

function GoalForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [category, setCategory] = useState<GoalCategory>('Business');
  const [title, setTitle] = useState('');
  const [vision, setVision] = useState('');
  const [target12m, setTarget12m] = useState('');
  const [target90d, setTarget90d] = useState('');
  const [target30d, setTarget30d] = useState('');
  const [targetWeekly, setTargetWeekly] = useState('');
  const [todayAction, setTodayAction] = useState('');
  const [progressTarget, setProgressTarget] = useState('100');
  const [unit, setUnit] = useState('%');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.post('/goals', {
        category,
        title,
        vision,
        target12m,
        target90d,
        target30d,
        targetWeekly,
        todayAction,
        progressCurrent: 0,
        progressTarget: Number(progressTarget) || 100,
        unit,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink">New Goal</h2>
          <button onClick={onClose}>
            <X size={20} className="text-muted" />
          </button>
        </div>
        <div className="space-y-3">
          <select value={category} onChange={(e) => setCategory(e.target.value as GoalCategory)} className="input-field">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input className="input-field" placeholder="Goal title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="input-field" placeholder="Vision (what does this look like fully achieved?)" value={vision} onChange={(e) => setVision(e.target.value)} />
          <input className="input-field" placeholder="12-Month target" value={target12m} onChange={(e) => setTarget12m(e.target.value)} />
          <input className="input-field" placeholder="90-Day target" value={target90d} onChange={(e) => setTarget90d(e.target.value)} />
          <input className="input-field" placeholder="30-Day target" value={target30d} onChange={(e) => setTarget30d(e.target.value)} />
          <input className="input-field" placeholder="This week's target" value={targetWeekly} onChange={(e) => setTargetWeekly(e.target.value)} />
          <input className="input-field" placeholder="Today's action" value={todayAction} onChange={(e) => setTodayAction(e.target.value)} />
          <div className="flex gap-2">
            <input className="input-field" type="number" placeholder="Target number" value={progressTarget} onChange={(e) => setProgressTarget(e.target.value)} />
            <input className="input-field w-24" placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>
        <button disabled={saving} onClick={save} className="btn-primary w-full mt-5">
          {saving ? 'Saving...' : 'Create Goal'}
        </button>
      </div>
    </div>
  );
}
