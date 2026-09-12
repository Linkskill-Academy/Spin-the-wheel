import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { todayStr } from '../utils/date';

export const checkinsRouter = Router();
checkinsRouter.use(requireAuth);

function toDto(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    type: row.type,
    completedTasks: row.completed_tasks,
    pendingTasks: row.pending_tasks,
    distractions: row.distractions,
    oneTask: row.one_task,
    extra: JSON.parse(row.extra || '{}'),
    createdAt: row.created_at,
  };
}

checkinsRouter.get('/', (req: AuthedRequest, res) => {
  const { date, type } = req.query;
  let query = 'SELECT * FROM daily_checkins WHERE user_id = ?';
  const params: unknown[] = [req.userId];
  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  query += ' ORDER BY created_at DESC LIMIT 50';
  const rows = db.prepare(query).all(...params);
  res.json({ checkins: rows.map(toDto) });
});

const schema = z.object({
  date: z.string().default(() => todayStr()),
  type: z.enum(['quick', '1111', '2222', '333']),
  completedTasks: z.string().default(''),
  pendingTasks: z.string().default(''),
  distractions: z.string().default(''),
  oneTask: z.string().default(''),
  extra: z.record(z.unknown()).default({}),
});

checkinsRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const d = parsed.data;
  const result = db
    .prepare(
      `INSERT INTO daily_checkins (user_id, date, type, completed_tasks, pending_tasks, distractions, one_task, extra)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.userId, d.date, d.type, d.completedTasks, d.pendingTasks, d.distractions, d.oneTask, JSON.stringify(d.extra));
  const row = db.prepare('SELECT * FROM daily_checkins WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ checkin: toDto(row) });
});
