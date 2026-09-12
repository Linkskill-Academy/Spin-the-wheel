import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { todayStr } from '../utils/date';

export const collegeRouter = Router();
collegeRouter.use(requireAuth);

const STATUSES = ['To Contact', 'Contacted', 'Interested', 'Meeting', 'Proposal', 'Negotiation', 'Won', 'Not Now'] as const;

function toDto(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    collegeName: row.college_name,
    city: row.city,
    contactPerson: row.contact_person,
    role: row.role,
    phone: row.phone,
    email: row.email,
    department: row.department,
    trainingNeed: row.training_need,
    lastContacted: row.last_contacted,
    nextFollowup: row.next_followup,
    status: row.status,
    proposalSent: !!row.proposal_sent,
    estimatedValue: row.estimated_value,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

collegeRouter.get('/', (req: AuthedRequest, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM college_outreach WHERE user_id = ?';
  const params: unknown[] = [req.userId];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (college_name LIKE ? OR city LIKE ? OR contact_person LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  query += ' ORDER BY updated_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json({ colleges: rows.map(toDto) });
});

collegeRouter.get('/stats', (req: AuthedRequest, res) => {
  const today = todayStr();
  const contactedToday = db
    .prepare("SELECT COUNT(*) as c FROM college_outreach WHERE user_id = ? AND last_contacted = ?")
    .get(req.userId, today) as { c: number };
  const user = db.prepare('SELECT daily_outreach_target FROM users WHERE id = ?').get(req.userId) as
    | { daily_outreach_target: number }
    | undefined;
  res.json({ stats: { contactedToday: contactedToday.c, dailyTarget: user?.daily_outreach_target || 10 } });
});

const schema = z.object({
  collegeName: z.string().min(1),
  city: z.string().default(''),
  contactPerson: z.string().default(''),
  role: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
  department: z.string().default(''),
  trainingNeed: z.string().default(''),
  lastContacted: z.string().nullable().default(null),
  nextFollowup: z.string().nullable().default(null),
  status: z.enum(STATUSES).default('To Contact'),
  proposalSent: z.boolean().default(false),
  estimatedValue: z.number().default(0),
  notes: z.string().default(''),
});

collegeRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const d = parsed.data;
  const result = db
    .prepare(
      `INSERT INTO college_outreach (user_id, college_name, city, contact_person, role, phone, email, department, training_need, last_contacted, next_followup, status, proposal_sent, estimated_value, notes)
       VALUES (@userId, @collegeName, @city, @contactPerson, @role, @phone, @email, @department, @trainingNeed, @lastContacted, @nextFollowup, @status, @proposalSent, @estimatedValue, @notes)`
    )
    .run({ userId: req.userId, ...d, proposalSent: d.proposalSent ? 1 : 0 });
  const row = db.prepare('SELECT * FROM college_outreach WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ college: toDto(row) });
});

collegeRouter.patch('/:id', (req: AuthedRequest, res) => {
  const existing = db
    .prepare('SELECT * FROM college_outreach WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId) as any;
  if (!existing) return res.status(404).json({ error: 'College not found' });
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const d = parsed.data;

  db.prepare(
    `UPDATE college_outreach SET
      college_name=COALESCE(@collegeName, college_name), city=COALESCE(@city, city),
      contact_person=COALESCE(@contactPerson, contact_person), role=COALESCE(@role, role),
      phone=COALESCE(@phone, phone), email=COALESCE(@email, email), department=COALESCE(@department, department),
      training_need=COALESCE(@trainingNeed, training_need), last_contacted=@lastContacted, next_followup=@nextFollowup,
      status=COALESCE(@status, status), proposal_sent=@proposalSent, estimated_value=COALESCE(@estimatedValue, estimated_value),
      notes=COALESCE(@notes, notes), updated_at=datetime('now')
     WHERE id=@id`
  ).run({
    id: existing.id,
    collegeName: d.collegeName,
    city: d.city,
    contactPerson: d.contactPerson,
    role: d.role,
    phone: d.phone,
    email: d.email,
    department: d.department,
    trainingNeed: d.trainingNeed,
    lastContacted: d.lastContacted !== undefined ? d.lastContacted : existing.last_contacted,
    nextFollowup: d.nextFollowup !== undefined ? d.nextFollowup : existing.next_followup,
    status: d.status,
    proposalSent: d.proposalSent !== undefined ? (d.proposalSent ? 1 : 0) : existing.proposal_sent,
    estimatedValue: d.estimatedValue,
    notes: d.notes,
  });

  const row = db.prepare('SELECT * FROM college_outreach WHERE id = ?').get(existing.id);
  res.json({ college: toDto(row) });
});

collegeRouter.delete('/:id', (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM college_outreach WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.status(204).send();
});
