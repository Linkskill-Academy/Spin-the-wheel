import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { MoneyEntry, MoneyEntryType, MoneyGoals } from '@mecrm/types';
import { formatCurrencyINR, progressPercent, combinationsTotal, type RevenueCombination } from '@mecrm/shared';
import { api } from '../lib/api';
import { Card, ProgressBar, SectionTitle } from '@mecrm/ui';

const ENTRY_TYPES: MoneyEntryType[] = ['revenue', 'expense', 'profit', 'savings', 'investment', 'asset', 'debt'];

export default function Money() {
  const [current, setCurrent] = useState<Record<string, number> | null>(null);
  const [goals, setGoals] = useState<MoneyGoals | null>(null);
  const [entries, setEntries] = useState<MoneyEntry[]>([]);
  const [type, setType] = useState<MoneyEntryType>('revenue');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  function load() {
    api.get<{ current: Record<string, number>; goals: MoneyGoals | null }>('/money/summary').then((res) => {
      setCurrent(res.current);
      setGoals(res.goals);
    });
    api.get<{ entries: MoneyEntry[] }>('/money/entries').then((res) => setEntries(res.entries));
  }
  useEffect(load, []);

  async function addEntry() {
    if (!amount) return;
    await api.post('/money/entries', { type, amount: Number(amount), note });
    setAmount('');
    setNote('');
    load();
  }

  async function removeEntry(id: number) {
    await api.del(`/money/entries/${id}`);
    load();
  }

  if (!current) return <div className="p-6 text-muted">Loading your money picture...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Money</h1>
        <p className="text-muted mt-1">Value → Visibility → Offer → Sales → Delivery → Reputation → Wealth.</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <MoneyCard label="Monthly Revenue" current={current.revenue} target={goals?.monthlyRevenueTarget || 0} />
        <MoneyCard label="Profit" current={current.profit} target={goals?.monthlyProfitTarget || 0} />
        <MoneyCard label="Savings" current={current.savings} target={goals?.savingsTarget || 0} />
        <MoneyCard label="Investments" current={current.investment} target={0} showGap={false} />
      </div>

      <Card>
        <SectionTitle>Add Entry</SectionTitle>
        <div className="grid sm:grid-cols-4 gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as MoneyEntryType)} className="input-field capitalize">
            {ENTRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input className="input-field" type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="input-field sm:col-span-1" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
          <button onClick={addEntry} className="btn-primary flex items-center justify-center gap-2">
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between bg-softbg rounded-xl px-3 py-2.5">
              <div>
                <span className="text-xs font-semibold uppercase text-primary">{e.type}</span>
                <p className="text-sm text-ink font-medium">{formatCurrencyINR(e.amount)}</p>
                {e.note && <p className="text-xs text-muted">{e.note}</p>}
              </div>
              <button onClick={() => removeEntry(e.id)} className="text-muted hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-muted">No entries yet this month.</p>}
        </div>
      </Card>

      <ReverseCalculator goalDefault={goals?.monthlyRevenueTarget || 1000000} />
    </div>
  );
}

function MoneyCard({
  label,
  current,
  target,
  showGap = true,
}: {
  label: string;
  current: number;
  target: number;
  showGap?: boolean;
}) {
  const percent = progressPercent(current, target);
  const gap = Math.max(target - current, 0);
  return (
    <Card>
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-extrabold text-ink">{formatCurrencyINR(current)}</p>
      {target > 0 && (
        <>
          <p className="text-xs text-muted mt-1">Target: {formatCurrencyINR(target)}</p>
          <div className="mt-3">
            <ProgressBar percent={percent} />
          </div>
          {showGap && <p className="text-xs text-muted mt-2">Gap: {formatCurrencyINR(gap)}</p>}
        </>
      )}
    </Card>
  );
}

function ReverseCalculator({ goalDefault }: { goalDefault: number }) {
  const [goal, setGoal] = useState(String(goalDefault));
  const [combos, setCombos] = useState<RevenueCombination[]>([
    { label: 'Customers', units: 100, pricePerUnit: 10000 },
  ]);

  function updateCombo(i: number, patch: Partial<RevenueCombination>) {
    setCombos((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addCombo() {
    setCombos((cs) => [...cs, { label: 'New combination', units: 10, pricePerUnit: 50000 }]);
  }
  function removeCombo(i: number) {
    setCombos((cs) => cs.filter((_, idx) => idx !== i));
  }

  const total = combinationsTotal(combos);
  const goalNum = Number(goal) || 0;
  const percent = progressPercent(total, goalNum);

  return (
    <Card>
      <SectionTitle>Reverse-Engineer Your Goal</SectionTitle>
      <p className="text-sm text-muted mb-3">
        Work backwards from the number. Model how you'll actually reach {formatCurrencyINR(goalNum)}.
      </p>
      <input className="input-field mb-4" type="number" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal amount" />

      <div className="space-y-2">
        {combos.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
            <input className="input-field" value={c.label} onChange={(e) => updateCombo(i, { label: e.target.value })} />
            <input
              className="input-field"
              type="number"
              value={c.units}
              onChange={(e) => updateCombo(i, { units: Number(e.target.value) })}
            />
            <input
              className="input-field"
              type="number"
              value={c.pricePerUnit}
              onChange={(e) => updateCombo(i, { pricePerUnit: Number(e.target.value) })}
            />
            <button onClick={() => removeCombo(i)} className="text-muted hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={addCombo} className="btn-secondary mt-3 flex items-center gap-2">
        <Plus size={14} /> Add Combination
      </button>

      <div className="mt-5 bg-softbg rounded-xl p-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-muted">Modeled total</span>
          <span className="font-bold text-ink">{formatCurrencyINR(total)}</span>
        </div>
        <ProgressBar percent={percent} />
        <p className="text-xs text-muted mt-2">{percent}% of your goal modeled</p>
      </div>
    </Card>
  );
}
