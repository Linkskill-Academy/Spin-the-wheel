import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Search } from 'lucide-react';
import type { Lead, LeadStatus, OpportunityType } from '@mecrm/types';
import { formatCurrencyINR } from '@mecrm/shared';
import { api } from '../lib/api';
import { Card, SectionTitle, Pill } from '@mecrm/ui';

const STATUSES: LeadStatus[] = ['New Lead', 'Contacted', 'Conversation', 'Follow-up', 'Proposal', 'Won', 'Lost'];
const OPP_TYPES: OpportunityType[] = ['College', 'Corporate', 'Vendor', 'Student', 'Partnership', 'Other'];

interface Stats {
  totalPipelineValue: number;
  potentialRevenue: number;
  wonRevenue: number;
  followupsToday: number;
  overdueFollowups: number;
}

export default function Crm() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Lead | null>(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    const params = new URLSearchParams();
    if (statusFilter !== 'All') params.set('status', statusFilter);
    if (search) params.set('search', search);
    api.get<{ leads: Lead[] }>(`/leads?${params.toString()}`).then((res) => setLeads(res.leads));
    api.get<{ stats: Stats }>('/leads/stats').then((res) => setStats(res.stats));
  }
  useEffect(load, [statusFilter, search]);

  async function moveStage(lead: Lead, status: LeadStatus) {
    await api.patch(`/leads/${lead.id}`, { status });
    load();
  }

  async function remove(id: number) {
    await api.del(`/leads/${id}`);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">CRM Pipeline</h1>
          <p className="text-muted mt-1">Every conversation is a door to revenue.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Lead
        </button>
      </header>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="Pipeline Value" value={formatCurrencyINR(stats.totalPipelineValue)} />
          <Stat label="Potential" value={formatCurrencyINR(stats.potentialRevenue)} />
          <Stat label="Won" value={formatCurrencyINR(stats.wonRevenue)} tone="primary" />
          <Stat label="Follow-ups Today" value={String(stats.followupsToday)} />
          <Stat label="Overdue" value={String(stats.overdueFollowups)} tone={stats.overdueFollowups > 0 ? 'warn' : undefined} />
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input-field pl-9" placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterPill label="All" active={statusFilter === 'All'} onClick={() => setStatusFilter('All')} />
        {STATUSES.map((s) => (
          <FilterPill key={s} label={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
        ))}
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <Card key={lead.id} className="!p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 cursor-pointer" onClick={() => setEditing(lead)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-ink">{lead.name}</p>
                  <Pill>{lead.opportunityType}</Pill>
                </div>
                <p className="text-sm text-muted">
                  {lead.organisation} {lead.role && `· ${lead.role}`}
                </p>
                <p className="text-sm font-semibold text-primary mt-1">{formatCurrencyINR(lead.estimatedValue)}</p>
                {lead.nextFollowup && <p className="text-xs text-muted mt-1">Next follow-up: {lead.nextFollowup}</p>}
              </div>
              <button onClick={() => remove(lead.id)} className="text-muted hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
            <select
              value={lead.status}
              onChange={(e) => moveStage(lead, e.target.value as LeadStatus)}
              className="input-field mt-3 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Card>
        ))}
        {leads.length === 0 && <Card className="text-center text-muted">No leads yet. Add your first one.</Card>}
      </div>

      {(showForm || editing) && (
        <LeadForm
          lead={editing}
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

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'primary' | 'warn' }) {
  return (
    <Card className="!p-3 text-center">
      <p className={`text-lg font-extrabold ${tone === 'primary' ? 'text-primary' : tone === 'warn' ? 'text-amber-600' : 'text-ink'}`}>
        {value}
      </p>
      <p className="text-[11px] text-muted font-medium mt-0.5">{label}</p>
    </Card>
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

function LeadForm({ lead, onClose, onSaved }: { lead: Lead | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(lead?.name || '');
  const [organisation, setOrganisation] = useState(lead?.organisation || '');
  const [role, setRole] = useState(lead?.role || '');
  const [phone, setPhone] = useState(lead?.phone || '');
  const [email, setEmail] = useState(lead?.email || '');
  const [source, setSource] = useState(lead?.source || '');
  const [opportunityType, setOpportunityType] = useState<OpportunityType>(lead?.opportunityType || 'Other');
  const [estimatedValue, setEstimatedValue] = useState(String(lead?.estimatedValue || ''));
  const [notes, setNotes] = useState(lead?.notes || '');
  const [nextFollowup, setNextFollowup] = useState(lead?.nextFollowup || '');
  const [status, setStatus] = useState<LeadStatus>(lead?.status || 'New Lead');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name,
      organisation,
      role,
      phone,
      email,
      source,
      opportunityType,
      estimatedValue: Number(estimatedValue) || 0,
      notes,
      nextFollowup: nextFollowup || null,
      status,
    };
    try {
      if (lead) await api.patch(`/leads/${lead.id}`, payload);
      else await api.post('/leads', payload);
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
          <h2 className="text-lg font-bold text-ink">{lead ? 'Edit Lead' : 'New Lead'}</h2>
          <button onClick={onClose}>
            <X size={20} className="text-muted" />
          </button>
        </div>
        <div className="space-y-3">
          <input className="input-field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input-field" placeholder="Organisation" value={organisation} onChange={(e) => setOrganisation(e.target.value)} />
          <input className="input-field" placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="input-field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <input className="input-field" placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)} />
          <select value={opportunityType} onChange={(e) => setOpportunityType(e.target.value as OpportunityType)} className="input-field">
            {OPP_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className="input-field"
            type="number"
            placeholder="Estimated value (₹)"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
          />
          <input className="input-field" type="date" value={nextFollowup} onChange={(e) => setNextFollowup(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className="input-field">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <textarea className="input-field" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button disabled={saving} onClick={save} className="btn-primary w-full mt-5">
          {saving ? 'Saving...' : lead ? 'Save Changes' : 'Create Lead'}
        </button>
      </div>
    </div>
  );
}
