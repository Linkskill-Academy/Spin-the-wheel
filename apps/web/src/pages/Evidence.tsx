import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { EvidenceCategory, EvidenceLog } from '@mecrm/types';
import { api } from '../lib/api';
import { Card, SectionTitle, Pill } from '@mecrm/ui';

const CATEGORIES: EvidenceCategory[] = ['Business', 'Money', 'Confidence', 'Discipline', 'Health', 'Family', 'Learning', 'Leadership'];

export default function Evidence() {
  const [items, setItems] = useState<EvidenceLog[]>([]);
  const [category, setCategory] = useState<EvidenceCategory>('Business');
  const [description, setDescription] = useState('');
  const [filter, setFilter] = useState<EvidenceCategory | 'All'>('All');

  function load() {
    api.get<{ evidence: EvidenceLog[] }>('/evidence').then((res) => setItems(res.evidence)).catch(() => {});
  }
  useEffect(load, []);

  async function add() {
    if (!description.trim()) return;
    await api.post('/evidence', { category, description });
    setDescription('');
    load();
  }

  async function remove(id: number) {
    await api.del(`/evidence/${id}`);
    load();
  }

  const filtered = filter === 'All' ? items : items.filter((i) => i.category === filter);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Evidence Log</h1>
        <p className="text-muted mt-1">What evidence did you create today that proves you're becoming capable of your vision?</p>
      </header>

      <Card>
        <div className="flex flex-wrap gap-2 mb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                category === c ? 'border-primary bg-primary-light text-primary-dark' : 'border-line text-muted'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input-field"
            placeholder="Describe the evidence you created today..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button onClick={add} className="btn-primary px-4">
            <Plus size={16} />
          </button>
        </div>
      </Card>

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

      <Card>
        <SectionTitle>Timeline</SectionTitle>
        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-3 border-l-2 border-primary-light pl-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Pill tone="primary">{e.category}</Pill>
                  <span className="text-xs text-muted">{e.date}</span>
                </div>
                <p className="text-sm text-ink">{e.description}</p>
              </div>
              <button onClick={() => remove(e.id)} className="text-muted hover:text-red-600 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted">Complete one meaningful action today and record it here.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
