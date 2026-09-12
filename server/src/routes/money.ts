import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { monthStr, todayStr } from '../utils/date';

export const moneyRouter = Router();
moneyRouter.use(requireAuth);

const TYPES = ['revenue', 'expense', 'profit', 'savings', 'investment', 'asset', 'debt'] as const;

function entryDto(row: any) {
  return { id: row.id, userId: row.user_id, date: row.date, type: row.type, amount: row.amount, note: row.note };
}

moneyRouter.get('/entries', (req: AuthedRequest, res) => {
  const { month } = req.query;
  const m = (month as string) || monthStr();
  const rows = db
    .prepare("SELECT * FROM money_entries WHERE user_id = ? AND date LIKE ? ORDER BY date DESC")
    .all(req.userId, `${m}%`);
  res.json({ entries: rows.map(entryDto) });
});

const entrySchema = z.object({
  date: z.string().default(() => todayStr()),
  type: z.enum(TYPES),
  amount: z.number(),
  note: z.string().default(''),
});

moneyRouter.post('/entries', (req: AuthedRequest, res) => {
  const parsed = entrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const d = parsed.data;
  const result = db
    .prepare('INSERT INTO money_entries (user_id, date, type, amount, note) VALUES (?, ?, ?, ?, ?)')
    .run(req.userId, d.date, d.type, d.amount, d.note);
  const row = db.prepare('SELECT * FROM money_entries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ entry: entryDto(row) });
});

moneyRouter.delete('/entries/:id', (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM money_entries WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.status(204).send();
});

function goalsDto(row: any) {
  return {
    userId: row.user_id,
    monthlyRevenueTarget: row.monthly_revenue_target,
    monthlyProfitTarget: row.monthly_profit_target,
    savingsTarget: row.savings_target,
    assetTarget: row.asset_target,
    personalIncomeTarget: row.personal_income_target,
  };
}

moneyRouter.get('/goals', (req: AuthedRequest, res) => {
  const row = db.prepare('SELECT * FROM money_goals WHERE user_id = ?').get(req.userId);
  res.json({ goals: row ? goalsDto(row) : null });
});

const goalsSchema = z.object({
  monthlyRevenueTarget: z.number().default(0),
  monthlyProfitTarget: z.number().default(0),
  savingsTarget: z.number().default(0),
  assetTarget: z.number().default(0),
  personalIncomeTarget: z.number().default(0),
});

moneyRouter.post('/goals', (req: AuthedRequest, res) => {
  const parsed = goalsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const d = parsed.data;
  db.prepare(
    `INSERT INTO money_goals (user_id, monthly_revenue_target, monthly_profit_target, savings_target, asset_target, personal_income_target)
     VALUES (@userId, @monthlyRevenueTarget, @monthlyProfitTarget, @savingsTarget, @assetTarget, @personalIncomeTarget)
     ON CONFLICT(user_id) DO UPDATE SET
       monthly_revenue_target=excluded.monthly_revenue_target, monthly_profit_target=excluded.monthly_profit_target,
       savings_target=excluded.savings_target, asset_target=excluded.asset_target,
       personal_income_target=excluded.personal_income_target`
  ).run({ userId: req.userId, ...d });
  const row = db.prepare('SELECT * FROM money_goals WHERE user_id = ?').get(req.userId);
  res.json({ goals: goalsDto(row) });
});

moneyRouter.get('/summary', (req: AuthedRequest, res) => {
  const m = monthStr();
  const rows = db
    .prepare('SELECT type, SUM(amount) as total FROM money_entries WHERE user_id = ? AND date LIKE ? GROUP BY type')
    .all(req.userId, `${m}%`) as { type: string; total: number }[];
  const totals: Record<string, number> = {};
  for (const t of TYPES) totals[t] = 0;
  for (const r of rows) totals[r.type] = r.total || 0;

  const goalsRow = db.prepare('SELECT * FROM money_goals WHERE user_id = ?').get(req.userId) as any;
  const goals = goalsRow ? goalsDto(goalsRow) : null;

  res.json({
    current: totals,
    goals,
  });
});
