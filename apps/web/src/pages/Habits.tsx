import { useEffect, useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import type { Habit } from '@mecrm/types';
import { api } from '../lib/api';
import { Card, SectionTitle } from '@mecrm/ui';

function lastSevenDays(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const today = new Date().toISOString().slice(0, 10);

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<{ habitId: number; date: string; done: boolean }[]>([]);
  const [name, setName] = useState('');
  const days = lastSevenDays();

  function load() {
    api
      .get<{ habits: Habit[]; logs: typeof logs }>('/habits')
      .then((res) => {
        setHabits(res.habits);
        setLogs(res.logs);
      })
      .catch(() => {});
  }
  useEffect(load, []);

  async function addHabit() {
    if (!name.trim()) return;
    await api.post('/habits', { name });
    setName('');
    load();
  }

  async function toggle(habitId: number, date: string, current: boolean) {
    await api.post(`/habits/${habitId}/toggle`, { date, done: !current });
    load();
  }

  async function remove(id: number) {
    await api.del(`/habits/${id}`);
    load();
  }

  function isDone(habitId: number, date: string) {
    return logs.find((l) => l.habitId === habitId && l.date === date)?.done || false;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Habits</h1>
        <p className="text-muted mt-1">Small, consistent actions build the life you're picturing.</p>
      </header>

      <Card>
        <SectionTitle>Add a Habit</SectionTitle>
        <div className="flex gap-2">
          <input
            className="input-field"
            placeholder="e.g. Morning Routine, Workout, Water"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addHabit()}
          />
          <button onClick={addHabit} className="btn-primary px-4">
            <Plus size={16} />
          </button>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-[1fr_repeat(7,28px)_28px] gap-1 items-center mb-2">
          <span></span>
          {days.map((d) => (
            <span key={d} className="text-center text-[11px] font-semibold text-muted">
              {DAY_LABELS[new Date(d).getDay()]}
            </span>
          ))}
          <span></span>
        </div>
        <div className="space-y-2">
          {habits.map((h) => (
            <div key={h.id} className="grid grid-cols-[1fr_repeat(7,28px)_28px] gap-1 items-center">
              <span className="text-sm font-medium text-ink truncate">{h.name}</span>
              {days.map((d) => {
                const done = isDone(h.id, d);
                const isToday = d === today;
                return (
                  <button
                    key={d}
                    onClick={() => toggle(h.id, d, done)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                      done ? 'bg-primary border-primary text-white' : isToday ? 'border-primary' : 'border-line'
                    }`}
                  >
                    {done && <Check size={14} />}
                  </button>
                );
              })}
              <button onClick={() => remove(h.id)} className="text-muted hover:text-red-600 justify-self-center">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {habits.length === 0 && (
          <p className="text-sm text-muted">Add one habit that supports the person you're becoming.</p>
        )}
      </Card>
    </div>
  );
}
