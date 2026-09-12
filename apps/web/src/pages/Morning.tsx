import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Play } from 'lucide-react';
import type { MorningRoutine } from '@mecrm/types';
import { api } from '../lib/api';
import { Card } from '@mecrm/ui';

const todayStr = () => new Date().toISOString().slice(0, 10);

type FormState = Omit<MorningRoutine, 'id' | 'userId' | 'date'>;

const empty: FormState = {
  gratitude1: '',
  gratitude2: '',
  gratitude3: '',
  futureSelf: '',
  manifestationStatement: '',
  repeat3Done: false,
  repeat6Done: false,
  repeat9Done: false,
  visualizationSee: '',
  visualizationHear: '',
  visualizationFeel: '',
  visualizationWho: '',
  visualizationResult: '',
  big3Revenue: '',
  big3Growth: '',
  big3Personal: '',
  moneyMove: '',
  courageAction: '',
  clarity: 5,
  energy: 5,
  confidence: 5,
  focus: 5,
  completed: false,
};

const STEP_TITLES = [
  'Gratitude',
  'Future Self',
  'Manifestation Statement',
  '3-6-9 Practice',
  'Visualization',
  "Today's Big 3",
  'Money-Making Move',
  'Courage Action',
  'Morning Score',
];

export default function Morning() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    api
      .get<{ morning: (MorningRoutine & { id: number }) | null }>(`/morning/${todayStr()}`)
      .then((res) => {
        if (res.morning) setForm(res.morning);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    if (timerSeconds <= 0) {
      setTimerRunning(false);
      return;
    }
    const t = setTimeout(() => setTimerSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerRunning, timerSeconds]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(completed: boolean) {
    setSaving(true);
    try {
      await api.post('/morning', { date: todayStr(), ...form, completed });
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    await save(true);
    navigate('/');
  }

  if (!loaded) return <div className="p-6 text-muted">Loading this morning...</div>;

  const isLast = step === STEP_TITLES.length - 1;

  return (
    <div className="max-w-xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <h1 className="text-2xl font-extrabold text-ink mb-1">Good morning.</h1>
      <p className="text-muted mb-6">What are we creating today?</p>

      <div className="flex gap-1.5 mb-6">
        {STEP_TITLES.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-line'}`} />
        ))}
      </div>

      <Card>
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">{STEP_TITLES[step]}</p>

        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted mb-2">Three things you're grateful for right now.</p>
            <input className="input-field" placeholder="Gratitude 1" value={form.gratitude1} onChange={(e) => set('gratitude1', e.target.value)} />
            <input className="input-field" placeholder="Gratitude 2" value={form.gratitude2} onChange={(e) => set('gratitude2', e.target.value)} />
            <input className="input-field" placeholder="Gratitude 3" value={form.gratitude3} onChange={(e) => set('gratitude3', e.target.value)} />
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="text-sm text-muted mb-2">
              If the most successful version of you were living today, how would she behave?
            </p>
            <textarea className="input-field min-h-[120px]" value={form.futureSelf} onChange={(e) => set('futureSelf', e.target.value)} />
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-sm text-muted mb-2">Create or update today's manifestation statement.</p>
            <textarea
              className="input-field min-h-[100px]"
              placeholder="I am building..."
              value={form.manifestationStatement}
              onChange={(e) => set('manifestationStatement', e.target.value)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted mb-2">
              Write your intention 3 times this morning, 6 times this afternoon, 9 times tonight — or simply tap to acknowledge
              each round and carry it into action.
            </p>
            <RepeatRow label="Morning ×3" done={form.repeat3Done} onToggle={() => set('repeat3Done', !form.repeat3Done)} />
            <RepeatRow label="Afternoon ×6" done={form.repeat6Done} onToggle={() => set('repeat6Done', !form.repeat6Done)} />
            <RepeatRow label="Night ×9" done={form.repeat9Done} onToggle={() => set('repeat9Done', !form.repeat9Done)} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-4 bg-softbg rounded-xl py-6">
              <span className="text-3xl font-extrabold text-ink">{timerSeconds}s</span>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => {
                  if (!timerRunning) setTimerSeconds(60);
                  setTimerRunning((r) => !r);
                }}
              >
                <Play size={16} /> {timerRunning ? 'Pause' : 'Start Visualization'}
              </button>
            </div>
            <input className="input-field" placeholder="What do I see?" value={form.visualizationSee} onChange={(e) => set('visualizationSee', e.target.value)} />
            <input className="input-field" placeholder="What do I hear?" value={form.visualizationHear} onChange={(e) => set('visualizationHear', e.target.value)} />
            <input className="input-field" placeholder="How do I feel?" value={form.visualizationFeel} onChange={(e) => set('visualizationFeel', e.target.value)} />
            <input className="input-field" placeholder="Who is around me?" value={form.visualizationWho} onChange={(e) => set('visualizationWho', e.target.value)} />
            <input className="input-field" placeholder="What result has happened?" value={form.visualizationResult} onChange={(e) => set('visualizationResult', e.target.value)} />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <input className="input-field" placeholder="Revenue / Business Action" value={form.big3Revenue} onChange={(e) => set('big3Revenue', e.target.value)} />
            <input className="input-field" placeholder="Growth / Visibility Action" value={form.big3Growth} onChange={(e) => set('big3Growth', e.target.value)} />
            <input className="input-field" placeholder="Personal / Family Action" value={form.big3Personal} onChange={(e) => set('big3Personal', e.target.value)} />
          </div>
        )}

        {step === 6 && (
          <div>
            <p className="text-sm text-muted mb-2">
              What action today has the highest probability of generating revenue or creating a future revenue opportunity?
            </p>
            <textarea className="input-field min-h-[100px]" value={form.moneyMove} onChange={(e) => set('moneyMove', e.target.value)} />
          </div>
        )}

        {step === 7 && (
          <div>
            <p className="text-sm text-muted mb-2">What am I avoiding because it feels uncomfortable?</p>
            <textarea className="input-field min-h-[100px]" value={form.courageAction} onChange={(e) => set('courageAction', e.target.value)} />
          </div>
        )}

        {step === 8 && (
          <div className="space-y-4">
            <ScoreSlider label="Clarity" value={form.clarity} onChange={(v) => set('clarity', v)} />
            <ScoreSlider label="Energy" value={form.energy} onChange={(v) => set('energy', v)} />
            <ScoreSlider label="Confidence" value={form.confidence} onChange={(v) => set('confidence', v)} />
            <ScoreSlider label="Focus" value={form.focus} onChange={(v) => set('focus', v)} />
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button className="btn-secondary flex items-center gap-2" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {!isLast ? (
            <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={() => setStep((s) => s + 1)}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={finish}>
              <Check size={16} /> {saving ? 'Saving...' : 'Complete Morning Routine'}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

function RepeatRow({ label, done, onToggle }: { label: string; done: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold ${
        done ? 'border-primary bg-primary-light text-primary-dark' : 'border-line text-ink'
      }`}
    >
      {label}
      {done && <Check size={16} />}
    </button>
  );
}

function ScoreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="text-sm font-bold text-primary">{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#16A34A]"
      />
    </div>
  );
}
