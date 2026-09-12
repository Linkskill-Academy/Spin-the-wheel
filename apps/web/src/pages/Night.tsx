import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { NightReview } from '@mecrm/types';
import { api } from '../lib/api';
import { Card, SectionTitle } from '@mecrm/ui';

const todayStr = () => new Date().toISOString().slice(0, 10);

type FormState = Omit<NightReview, 'id' | 'userId' | 'date'>;

const empty: FormState = {
  businessWin: '',
  moneyEarned: false,
  moneyLead: false,
  moneyOffer: false,
  moneyFollowup: false,
  moneyAsset: false,
  moneyProduct: false,
  personalWin: '',
  evidence: '',
  lesson: '',
  release: '',
  tomorrowPriority: '',
  completed: false,
};

const MONEY_ACTIONS: { key: keyof FormState; label: string }[] = [
  { key: 'moneyEarned', label: 'Earn money' },
  { key: 'moneyLead', label: 'Generate a lead' },
  { key: 'moneyOffer', label: 'Make an offer' },
  { key: 'moneyFollowup', label: 'Follow up' },
  { key: 'moneyAsset', label: 'Build an asset' },
  { key: 'moneyProduct', label: 'Improve a product' },
];

export default function Night() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ night: (NightReview & { id: number }) | null }>(`/night/${todayStr()}`).then((res) => {
      if (res.night) setForm(res.night);
      setLoaded(true);
    });
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setSaving(true);
    try {
      await api.post('/night', { date: todayStr(), ...form, completed: true });
      navigate('/');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <div className="p-6 text-muted">Loading tonight's review...</div>;

  return (
    <div className="max-w-xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Night Review</h1>
        <p className="text-muted mt-1">Close the day with honesty and evidence.</p>
      </header>

      <Card>
        <SectionTitle>Business Win</SectionTitle>
        <p className="text-sm text-muted mb-2">What did I do today that moved my business forward?</p>
        <textarea className="input-field min-h-[80px]" value={form.businessWin} onChange={(e) => set('businessWin', e.target.value)} />
      </Card>

      <Card>
        <SectionTitle>Money Win</SectionTitle>
        <p className="text-sm text-muted mb-3">Did I...</p>
        <div className="grid grid-cols-2 gap-2">
          {MONEY_ACTIONS.map((a) => (
            <button
              key={a.key}
              onClick={() => set(a.key, !form[a.key])}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium ${
                form[a.key] ? 'border-primary bg-primary-light text-primary-dark' : 'border-line text-ink'
              }`}
            >
              {a.label}
              {form[a.key] ? <Check size={14} /> : null}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Personal Win</SectionTitle>
        <p className="text-sm text-muted mb-2">What did I do well personally?</p>
        <textarea className="input-field min-h-[80px]" value={form.personalWin} onChange={(e) => set('personalWin', e.target.value)} />
      </Card>

      <Card>
        <SectionTitle>Evidence</SectionTitle>
        <p className="text-sm text-muted mb-2">What evidence did I create today?</p>
        <textarea className="input-field min-h-[80px]" value={form.evidence} onChange={(e) => set('evidence', e.target.value)} />
      </Card>

      <Card>
        <SectionTitle>Lesson</SectionTitle>
        <p className="text-sm text-muted mb-2">What did today teach me?</p>
        <textarea className="input-field min-h-[70px]" value={form.lesson} onChange={(e) => set('lesson', e.target.value)} />
      </Card>

      <Card>
        <SectionTitle>Release</SectionTitle>
        <p className="text-sm text-muted mb-2">What am I choosing not to carry into tomorrow?</p>
        <textarea className="input-field min-h-[70px]" value={form.release} onChange={(e) => set('release', e.target.value)} />
      </Card>

      <Card>
        <SectionTitle>Tomorrow</SectionTitle>
        <p className="text-sm text-muted mb-2">What is tomorrow's #1 priority?</p>
        <input className="input-field" value={form.tomorrowPriority} onChange={(e) => set('tomorrowPriority', e.target.value)} />
      </Card>

      <button disabled={saving} onClick={submit} className="btn-primary w-full">
        {saving ? 'Saving...' : 'Complete Night Review'}
      </button>
      <p className="text-center text-sm text-muted italic pb-4">
        "My actions today are evidence of the future I am creating."
      </p>
    </div>
  );
}
