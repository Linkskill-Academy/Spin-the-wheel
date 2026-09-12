import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { daysAgoStr, todayStr } from '../utils/date';

export const habitsRouter = Router();
habitsRouter.use(requireAuth);

function habitDto(row: any) {
  return { id: row.id, userId: row.user_id, name: row.name, icon: row.icon, archived: !!row.archived, createdAt: row.created_at };
}

habitsRouter.get('/', (req: AuthedRequest, res) => {
  const habits = db
    .prepare('SELECT * FROM habits WHERE user_id = ? AND archived = 0 ORDER BY created_at ASC')
    .all(req.userId) as any[];

  const since = daysAgoStr(6);
  const logs = db
    .prepare(
      `SELECT hl.habit_id, hl.date, hl.done FROM habit_logs hl
       JOIN habits h ON h.id = hl.habit_id
       WHERE h.user_id = ? AND hl.date >= ?`
    )
    .all(req.userId, since) as { habit_id: number; date: string; done: number }[];

  res.json({
    habits: habits.map(habitDto),
    logs: logs.map((l) => ({ habitId: l.habit_id, date: l.date, done: !!l.done })),
  });
});

const habitSchema = z.object({
  name: z.string().min(1),
  icon: z.string().default('CheckCircle2'),
});

habitsRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = habitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const result = db
    .prepare('INSERT INTO habits (user_id, name, icon) VALUES (?, ?, ?)')
    .run(req.userId, parsed.data.name, parsed.data.icon);
  const row = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ habit: habitDto(row) });
});

habitsRouter.delete('/:id', (req: AuthedRequest, res) => {
  db.prepare('UPDATE habits SET archived = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.status(204).send();
});

const toggleSchema = z.object({
  date: z.string().default(() => todayStr()),
  done: z.boolean().default(true),
});

habitsRouter.post('/:id/toggle', (req: AuthedRequest, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  const parsed = toggleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const d = parsed.data;

  db.prepare(
    `INSERT INTO habit_logs (habit_id, date, done) VALUES (?, ?, ?)
     ON CONFLICT(habit_id, date) DO UPDATE SET done = excluded.done`
  ).run(req.params.id, d.date, d.done ? 1 : 0);

  res.json({ success: true });
});
