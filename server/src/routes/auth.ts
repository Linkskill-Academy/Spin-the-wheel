import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/connection';
import { signToken, requireAuth, AuthedRequest } from '../middleware/auth';

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  accountMode: z.enum(['founder', 'student']).default('founder'),
});

function toUserDto(row: any) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    accountMode: row.account_mode,
    onboardingCompleted: !!row.onboarding_completed,
    currency: row.currency,
    dailyOutreachTarget: row.daily_outreach_target,
    morningReminderEnabled: !!row.morning_reminder_enabled,
    nightReviewReminderEnabled: !!row.night_review_reminder_enabled,
    createdAt: row.created_at,
  };
}

authRouter.post('/signup', (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input' });
  }
  const { email, password, name, accountMode } = parsed.data;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare(
      'INSERT INTO users (email, password_hash, name, account_mode) VALUES (?, ?, ?, ?)'
    )
    .run(email.toLowerCase(), passwordHash, name, accountMode);

  const userId = Number(result.lastInsertRowid);
  db.prepare('INSERT INTO onboarding (user_id) VALUES (?)').run(userId);
  db.prepare('INSERT INTO money_goals (user_id) VALUES (?)').run(userId);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const token = signToken(userId);
  res.status(201).json({ token, user: toUserDto(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please enter a valid email and password' });
  }
  const { email, password } = parsed.data;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }
  const token = signToken(user.id);
  res.json({ token, user: toUserDto(user) });
});

authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: toUserDto(user) });
});

authRouter.patch('/me', requireAuth, (req: AuthedRequest, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    accountMode: z.enum(['founder', 'student']).optional(),
    currency: z.enum(['INR', 'USD']).optional(),
    dailyOutreachTarget: z.number().int().min(1).max(100).optional(),
    morningReminderEnabled: z.boolean().optional(),
    nightReviewReminderEnabled: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input' });
  const d = parsed.data;

  if (d.name !== undefined) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(d.name, req.userId);
  if (d.accountMode !== undefined) db.prepare('UPDATE users SET account_mode = ? WHERE id = ?').run(d.accountMode, req.userId);
  if (d.currency !== undefined) db.prepare('UPDATE users SET currency = ? WHERE id = ?').run(d.currency, req.userId);
  if (d.dailyOutreachTarget !== undefined)
    db.prepare('UPDATE users SET daily_outreach_target = ? WHERE id = ?').run(d.dailyOutreachTarget, req.userId);
  if (d.morningReminderEnabled !== undefined)
    db.prepare('UPDATE users SET morning_reminder_enabled = ? WHERE id = ?').run(d.morningReminderEnabled ? 1 : 0, req.userId);
  if (d.nightReviewReminderEnabled !== undefined)
    db.prepare('UPDATE users SET night_review_reminder_enabled = ? WHERE id = ?').run(
      d.nightReviewReminderEnabled ? 1 : 0,
      req.userId
    );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: toUserDto(user) });
});
