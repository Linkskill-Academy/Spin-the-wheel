import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { todayStr } from '../utils/date';

export const evidenceRouter = Router();
evidenceRouter.use(requireAuth);

const CATEGORIES = ['Business', 'Money', 'Confidence', 'Discipline', 'Health', 'Family', 'Learning', 'Leadership'] as const;

function toDto(row: any) {
  return { id: row.id, userId: row.user_id, date: row.date, category: row.category, description: row.description, createdAt: row.created_at };
}

evidenceRouter.get('/', (req: AuthedRequest, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM evidence_logs WHERE user_id = ?';
  const params: unknown[] = [req.userId];
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY date DESC, created_at DESC LIMIT 200';
  const rows = db.prepare(query).all(...params);
  res.json({ evidence: rows.map(toDto) });
});

const schema = z.object({
  date: z.string().default(() => todayStr()),
  category: z.enum(CATEGORIES),
  description: z.string().min(1),
});

evidenceRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const d = parsed.data;
  const result = db
    .prepare('INSERT INTO evidence_logs (user_id, date, category, description) VALUES (?, ?, ?, ?)')
    .run(req.userId, d.date, d.category, d.description);
  const row = db.prepare('SELECT * FROM evidence_logs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ evidence: toDto(row) });
});

evidenceRouter.delete('/:id', (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM evidence_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.status(204).send();
});
