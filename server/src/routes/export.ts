import { Router } from 'express';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';

export const exportRouter = Router();
exportRouter.use(requireAuth);

const USER_TABLES = [
  'goals',
  'daily_checkins',
  'morning_routines',
  'night_reviews',
  'leads',
  'college_outreach',
  'money_entries',
  'habits',
  'evidence_logs',
  'weekly_reviews',
  'monthly_reviews',
  'tasks',
] as const;

exportRouter.get('/json', (req: AuthedRequest, res) => {
  const user = db.prepare('SELECT id, email, name, account_mode, created_at FROM users WHERE id = ?').get(req.userId);
  const data: Record<string, unknown> = { exportedAt: new Date().toISOString(), user };

  for (const table of USER_TABLES) {
    data[table] = db.prepare(`SELECT * FROM ${table} WHERE user_id = ?`).all(req.userId);
  }

  // habit_logs are keyed by habit_id, not user_id directly — join through habits.
  data.habit_logs = db
    .prepare(
      `SELECT hl.* FROM habit_logs hl JOIN habits h ON h.id = hl.habit_id WHERE h.user_id = ?`
    )
    .all(req.userId);

  res.setHeader('Content-Disposition', `attachment; filename="manifestation-crm-export-${todayStr()}.json"`);
  res.json(data);
});

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const str = value === null || value === undefined ? '' : String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const CSV_RESOURCES: Record<string, string> = {
  leads: 'leads',
  money: 'money_entries',
  evidence: 'evidence_logs',
  colleges: 'college_outreach',
};

exportRouter.get('/csv/:resource', (req: AuthedRequest, res) => {
  const table = CSV_RESOURCES[req.params.resource];
  if (!table) {
    return res.status(400).json({ error: 'Unknown export resource. Use one of: leads, money, evidence, colleges.' });
  }
  const rows = db.prepare(`SELECT * FROM ${table} WHERE user_id = ?`).all(req.userId) as Record<string, unknown>[];
  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.resource}-${todayStr()}.csv"`);
  res.send(csv);
});
