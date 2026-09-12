// Shared domain types used by server, web, extension and mobile.

export type AccountMode = 'founder' | 'student';

export interface User {
  id: number;
  email: string;
  name: string;
  accountMode: AccountMode;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type GoalCategory =
  | 'Business'
  | 'Money'
  | 'Home'
  | 'Family'
  | 'Health'
  | 'Career'
  | 'Lifestyle'
  | 'Learning'
  | 'Impact';

export interface Goal {
  id: number;
  userId: number;
  category: GoalCategory;
  title: string;
  vision: string;
  target12m: string;
  target90d: string;
  target30d: string;
  targetWeekly: string;
  todayAction: string;
  progressCurrent: number;
  progressTarget: number;
  unit: string;
  createdAt: string;
}

export interface OnboardingData {
  vision12m: string;
  monthlyIncomeTarget: number;
  businessRevenueTarget: number;
  profitTarget: number;
  savingsTarget: number;
  assetTarget: number;
  homeTarget: number;
  impactTarget: string;
  healthGoal: string;
  familyGoal: string;
}

export interface MorningRoutine {
  id?: number;
  userId: number;
  date: string;
  gratitude1: string;
  gratitude2: string;
  gratitude3: string;
  futureSelf: string;
  manifestationStatement: string;
  repeat3Done: boolean;
  repeat6Done: boolean;
  repeat9Done: boolean;
  visualizationSee: string;
  visualizationHear: string;
  visualizationFeel: string;
  visualizationWho: string;
  visualizationResult: string;
  big3Revenue: string;
  big3Growth: string;
  big3Personal: string;
  moneyMove: string;
  courageAction: string;
  clarity: number;
  energy: number;
  confidence: number;
  focus: number;
  completed: boolean;
}

export interface NightReview {
  id?: number;
  userId: number;
  date: string;
  businessWin: string;
  moneyEarned: boolean;
  moneyLead: boolean;
  moneyOffer: boolean;
  moneyFollowup: boolean;
  moneyAsset: boolean;
  moneyProduct: boolean;
  personalWin: string;
  evidence: string;
  lesson: string;
  release: string;
  tomorrowPriority: string;
  completed: boolean;
}

export type CheckinType = 'quick' | '1111' | '2222' | '333';

export interface DailyCheckin {
  id?: number;
  userId: number;
  date: string;
  type: CheckinType;
  completedTasks?: string;
  pendingTasks?: string;
  distractions?: string;
  oneTask?: string;
  extra?: Record<string, unknown>;
  createdAt?: string;
}

export type LeadStatus =
  | 'New Lead'
  | 'Contacted'
  | 'Conversation'
  | 'Follow-up'
  | 'Proposal'
  | 'Won'
  | 'Lost';

export type OpportunityType =
  | 'College'
  | 'Corporate'
  | 'Vendor'
  | 'Student'
  | 'Partnership'
  | 'Other';

export interface Lead {
  id: number;
  userId: number;
  name: string;
  organisation: string;
  role: string;
  phone: string;
  email: string;
  source: string;
  opportunityType: OpportunityType;
  estimatedValue: number;
  notes: string;
  nextFollowup: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export type CollegeStatus =
  | 'To Contact'
  | 'Contacted'
  | 'Interested'
  | 'Meeting'
  | 'Proposal'
  | 'Negotiation'
  | 'Won'
  | 'Not Now';

export interface CollegeOutreach {
  id: number;
  userId: number;
  collegeName: string;
  city: string;
  contactPerson: string;
  role: string;
  phone: string;
  email: string;
  department: string;
  trainingNeed: string;
  lastContacted: string | null;
  nextFollowup: string | null;
  status: CollegeStatus;
  proposalSent: boolean;
  estimatedValue: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type MoneyEntryType =
  | 'revenue'
  | 'expense'
  | 'profit'
  | 'savings'
  | 'investment'
  | 'asset'
  | 'debt';

export interface MoneyEntry {
  id: number;
  userId: number;
  date: string;
  type: MoneyEntryType;
  amount: number;
  note: string;
}

export interface MoneyGoals {
  id?: number;
  userId: number;
  monthlyRevenueTarget: number;
  monthlyProfitTarget: number;
  savingsTarget: number;
  assetTarget: number;
  personalIncomeTarget: number;
}

export interface Habit {
  id: number;
  userId: number;
  name: string;
  icon: string;
  archived: boolean;
  createdAt: string;
}

export interface HabitLog {
  id?: number;
  habitId: number;
  date: string;
  done: boolean;
}

export type EvidenceCategory =
  | 'Business'
  | 'Money'
  | 'Confidence'
  | 'Discipline'
  | 'Health'
  | 'Family'
  | 'Learning'
  | 'Leadership';

export interface EvidenceLog {
  id: number;
  userId: number;
  date: string;
  category: EvidenceCategory;
  description: string;
  createdAt: string;
}

export interface WeeklyReview {
  id?: number;
  userId: number;
  weekStart: string;
  data: Record<string, unknown>;
  createdAt?: string;
}

export interface MonthlyReview {
  id?: number;
  userId: number;
  month: string;
  data: Record<string, unknown>;
  createdAt?: string;
}

export type TaskSize = 'big' | 'medium' | 'small';

export interface Task {
  id: number;
  userId: number;
  date: string;
  title: string;
  size: TaskSize;
  done: boolean;
  focusMinutes: number;
  createdAt: string;
}

export interface Streaks {
  morningCheckin: number;
  execution: number;
  nightReview: number;
}

export interface DashboardSummary {
  greetingName: string;
  todayFocus: {
    priority: string;
    moneyMove: string;
    courageAction: string;
    hasMorningEntry: boolean;
  };
  goals: Goal[];
  money: {
    monthlyRevenueTarget: number;
    currentRevenue: number;
    profitTarget: number;
    currentProfit: number;
    savings: number;
    investments: number;
    gapToRevenue: number;
    nextMilestone: string;
  };
  pipeline: {
    newLeads: number;
    conversations: number;
    followups: number;
    proposals: number;
    won: number;
    lost: number;
    totalPipelineValue: number;
    potentialRevenue: number;
    wonRevenue: number;
    followupsToday: number;
    overdueFollowups: number;
  };
  score: {
    clarity: number;
    energy: number;
    confidence: number;
    focus: number;
  };
  streaks: Streaks;
  coachingMessages: string[];
}
