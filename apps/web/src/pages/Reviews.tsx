import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../lib/api';
import { Card, SectionTitle } from '@mecrm/ui';

type Tab = 'Weekly' | 'Monthly';

function weekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
function monthStr(): string {
  return new Date().toISOString().slice(0, 7);
}

interface WeeklyData {
  revenue: string;
  profit: string;
  leads: string;
  salesConversations: string;
  conversions: string;
  wins: string;
  misses: string;
  lessons: string;
  bottleneck: string;
  nextWeekGoal: string;
  topPriorities: string;
  stop: string;
  start: string;
  continueDoing: string;
}

const emptyWeekly: WeeklyData = {
  revenue: '',
  profit: '',
  leads: '',
  salesConversations: '',
  conversions: '',
  wins: '',
  misses: '',
  lessons: '',
  bottleneck: '',
  nextWeekGoal: '',
  topPriorities: '',
  stop: '',
  start: '',
  continueDoing: '',
};

interface MonthlyData {
  businessRevenue: string;
  businessExpenses: string;
  profit: string;
  personalSavings: string;
  investments: string;
  debt: string;
  newAssets: string;
  leads: string;
  sales: string;
  conversionRate: string;
}

const emptyMonthly: MonthlyData = {
  businessRevenue: '',
  businessExpenses: '',
  profit: '',
  personalSavings: '',
  investments: '',
  debt: '',
  newAssets: '',
  leads: '',
  sales: '',
  conversionRate: '',
};

export default function Reviews() {
  const [tab, setTab] = useState<Tab>('Weekly');
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Weekly & Monthly Review</h1>
        <p className="text-muted mt-1">Zoom out. Learn. Set the next target.</p>
      </header>
      <div className="flex gap-2">
        {(['Weekly', 'Monthly'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${
              tab === t ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-line'
            }`}
          >
            {t} Review
          </button>
        ))}
      </div>
      {tab === 'Weekly' ? <WeeklyReview /> : <MonthlyReview />}
    </div>
  );
}

function WeeklyReview() {
  const [data, setData] = useState<WeeklyData>(emptyWeekly);
  const [saving, setSaving] = useState(false);
  const ws = weekStart();

  useEffect(() => {
    api.get<{ review: { data: Partial<WeeklyData> } | null }>(`/reviews/weekly/${ws}`).then((res) => {
      if (res.review) setData({ ...emptyWeekly, ...res.review.data });
    });
  }, [ws]);

  function set<K extends keyof WeeklyData>(key: K, value: WeeklyData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.post('/reviews/weekly', { weekStart: ws, data });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>This Week's Numbers</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Revenue (₹)" value={data.revenue} onChange={(v) => set('revenue', v)} />
          <NumField label="Profit (₹)" value={data.profit} onChange={(v) => set('profit', v)} />
          <NumField label="Leads" value={data.leads} onChange={(v) => set('leads', v)} />
          <NumField label="Sales Conversations" value={data.salesConversations} onChange={(v) => set('salesConversations', v)} />
          <NumField label="Conversions" value={data.conversions} onChange={(v) => set('conversions', v)} />
        </div>
      </Card>

      <Card>
        <SectionTitle>Reflection</SectionTitle>
        <TextField label="Wins" value={data.wins} onChange={(v) => set('wins', v)} />
        <TextField label="Misses" value={data.misses} onChange={(v) => set('misses', v)} />
        <TextField label="Lessons" value={data.lessons} onChange={(v) => set('lessons', v)} />
        <TextField label="Bottleneck" value={data.bottleneck} onChange={(v) => set('bottleneck', v)} />
      </Card>

      <Card>
        <SectionTitle>Next Week</SectionTitle>
        <TextField label="Next Week's #1 Goal" value={data.nextWeekGoal} onChange={(v) => set('nextWeekGoal', v)} />
        <TextField label="Top 3 Priorities" value={data.topPriorities} onChange={(v) => set('topPriorities', v)} />
        <div className="grid grid-cols-3 gap-2 mt-2">
          <TextField label="Stop" value={data.stop} onChange={(v) => set('stop', v)} compact />
          <TextField label="Start" value={data.start} onChange={(v) => set('start', v)} compact />
          <TextField label="Continue" value={data.continueDoing} onChange={(v) => set('continueDoing', v)} compact />
        </div>
      </Card>

      <div className="card bg-primary-light border-primary/20">
        <p className="text-sm font-semibold text-primary-dark">Your vision was supported this week by:</p>
        <p className="text-sm text-primary-dark mt-1">{data.wins || 'Add your wins above to see them here.'}</p>
      </div>
      <div className="card bg-amber-50 border-amber-100">
        <p className="text-sm font-semibold text-amber-800">Your vision was weakened this week by:</p>
        <p className="text-sm text-amber-800 mt-1">{data.misses || 'Add your misses above — no judgment, just information.'}</p>
      </div>

      <button disabled={saving} onClick={save} className="btn-primary w-full">
        {saving ? 'Saving...' : 'Save Weekly Review'}
      </button>
    </div>
  );
}

function MonthlyReview() {
  const [data, setData] = useState<MonthlyData>(emptyMonthly);
  const [trend, setTrend] = useState<Record<string, unknown>[]>([]);
  const [saving, setSaving] = useState(false);
  const m = monthStr();

  useEffect(() => {
    api.get<{ review: { data: Partial<MonthlyData> } | null }>(`/reviews/monthly/${m}`).then((res) => {
      if (res.review) setData({ ...emptyMonthly, ...res.review.data });
    });
    api.get<{ trend: Record<string, unknown>[] }>('/reviews/monthly-trend').then((res) => setTrend(res.trend));
  }, [m]);

  function set<K extends keyof MonthlyData>(key: K, value: MonthlyData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.post('/reviews/monthly', { month: m, data });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Trend</SectionTitle>
        {trend.length > 1 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" stroke="#166534" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#6B7280" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted">Log a few months of money entries to see your trend here.</p>
        )}
      </Card>

      <Card>
        <SectionTitle>This Month</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Business Revenue" value={data.businessRevenue} onChange={(v) => set('businessRevenue', v)} />
          <NumField label="Business Expenses" value={data.businessExpenses} onChange={(v) => set('businessExpenses', v)} />
          <NumField label="Profit" value={data.profit} onChange={(v) => set('profit', v)} />
          <NumField label="Personal Savings" value={data.personalSavings} onChange={(v) => set('personalSavings', v)} />
          <NumField label="Investments" value={data.investments} onChange={(v) => set('investments', v)} />
          <NumField label="Debt" value={data.debt} onChange={(v) => set('debt', v)} />
          <NumField label="New Assets" value={data.newAssets} onChange={(v) => set('newAssets', v)} />
          <NumField label="Leads" value={data.leads} onChange={(v) => set('leads', v)} />
          <NumField label="Sales" value={data.sales} onChange={(v) => set('sales', v)} />
          <NumField label="Conversion Rate (%)" value={data.conversionRate} onChange={(v) => set('conversionRate', v)} />
        </div>
      </Card>

      <button disabled={saving} onClick={save} className="btn-primary w-full">
        {saving ? 'Saving...' : 'Save Monthly Review'}
      </button>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted uppercase block mb-1">{label}</label>
      <input className="input-field" type="number" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="text-xs font-semibold text-muted uppercase block mb-1">{label}</label>
      {compact ? (
        <input className="input-field text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <textarea className="input-field min-h-[60px]" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
