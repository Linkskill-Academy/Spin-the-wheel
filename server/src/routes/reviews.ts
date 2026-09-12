import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { weekStartStr, monthStr } from '../utils/date';

export const reviewsRouter = Router();
reviewsRouter.use(requireAuth);

// ---- Weekly ----
reviewsRouter.get('/weekly/:weekStart', (req: AuthedRequest, res) => {
  const row = db
    .prepare('SELECT * FROM weekly_reviews WHERE user_id = ? AND week_start = ?')
    .get(req.userId, req.params.weekStart) as any;
  res.json({ review: row ? { ...row, data: JSON.parse(row.data) } : null });
});

reviewsRouter.get('/weekly', (req: AuthedRequest, res) => {
  const rows = db
    .prepare('SELECT * FROM weekly_reviews WHERE user_id = ? ORDER BY week_start DESC LIMIT 12')
    .all(req.userId) as any[];
  res.json({ reviews: rows.map((r) => ({ ...r, data: JSON.parse(r.data) })) });
});

const weeklySchema = z.object({
  weekStart: z.string().default(() => weekStartStr()),
  data: z.record(z.unknown()).default({}),
});

reviewsRouter.post('/weekly', (req: AuthedRequest, res) => {
  const parsed = weeklySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const d = parsed.data;
  db.prepare(
    `INSERT INTO weekly_reviews (user_id, week_start, data) VALUES (?, ?, ?)
     ON CONFLICT(user_id, week_start) DO UPDATE SET data = excluded.data`
  ).run(req.userId, d.weekStart, JSON.stringify(d.data));
  const row = db.prepare('SELECT * FROM weekly_reviews WHERE user_id = ? AND week_start = ?').get(req.userId, d.weekStart) as any;
  res.json({ review: { ...row, data: JSON.parse(row.data) } });
});

// ---- Monthly ----
reviewsRouter.get('/monthly/:month', (req: AuthedRequest, res) => {
  const row = db
    .prepare('SELECT * FROM monthly_reviews WHERE user_id = ? AND month = ?')
    .get(req.userId, req.params.month) as any;
  res.json({ review: row ? { ...row, data: JSON.parse(row.data) } : null });
});

reviewsRouter.get('/monthly', (req: AuthedRequest, res) => {
  const rows = db
    .prepare('SELECT * FROM monthly_reviews WHERE user_id = ? ORDER BY month DESC LIMIT 12')
    .all(req.userId) as any[];
  res.json({ reviews: rows.map((r) => ({ ...r, data: JSON.parse(r.data) })) });
});

const monthlySchema = z.object({
  month: z.string().default(() => monthStr()),
  data: z.record(z.unknown()).default({}),
});

reviewsRouter.post('/monthly', (req: AuthedRequest, res) => {
  const parsed = monthlySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const d = parsed.data;
  db.prepare(
    `INSERT INTO monthly_reviews (user_id, month, data) VALUES (?, ?, ?)
     ON CONFLICT(user_id, month) DO UPDATE SET data = excluded.data`
  ).run(req.userId, d.month, JSON.stringify(d.data));
  const row = db.prepare('SELECT * FROM monthly_reviews WHERE user_id = ? AND month = ?').get(req.userId, d.month) as any;
  res.json({ review: { ...row, data: JSON.parse(row.data) } });
});

// ---- Monthly trend data (for charts) ----
reviewsRouter.get('/monthly-trend', (req: AuthedRequest, res) => {
  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m', date) as month, type, SUM(amount) as total
       FROM money_entries WHERE user_id = ? GROUP BY month, type ORDER BY month ASC`
    )
    .all(req.userId) as { month: string; type: string; total: number }[];

  const months = new Map<string, Record<string, number>>();
  for (const r of rows) {
    if (!months.has(r.month)) months.set(r.month, {});
    months.get(r.month)![r.type] = r.total;
  }
  const trend = Array.from(months.entries()).map(([month, values]) => ({ month, ...values }));
  res.json({ trend });
});
