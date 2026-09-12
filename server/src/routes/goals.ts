import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';

export const goalsRouter = Router();
goalsRouter.use(requireAuth);

function toDto(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    vision: row.vision,
    target12m: row.target_12m,
    target90d: row.target_90d,
    target30d: row.target_30d,
    targetWeekly: row.target_weekly,
    todayAction: row.today_action,
    progressCurrent: row.progress_current,
    progressTarget: row.progress_target,
    unit: row.unit,
    createdAt: row.created_at,
  };
}

goalsRouter.get('/', (req: AuthedRequest, res) => {
  const rows = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json({ goals: rows.map(toDto) });
});

const goalSchema = z.object({
  category: z.enum(['Business', 'Money', 'Home', 'Family', 'Health', 'Career', 'Lifestyle', 'Learning', 'Impact']),
  title: z.string().min(1),
  vision: z.string().default(''),
  target12m: z.string().default(''),
  target90d: z.string().default(''),
  target30d: z.string().default(''),
  targetWeekly: z.string().default(''),
  todayAction: z.string().default(''),
  progressCurrent: z.number().default(0),
  progressTarget: z.number().default(100),
  unit: z.string().default('%'),
});

goalsRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const d = parsed.data;
  const result = db
    .prepare(
      `INSERT INTO goals (user_id, category, title, vision, target_12m, target_90d, target_30d, target_weekly, today_action, progress_current, progress_target, unit)
       VALUES (@userId, @category, @title, @vision, @target12m, @target90d, @target30d, @targetWeekly, @todayAction, @progressCurrent, @progressTarget, @unit)`
    )
    .run({ userId: req.userId, ...d });
  const row = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ goal: toDto(row) });
});

goalsRouter.patch('/:id', (req: AuthedRequest, res) => {
  const parsed = goalSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const existing = db
    .prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId) as any;
  if (!existing) return res.status(404).json({ error: 'Goal not found' });

  const merged = { ...existing, ...toColumnUpdates(parsed.data) };
  db.prepare(
    `UPDATE goals SET category=@category, title=@title, vision=@vision, target_12m=@target_12m, target_90d=@target_90d,
     target_30d=@target_30d, target_weekly=@target_weekly, today_action=@today_action,
     progress_current=@progress_current, progress_target=@progress_target, unit=@unit WHERE id=@id`
  ).run({ ...merged, id: existing.id });

  const row = db.prepare('SELECT * FROM goals WHERE id = ?').get(existing.id);
  res.json({ goal: toDto(row) });
});

function toColumnUpdates(d: Partial<z.infer<typeof goalSchema>>) {
  const out: Record<string, unknown> = {};
  if (d.category !== undefined) out.category = d.category;
  if (d.title !== undefined) out.title = d.title;
  if (d.vision !== undefined) out.vision = d.vision;
  if (d.target12m !== undefined) out.target_12m = d.target12m;
  if (d.target90d !== undefined) out.target_90d = d.target90d;
  if (d.target30d !== undefined) out.target_30d = d.target30d;
  if (d.targetWeekly !== undefined) out.target_weekly = d.targetWeekly;
  if (d.todayAction !== undefined) out.today_action = d.todayAction;
  if (d.progressCurrent !== undefined) out.progress_current = d.progressCurrent;
  if (d.progressTarget !== undefined) out.progress_target = d.progressTarget;
  if (d.unit !== undefined) out.unit = d.unit;
  return out;
}

goalsRouter.delete('/:id', (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.status(204).send();
});
