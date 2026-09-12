import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { todayStr } from '../utils/date';

export const leadsRouter = Router();
leadsRouter.use(requireAuth);

const STATUSES = ['New Lead', 'Contacted', 'Conversation', 'Follow-up', 'Proposal', 'Won', 'Lost'] as const;
const OPP_TYPES = ['College', 'Corporate', 'Vendor', 'Student', 'Partnership', 'Other'] as const;

function toDto(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    organisation: row.organisation,
    role: row.role,
    phone: row.phone,
    email: row.email,
    source: row.source,
    opportunityType: row.opportunity_type,
    estimatedValue: row.estimated_value,
    notes: row.notes,
    nextFollowup: row.next_followup,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

leadsRouter.get('/', (req: AuthedRequest, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM leads WHERE user_id = ?';
  const params: unknown[] = [req.userId];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (name LIKE ? OR organisation LIKE ? OR email LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  query += ' ORDER BY updated_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json({ leads: rows.map(toDto) });
});

leadsRouter.get('/stats', (req: AuthedRequest, res) => {
  const rows = db.prepare('SELECT status, estimated_value FROM leads WHERE user_id = ?').all(req.userId) as {
    status: string;
    estimated_value: number;
  }[];
  const today = todayStr();
  const followupRows = db
    .prepare('SELECT next_followup FROM leads WHERE user_id = ? AND next_followup IS NOT NULL')
    .all(req.userId) as { next_followup: string }[];

  const byStatus: Record<string, number> = {};
  for (const s of STATUSES) byStatus[s] = 0;
  let totalPipelineValue = 0;
  let potentialRevenue = 0;
  let wonRevenue = 0;
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    totalPipelineValue += r.estimated_value || 0;
    if (r.status === 'Won') wonRevenue += r.estimated_value || 0;
    else if (r.status !== 'Lost') potentialRevenue += r.estimated_value || 0;
  }
  const followupsToday = followupRows.filter((r) => r.next_followup === today).length;
  const overdueFollowups = followupRows.filter((r) => r.next_followup && r.next_followup < today).length;

  res.json({
    stats: {
      newLeads: byStatus['New Lead'],
      conversations: byStatus['Conversation'],
      followups: byStatus['Follow-up'],
      proposals: byStatus['Proposal'],
      won: byStatus['Won'],
      lost: byStatus['Lost'],
      totalPipelineValue,
      potentialRevenue,
      wonRevenue,
      followupsToday,
      overdueFollowups,
    },
  });
});

const leadSchema = z.object({
  name: z.string().min(1),
  organisation: z.string().default(''),
  role: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
  source: z.string().default(''),
  opportunityType: z.enum(OPP_TYPES).default('Other'),
  estimatedValue: z.number().default(0),
  notes: z.string().default(''),
  nextFollowup: z.string().nullable().default(null),
  status: z.enum(STATUSES).default('New Lead'),
});

leadsRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const d = parsed.data;
  const result = db
    .prepare(
      `INSERT INTO leads (user_id, name, organisation, role, phone, email, source, opportunity_type, estimated_value, notes, next_followup, status)
       VALUES (@userId, @name, @organisation, @role, @phone, @email, @source, @opportunityType, @estimatedValue, @notes, @nextFollowup, @status)`
    )
    .run({ userId: req.userId, ...d });
  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ lead: toDto(row) });
});

leadsRouter.patch('/:id', (req: AuthedRequest, res) => {
  const existing = db.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (!existing) return res.status(404).json({ error: 'Lead not found' });
  const parsed = leadSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const d = parsed.data;

  db.prepare(
    `UPDATE leads SET
      name=COALESCE(@name, name), organisation=COALESCE(@organisation, organisation), role=COALESCE(@role, role),
      phone=COALESCE(@phone, phone), email=COALESCE(@email, email), source=COALESCE(@source, source),
      opportunity_type=COALESCE(@opportunityType, opportunity_type), estimated_value=COALESCE(@estimatedValue, estimated_value),
      notes=COALESCE(@notes, notes), next_followup=@nextFollowup, status=COALESCE(@status, status),
      updated_at=datetime('now')
     WHERE id=@id`
  ).run({
    id: existing.id,
    name: d.name,
    organisation: d.organisation,
    role: d.role,
    phone: d.phone,
    email: d.email,
    source: d.source,
    opportunityType: d.opportunityType,
    estimatedValue: d.estimatedValue,
    notes: d.notes,
    nextFollowup: d.nextFollowup !== undefined ? d.nextFollowup : existing.next_followup,
    status: d.status,
  });

  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(existing.id);
  res.json({ lead: toDto(row) });
});

leadsRouter.delete('/:id', (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM leads WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.status(204).send();
});
