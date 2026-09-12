import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { todayStr } from '../utils/date';

export const nightRouter = Router();
nightRouter.use(requireAuth);

function toDto(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    businessWin: row.business_win,
    moneyEarned: !!row.money_earned,
    moneyLead: !!row.money_lead,
    moneyOffer: !!row.money_offer,
    moneyFollowup: !!row.money_followup,
    moneyAsset: !!row.money_asset,
    moneyProduct: !!row.money_product,
    personalWin: row.personal_win,
    evidence: row.evidence,
    lesson: row.lesson,
    release: row.release,
    tomorrowPriority: row.tomorrow_priority,
    completed: !!row.completed,
  };
}

nightRouter.get('/:date', (req: AuthedRequest, res) => {
  const row = db.prepare('SELECT * FROM night_reviews WHERE user_id = ? AND date = ?').get(req.userId, req.params.date);
  res.json({ night: toDto(row) });
});

const schema = z.object({
  date: z.string().default(() => todayStr()),
  businessWin: z.string().default(''),
  moneyEarned: z.boolean().default(false),
  moneyLead: z.boolean().default(false),
  moneyOffer: z.boolean().default(false),
  moneyFollowup: z.boolean().default(false),
  moneyAsset: z.boolean().default(false),
  moneyProduct: z.boolean().default(false),
  personalWin: z.string().default(''),
  evidence: z.string().default(''),
  lesson: z.string().default(''),
  release: z.string().default(''),
  tomorrowPriority: z.string().default(''),
  completed: z.boolean().default(false),
});

nightRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const d = parsed.data;

  db.prepare(
    `INSERT INTO night_reviews (
      user_id, date, business_win, money_earned, money_lead, money_offer, money_followup, money_asset,
      money_product, personal_win, evidence, lesson, release, tomorrow_priority, completed
    ) VALUES (
      @userId, @date, @businessWin, @moneyEarned, @moneyLead, @moneyOffer, @moneyFollowup, @moneyAsset,
      @moneyProduct, @personalWin, @evidence, @lesson, @release, @tomorrowPriority, @completed
    )
    ON CONFLICT(user_id, date) DO UPDATE SET
      business_win=excluded.business_win, money_earned=excluded.money_earned, money_lead=excluded.money_lead,
      money_offer=excluded.money_offer, money_followup=excluded.money_followup, money_asset=excluded.money_asset,
      money_product=excluded.money_product, personal_win=excluded.personal_win, evidence=excluded.evidence,
      lesson=excluded.lesson, release=excluded.release, tomorrow_priority=excluded.tomorrow_priority,
      completed=excluded.completed`
  ).run({
    userId: req.userId,
    ...d,
    moneyEarned: d.moneyEarned ? 1 : 0,
    moneyLead: d.moneyLead ? 1 : 0,
    moneyOffer: d.moneyOffer ? 1 : 0,
    moneyFollowup: d.moneyFollowup ? 1 : 0,
    moneyAsset: d.moneyAsset ? 1 : 0,
    moneyProduct: d.moneyProduct ? 1 : 0,
    completed: d.completed ? 1 : 0,
  });

  // If evidence text was captured, mirror it into the evidence log automatically.
  if (d.evidence && d.evidence.trim().length > 0) {
    const exists = db
      .prepare("SELECT id FROM evidence_logs WHERE user_id = ? AND date = ? AND description = ?")
      .get(req.userId, d.date, d.evidence.trim());
    if (!exists) {
      db.prepare(
        `INSERT INTO evidence_logs (user_id, date, category, description) VALUES (?, ?, 'Discipline', ?)`
      ).run(req.userId, d.date, d.evidence.trim());
    }
  }

  const row = db.prepare('SELECT * FROM night_reviews WHERE user_id = ? AND date = ?').get(req.userId, d.date);
  res.json({ night: toDto(row) });
});
