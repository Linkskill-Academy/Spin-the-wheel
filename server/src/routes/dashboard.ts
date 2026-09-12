import { Router } from 'express';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { todayStr, monthStr, daysAgoStr } from '../utils/date';
import { generateCoachingMessages } from '@mecrm/shared';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

function computeStreak(dates: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  // If today is not logged yet, streak counts up to yesterday (still positive, not punitive).
  if (!dates.has(todayStr())) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

dashboardRouter.get('/', (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const today = todayStr();
  const month = monthStr();

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  const morning = db.prepare('SELECT * FROM morning_routines WHERE user_id = ? AND date = ?').get(userId, today) as any;

  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at ASC').all(userId) as any[];

  const moneyGoals = db.prepare('SELECT * FROM money_goals WHERE user_id = ?').get(userId) as any;
  const moneyRows = db
    .prepare("SELECT type, SUM(amount) as total FROM money_entries WHERE user_id = ? AND date LIKE ? GROUP BY type")
    .all(userId, `${month}%`) as { type: string; total: number }[];
  const moneyTotals: Record<string, number> = {};
  for (const r of moneyRows) moneyTotals[r.type] = r.total || 0;

  const currentRevenue = moneyTotals.revenue || 0;
  const monthlyRevenueTarget = moneyGoals?.monthly_revenue_target || 0;
  const gapToRevenue = Math.max(monthlyRevenueTarget - currentRevenue, 0);

  const leadRows = db.prepare('SELECT status, estimated_value, next_followup FROM leads WHERE user_id = ?').all(userId) as {
    status: string;
    estimated_value: number;
    next_followup: string | null;
  }[];
  let newLeads = 0,
    conversations = 0,
    followups = 0,
    proposals = 0,
    won = 0,
    lost = 0,
    totalPipelineValue = 0,
    potentialRevenue = 0,
    wonRevenue = 0,
    followupsToday = 0,
    overdueFollowups = 0;
  for (const l of leadRows) {
    totalPipelineValue += l.estimated_value || 0;
    if (l.status === 'New Lead') newLeads++;
    if (l.status === 'Conversation') conversations++;
    if (l.status === 'Follow-up') followups++;
    if (l.status === 'Proposal') proposals++;
    if (l.status === 'Won') {
      won++;
      wonRevenue += l.estimated_value || 0;
    } else if (l.status === 'Lost') {
      lost++;
    } else {
      potentialRevenue += l.estimated_value || 0;
    }
    if (l.next_followup === today) followupsToday++;
    if (l.next_followup && l.next_followup < today) overdueFollowups++;
  }

  // Streaks
  const morningDates = new Set(
    (db.prepare('SELECT date FROM morning_routines WHERE user_id = ? AND completed = 1').all(userId) as { date: string }[]).map(
      (r) => r.date
    )
  );
  const nightDates = new Set(
    (db.prepare('SELECT date FROM night_reviews WHERE user_id = ? AND completed = 1').all(userId) as { date: string }[]).map(
      (r) => r.date
    )
  );
  const taskDates = new Set(
    (db.prepare('SELECT DISTINCT date FROM tasks WHERE user_id = ? AND done = 1').all(userId) as { date: string }[]).map(
      (r) => r.date
    )
  );

  const streaks = {
    morningCheckin: computeStreak(morningDates),
    execution: computeStreak(taskDates),
    nightReview: computeStreak(nightDates),
  };

  // Today's Big 3 completion count from tasks (done)
  const todaysTasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? AND date = ?').all(userId, today) as any[];
  const bigTask = todaysTasks.find((t) => t.size === 'big');
  const big3Completed = [morning?.big3_revenue, morning?.big3_growth, morning?.big3_personal].filter(Boolean).length;

  const tasksMissed = todaysTasks.filter((t) => !t.done).length;

  const coachingMessages = generateCoachingMessages({
    leadsCount: leadRows.length,
    overdueFollowups,
    followupsToday,
    big3Completed: morning ? big3Completed : 0,
    focusScore: morning?.focus || 0,
    tasksMissed,
    hitMilestone: currentRevenue > 0 && monthlyRevenueTarget > 0 && currentRevenue >= monthlyRevenueTarget,
    eveningReviewStreak: streaks.nightReview,
    morningRoutineDoneToday: !!morning?.completed,
  });

  res.json({
    greetingName: user?.name || 'there',
    todayFocus: {
      priority: morning?.big3_revenue || '',
      moneyMove: morning?.money_move || '',
      courageAction: morning?.courage_action || '',
      hasMorningEntry: !!morning,
    },
    goals: goals.map((g) => ({
      id: g.id,
      userId: g.user_id,
      category: g.category,
      title: g.title,
      vision: g.vision,
      target12m: g.target_12m,
      target90d: g.target_90d,
      target30d: g.target_30d,
      targetWeekly: g.target_weekly,
      todayAction: g.today_action,
      progressCurrent: g.progress_current,
      progressTarget: g.progress_target,
      unit: g.unit,
      createdAt: g.created_at,
    })),
    money: {
      monthlyRevenueTarget,
      currentRevenue,
      profitTarget: moneyGoals?.monthly_profit_target || 0,
      currentProfit: moneyTotals.profit || 0,
      savings: moneyTotals.savings || 0,
      investments: moneyTotals.investment || 0,
      gapToRevenue,
      nextMilestone:
        gapToRevenue > 0
          ? `${Math.ceil(gapToRevenue / 1000) * 1000} more to reach this month's revenue target`
          : "Target reached. Time to set the next one.",
    },
    pipeline: {
      newLeads,
      conversations,
      followups,
      proposals,
      won,
      lost,
      totalPipelineValue,
      potentialRevenue,
      wonRevenue,
      followupsToday,
      overdueFollowups,
    },
    score: {
      clarity: morning?.clarity || 0,
      energy: morning?.energy || 0,
      confidence: morning?.confidence || 0,
      focus: morning?.focus || 0,
    },
    streaks,
    coachingMessages,
  });
});
