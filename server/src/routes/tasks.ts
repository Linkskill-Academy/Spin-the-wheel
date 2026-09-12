import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { todayStr } from '../utils/date';

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

function toDto(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    title: row.title,
    size: row.size,
    done: !!row.done,
    focusMinutes: row.focus_minutes,
    createdAt: row.created_at,
  };
}

tasksRouter.get('/', (req: AuthedRequest, res) => {
  const date = (req.query.date as string) || todayStr();
  const rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY id ASC').all(req.userId, date);
  res.json({ tasks: rows.map(toDto) });
});

const LIMITS: Record<string, number> = { big: 1, medium: 3, small: 5 };

const schema = z.object({
  date: z.string().default(() => todayStr()),
  title: z.string().min(1),
  size: z.enum(['big', 'medium', 'small']),
});

tasksRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const d = parsed.data;

  const countRow = db
    .prepare('SELECT COUNT(*) as c FROM tasks WHERE user_id = ? AND date = ? AND size = ?')
    .get(req.userId, d.date, d.size) as { c: number };
  if (countRow.c >= LIMITS[d.size]) {
    return res.status(400).json({
      error: `Protect your focus. Finish before adding more (${LIMITS[d.size]} ${d.size} task${LIMITS[d.size] > 1 ? 's' : ''} max).`,
    });
  }

  const result = db
    .prepare('INSERT INTO tasks (user_id, date, title, size) VALUES (?, ?, ?, ?)')
    .run(req.userId, d.date, d.title, d.size);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ task: toDto(row) });
});

tasksRouter.patch('/:id', (req: AuthedRequest, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Task not found' });
  const schema2 = z.object({ done: z.boolean().optional(), focusMinutes: z.number().optional(), title: z.string().optional() });
  const parsed = schema2.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const d = parsed.data;
  db.prepare(
    `UPDATE tasks SET done = COALESCE(?, done), focus_minutes = COALESCE(?, focus_minutes), title = COALESCE(?, title) WHERE id = ?`
  ).run(d.done === undefined ? null : (d.done ? 1 : 0), d.focusMinutes ?? null, d.title ?? null, req.params.id);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json({ task: toDto(row) });
});

tasksRouter.delete('/:id', (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.status(204).send();
});
