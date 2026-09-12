import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Search } from 'lucide-react';
import type { CollegeOutreach, CollegeStatus } from '@mecrm/types';
import { formatCurrencyINR, progressPercent } from '@mecrm/shared';
import { api } from '../lib/api';
import { Card, ProgressBar, Pill } from '@mecrm/ui';

const STATUSES: CollegeStatus[] = ['To Contact', 'Contacted', 'Interested', 'Meeting', 'Proposal', 'Negotiation', 'Won', 'Not Now'];
const today = new Date().toISOString().slice(0, 10);

export default function Colleges() {
  const [colleges, setColleges] = useState<CollegeOutreach[]>([]);
  const [stats, setStats] = useState<{ contactedToday: number; dailyTarget: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<CollegeStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CollegeOutreach | null>(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    const params = new URLSearchParams();
    if (statusFilter !== 'All') params.set('status', statusFilter);
    if (search) params.set('search', search);
    api.get<{ colleges: CollegeOutreach[] }>(`/colleges?${params.toString()}`).then((res) => setColleges(res.colleges));
    api.get<{ stats: { contactedToday: number; dailyTarget: number } }>('/colleges/stats').then((res) => setStats(res.stats));
  }
  useEffect(load, [statusFilter, search]);

  async function markContacted(c: CollegeOutreach) {
    await api.patch(`/colleges/${c.id}`, { lastContacted: today, status: c.status === 'To Contact' ? 'Contacted' : c.status });
    load();
  }

  async function remove(id: number) {
    await api.del(`/colleges/${id}`);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">College Outreach</h1>
          <p className="text-muted mt-1">Every college is a chance to reach hundreds of students.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add College
        </button>
      </header>

      {stats && (
        <Card>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-ink">Today's Contact Target</span>
            <span className="text-sm font-bold text-primary">
              {stats.contactedToday} / {stats.dailyTarget}
            </span>
          </div>
          <ProgressBar percent={progressPercent(stats.contactedToday, stats.dailyTarget)} />
        </Card>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input className="input-field pl-9" placeholder="Search colleges..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterPill label="All" active={statusFilter === 'All'} onClick={() => setStatusFilter('All')} />
        {STATUSES.map((s) => (
          <FilterPill key={s} label={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
        ))}
      </div>

      <div className="space-y-3">
        {colleges.map((c) => (
          <Card key={c.id} className="!p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 cursor-pointer" onClick={() => setEditing(c)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-ink">{c.collegeName}</p>
                  <Pill>{c.status}</Pill>
                </div>
                <p className="text-sm text-muted">
                  {c.city} {c.contactPerson && `· ${c.contactPerson}`}
                </p>
                {c.estimatedValue > 0 && <p className="text-sm font-semibold text-primary mt-1">{formatCurrencyINR(c.estimatedValue)}</p>}
                {c.nextFollowup && <p className="text-xs text-muted mt-1">Next follow-up: {c.nextFollowup}</p>}
              </div>
              <button onClick={() => remove(c.id)} className="text-muted hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
            {c.status === 'To Contact' && (
              <button onClick={() => markContacted(c)} className="btn-secondary w-full mt-3 text-sm">
                Mark Contacted Today
              </button>
            )}
          </Card>
        ))}
        {colleges.length === 0 && <Card className="text-center text-muted">No colleges yet. Add your first target.</Card>}
      </div>

      {(showForm || editing) && (
        <CollegeForm
          college={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={load}
        />
      )}
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
        active ? 'border-primary bg-primary-light text-primary-dark' : 'border-line text-muted'
      }`}
    >
      {label}
    </button>
  );
}

function CollegeForm({
  college,
  onClose,
  onSaved,
}: {
  college: CollegeOutreach | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [collegeName, setCollegeName] = useState(college?.collegeName || '');
  const [city, setCity] = useState(college?.city || '');
  const [contactPerson, setContactPerson] = useState(college?.contactPerson || '');
  const [role, setRole] = useState(college?.role || '');
  const [phone, setPhone] = useState(college?.phone || '');
  const [email, setEmail] = useState(college?.email || '');
  const [department, setDepartment] = useState(college?.department || '');
  const [trainingNeed, setTrainingNeed] = useState(college?.trainingNeed || '');
  const [nextFollowup, setNextFollowup] = useState(college?.nextFollowup || '');
  const [status, setStatus] = useState<CollegeStatus>(college?.status || 'To Contact');
  const [proposalSent, setProposalSent] = useState(college?.proposalSent || false);
  const [estimatedValue, setEstimatedValue] = useState(String(college?.estimatedValue || ''));
  const [notes, setNotes] = useState(college?.notes || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!collegeName.trim()) return;
    setSaving(true);
    const payload = {
      collegeName,
      city,
      contactPerson,
      role,
      phone,
      email,
      department,
      trainingNeed,
      nextFollowup: nextFollowup || null,
      status,
      proposalSent,
      estimatedValue: Number(estimatedValue) || 0,
      notes,
    };
    try {
      if (college) await api.patch(`/colleges/${college.id}`, payload);
      else await api.post('/colleges', payload);
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
          <h2 className="text-lg font-bold text-ink">{college ? 'Edit College' : 'Add College'}</h2>
          <button onClick={onClose}>
            <X size={20} className="text-muted" />
          </button>
        </div>
        <div className="space-y-3">
          <input className="input-field" placeholder="College name" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} />
          <input className="input-field" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <input className="input-field" placeholder="Contact person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          <input className="input-field" placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="input-field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <input className="input-field" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
          <input className="input-field" placeholder="Training need" value={trainingNeed} onChange={(e) => setTrainingNeed(e.target.value)} />
          <input className="input-field" type="date" value={nextFollowup} onChange={(e) => setNextFollowup(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value as CollegeStatus)} className="input-field">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={proposalSent} onChange={(e) => setProposalSent(e.target.checked)} />
            Proposal sent
          </label>
          <input
            className="input-field"
            type="number"
            placeholder="Estimated value (₹)"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
          />
          <textarea className="input-field" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button disabled={saving} onClick={save} className="btn-primary w-full mt-5">
          {saving ? 'Saving...' : college ? 'Save Changes' : 'Add College'}
        </button>
      </div>
    </div>
  );
}
