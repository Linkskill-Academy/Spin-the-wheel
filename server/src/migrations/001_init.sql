CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  account_mode TEXT NOT NULL DEFAULT 'founder',
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS onboarding (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  vision_12m TEXT DEFAULT '',
  monthly_income_target REAL DEFAULT 0,
  business_revenue_target REAL DEFAULT 0,
  profit_target REAL DEFAULT 0,
  savings_target REAL DEFAULT 0,
  asset_target REAL DEFAULT 0,
  home_target REAL DEFAULT 0,
  impact_target TEXT DEFAULT '',
  health_goal TEXT DEFAULT '',
  family_goal TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  vision TEXT DEFAULT '',
  target_12m TEXT DEFAULT '',
  target_90d TEXT DEFAULT '',
  target_30d TEXT DEFAULT '',
  target_weekly TEXT DEFAULT '',
  today_action TEXT DEFAULT '',
  progress_current REAL DEFAULT 0,
  progress_target REAL DEFAULT 100,
  unit TEXT DEFAULT '%',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  completed_tasks TEXT DEFAULT '',
  pending_tasks TEXT DEFAULT '',
  distractions TEXT DEFAULT '',
  one_task TEXT DEFAULT '',
  extra TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS morning_routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  gratitude1 TEXT DEFAULT '',
  gratitude2 TEXT DEFAULT '',
  gratitude3 TEXT DEFAULT '',
  future_self TEXT DEFAULT '',
  manifestation_statement TEXT DEFAULT '',
  repeat_3_done INTEGER DEFAULT 0,
  repeat_6_done INTEGER DEFAULT 0,
  repeat_9_done INTEGER DEFAULT 0,
  visualization_see TEXT DEFAULT '',
  visualization_hear TEXT DEFAULT '',
  visualization_feel TEXT DEFAULT '',
  visualization_who TEXT DEFAULT '',
  visualization_result TEXT DEFAULT '',
  big3_revenue TEXT DEFAULT '',
  big3_growth TEXT DEFAULT '',
  big3_personal TEXT DEFAULT '',
  money_move TEXT DEFAULT '',
  courage_action TEXT DEFAULT '',
  clarity INTEGER DEFAULT 0,
  energy INTEGER DEFAULT 0,
  confidence INTEGER DEFAULT 0,
  focus INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS night_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  business_win TEXT DEFAULT '',
  money_earned INTEGER DEFAULT 0,
  money_lead INTEGER DEFAULT 0,
  money_offer INTEGER DEFAULT 0,
  money_followup INTEGER DEFAULT 0,
  money_asset INTEGER DEFAULT 0,
  money_product INTEGER DEFAULT 0,
  personal_win TEXT DEFAULT '',
  evidence TEXT DEFAULT '',
  lesson TEXT DEFAULT '',
  release TEXT DEFAULT '',
  tomorrow_priority TEXT DEFAULT '',
  completed INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  organisation TEXT DEFAULT '',
  role TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  source TEXT DEFAULT '',
  opportunity_type TEXT DEFAULT 'Other',
  estimated_value REAL DEFAULT 0,
  notes TEXT DEFAULT '',
  next_followup TEXT,
  status TEXT NOT NULL DEFAULT 'New Lead',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS college_outreach (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  college_name TEXT NOT NULL,
  city TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  role TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  department TEXT DEFAULT '',
  training_need TEXT DEFAULT '',
  last_contacted TEXT,
  next_followup TEXT,
  status TEXT NOT NULL DEFAULT 'To Contact',
  proposal_sent INTEGER DEFAULT 0,
  estimated_value REAL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS money_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS money_goals (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  monthly_revenue_target REAL DEFAULT 0,
  monthly_profit_target REAL DEFAULT 0,
  savings_target REAL DEFAULT 0,
  asset_target REAL DEFAULT 0,
  personal_income_target REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'CheckCircle2',
  archived INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  done INTEGER DEFAULT 1,
  UNIQUE(habit_id, date)
);

CREATE TABLE IF NOT EXISTS evidence_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS monthly_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, month)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT 'small',
  done INTEGER DEFAULT 0,
  focus_minutes INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_college_user ON college_outreach(user_id);
CREATE INDEX IF NOT EXISTS idx_money_entries_user ON money_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_evidence_user ON evidence_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON daily_checkins(user_id, date);
