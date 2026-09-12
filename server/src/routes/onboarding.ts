import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';

export const onboardingRouter = Router();
onboardingRouter.use(requireAuth);

function toDto(row: any) {
  return {
    vision12m: row.vision_12m,
    monthlyIncomeTarget: row.monthly_income_target,
    businessRevenueTarget: row.business_revenue_target,
    profitTarget: row.profit_target,
    savingsTarget: row.savings_target,
    assetTarget: row.asset_target,
    homeTarget: row.home_target,
    impactTarget: row.impact_target,
    healthGoal: row.health_goal,
    familyGoal: row.family_goal,
  };
}

onboardingRouter.get('/', (req: AuthedRequest, res) => {
  const row = db.prepare('SELECT * FROM onboarding WHERE user_id = ?').get(req.userId);
  res.json({ onboarding: row ? toDto(row) : null });
});

const schema = z.object({
  vision12m: z.string().default(''),
  monthlyIncomeTarget: z.number().default(0),
  businessRevenueTarget: z.number().default(0),
  profitTarget: z.number().default(0),
  savingsTarget: z.number().default(0),
  assetTarget: z.number().default(0),
  homeTarget: z.number().default(0),
  impactTarget: z.string().default(''),
  healthGoal: z.string().default(''),
  familyGoal: z.string().default(''),
});

onboardingRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid onboarding data' });
  const d = parsed.data;

  db.prepare(
    `INSERT INTO onboarding (user_id, vision_12m, monthly_income_target, business_revenue_target, profit_target, savings_target, asset_target, home_target, impact_target, health_goal, family_goal)
     VALUES (@userId, @vision12m, @monthlyIncomeTarget, @businessRevenueTarget, @profitTarget, @savingsTarget, @assetTarget, @homeTarget, @impactTarget, @healthGoal, @familyGoal)
     ON CONFLICT(user_id) DO UPDATE SET
       vision_12m=excluded.vision_12m, monthly_income_target=excluded.monthly_income_target,
       business_revenue_target=excluded.business_revenue_target, profit_target=excluded.profit_target,
       savings_target=excluded.savings_target, asset_target=excluded.asset_target,
       home_target=excluded.home_target, impact_target=excluded.impact_target,
       health_goal=excluded.health_goal, family_goal=excluded.family_goal`
  ).run({ userId: req.userId, ...d });

  db.prepare(
    `INSERT INTO money_goals (user_id, monthly_revenue_target, monthly_profit_target, savings_target, asset_target, personal_income_target)
     VALUES (@userId, @businessRevenueTarget, @profitTarget, @savingsTarget, @assetTarget, @monthlyIncomeTarget)
     ON CONFLICT(user_id) DO UPDATE SET
       monthly_revenue_target=excluded.monthly_revenue_target, monthly_profit_target=excluded.monthly_profit_target,
       savings_target=excluded.savings_target, asset_target=excluded.asset_target,
       personal_income_target=excluded.personal_income_target`
  ).run({ userId: req.userId, ...d });

  // Auto-generate the top-level vision goal chain: 12mo -> 90d -> 30d -> week -> today
  const existingVisionGoal = db
    .prepare("SELECT id FROM goals WHERE user_id = ? AND title = 'Primary Vision'")
    .get(req.userId);
  if (!existingVisionGoal && d.vision12m) {
    db.prepare(
      `INSERT INTO goals (user_id, category, title, vision, target_12m, target_90d, target_30d, target_weekly, today_action, progress_current, progress_target, unit)
       VALUES (?, 'Business', 'Primary Vision', ?, ?, ?, ?, ?, ?, 0, 100, '%')`
    ).run(
      req.userId,
      d.vision12m,
      d.vision12m,
      'Break the 12-month vision into a 90-day milestone.',
      'Break the 90-day milestone into a 30-day target.',
      'Identify this week\'s single most important target.',
      'Take the next small, concrete action toward the vision.'
    );
  }

  db.prepare('UPDATE users SET onboarding_completed = 1 WHERE id = ?').run(req.userId);
  res.json({ success: true });
});
