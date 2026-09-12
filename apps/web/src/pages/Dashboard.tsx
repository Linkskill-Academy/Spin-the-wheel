import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Sunrise, Moon as MoonIcon, Zap } from 'lucide-react';
import type { DashboardSummary } from '@mecrm/types';
import { formatCurrencyINR, progressPercent } from '@mecrm/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, ProgressBar, ScoreCircle, SectionTitle, Pill } from '@mecrm/ui';

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const isStudent = user?.accountMode === 'student';

  useEffect(() => {
    api.get<DashboardSummary>('/dashboard').then(setData);
  }, []);

  if (!data) {
    return <div className="p-6 text-muted">Loading your day...</div>;
  }

  const topGoal = data.goals[0];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink">
          {timeGreeting()}, {data.greetingName}
        </h1>
        <p className="text-muted mt-1 text-base">What are we creating today?</p>
      </header>

      {data.coachingMessages.length > 0 && (
        <div className="bg-primary-light border border-primary/20 rounded-2xl px-5 py-4">
          <p className="text-primary-dark font-semibold">{data.coachingMessages[0]}</p>
        </div>
      )}

      {/* Today's Focus */}
      <Card>
        <SectionTitle>Today's Focus</SectionTitle>
        {data.todayFocus.hasMorningEntry ? (
          <div className="grid sm:grid-cols-3 gap-4">
            <FocusItem label="#1 Priority" value={data.todayFocus.priority || 'Not set yet'} />
            <FocusItem label="Money Move" value={data.todayFocus.moneyMove || 'Not set yet'} />
            <FocusItem label="Courage Action" value={data.todayFocus.courageAction || 'Not set yet'} />
          </div>
        ) : (
          <p className="text-muted mb-4">You haven't started today's morning routine yet. One page decides your whole day.</p>
        )}
        <Link to="/morning" className="btn-primary inline-flex items-center gap-2 mt-4">
          {data.todayFocus.hasMorningEntry ? 'Continue Today' : 'Start Today'} <ArrowRight size={16} />
        </Link>
      </Card>

      {/* Goal Progress */}
      <Card>
        <SectionTitle action={<Link to="/goals" className="text-sm font-semibold text-primary">View all</Link>}>
          Goal Progress
        </SectionTitle>
        {topGoal ? (
          <div>
            <p className="font-bold text-ink">{topGoal.title}</p>
            <p className="text-sm text-muted mt-1">{topGoal.vision}</p>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">
                  {topGoal.progressCurrent} / {topGoal.progressTarget} {topGoal.unit}
                </span>
                <span className="font-semibold text-primary">
                  {progressPercent(topGoal.progressCurrent, topGoal.progressTarget)}%
                </span>
              </div>
              <ProgressBar percent={progressPercent(topGoal.progressCurrent, topGoal.progressTarget)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 text-sm">
              <MiniTarget label="90-Day" value={topGoal.target90d} />
              <MiniTarget label="30-Day" value={topGoal.target30d} />
              <MiniTarget label="This Week" value={topGoal.targetWeekly} />
              <MiniTarget label="Today" value={topGoal.todayAction} />
            </div>
          </div>
        ) : (
          <p className="text-muted">No goals yet. Add your first vision on the Goals page.</p>
        )}
      </Card>

      {!isStudent && (
        <Card>
          <SectionTitle action={<Link to="/money" className="text-sm font-semibold text-primary">Open Money</Link>}>
            Money
          </SectionTitle>
          <div className="grid sm:grid-cols-2 gap-4">
            <MoneyStat label="Monthly Revenue" target={data.money.monthlyRevenueTarget} current={data.money.currentRevenue} />
            <MoneyStat label="Profit" target={data.money.profitTarget} current={data.money.currentProfit} />
          </div>
          <p className="text-sm text-muted mt-4">{data.money.nextMilestone}</p>
        </Card>
      )}

      {!isStudent && (
        <Card>
          <SectionTitle action={<Link to="/crm" className="text-sm font-semibold text-primary">Open CRM</Link>}>
            Business Pipeline
          </SectionTitle>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
            <PipelineStat label="New" value={data.pipeline.newLeads} />
            <PipelineStat label="Conversations" value={data.pipeline.conversations} />
            <PipelineStat label="Follow-ups" value={data.pipeline.followups} />
            <PipelineStat label="Proposals" value={data.pipeline.proposals} />
            <PipelineStat label="Won" value={data.pipeline.won} tone="primary" />
            <PipelineStat label="Lost" value={data.pipeline.lost} />
          </div>
          {data.pipeline.overdueFollowups > 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mt-4">
              {data.pipeline.overdueFollowups} follow-up{data.pipeline.overdueFollowups > 1 ? 's are' : ' is'} overdue. Revenue may be
              sitting right there.
            </p>
          )}
        </Card>
      )}

      {/* Today's Score */}
      <Card>
        <SectionTitle>Today's Score</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          <ScoreCircle label="Clarity" value={data.score.clarity} />
          <ScoreCircle label="Energy" value={data.score.energy} />
          <ScoreCircle label="Confidence" value={data.score.confidence} />
          <ScoreCircle label="Focus" value={data.score.focus} />
        </div>
      </Card>

      {/* Streaks */}
      <Card>
        <SectionTitle>Streaks</SectionTitle>
        <div className="grid grid-cols-3 gap-4">
          <StreakStat icon={Sunrise} label="Morning" value={data.streaks.morningCheckin} />
          <StreakStat icon={Zap} label="Execution" value={data.streaks.execution} />
          <StreakStat icon={MoonIcon} label="Night Review" value={data.streaks.nightReview} />
        </div>
      </Card>
    </div>
  );
}

function FocusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-softbg rounded-xl p-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className="font-semibold text-ink">{value}</p>
    </div>
  );
}

function MiniTarget({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-softbg rounded-xl p-3">
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-ink mt-0.5 line-clamp-2">{value || '—'}</p>
    </div>
  );
}

function MoneyStat({ label, target, current }: { label: string; target: number; current: number }) {
  const percent = progressPercent(current, target);
  const gap = Math.max(target - current, 0);
  return (
    <div className="bg-softbg rounded-xl p-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xl font-extrabold text-ink">{formatCurrencyINR(current)}</span>
        <span className="text-xs text-muted">of {formatCurrencyINR(target)}</span>
      </div>
      <ProgressBar percent={percent} />
      <p className="text-xs text-muted mt-2">Gap: {formatCurrencyINR(gap)}</p>
    </div>
  );
}

function PipelineStat({ label, value, tone }: { label: string; value: number; tone?: 'primary' }) {
  return (
    <div className="bg-softbg rounded-xl py-3 px-1">
      <p className={`text-2xl font-extrabold ${tone === 'primary' ? 'text-primary' : 'text-ink'}`}>{value}</p>
      <p className="text-[11px] text-muted font-medium mt-0.5">{label}</p>
    </div>
  );
}

function StreakStat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-2 bg-softbg rounded-xl py-4">
      <Icon className="text-primary" size={22} />
      <span className="text-xl font-extrabold text-ink">{value}</span>
      <span className="text-xs text-muted font-medium">{label}</span>
    </div>
  );
}
