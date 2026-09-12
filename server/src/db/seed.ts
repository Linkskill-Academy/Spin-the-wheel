import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './connection';
import { runMigrations } from './migrate';
import { todayStr, daysAgoStr, weekStartStr, monthStr } from '../utils/date';

runMigrations();

const DEMO_EMAIL = 'demo@manifestcrm.app';

function seed() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL) as { id: number } | undefined;
  if (existing) {
    console.log('Demo account already exists. Skipping seed. (email: demo@manifestcrm.app / password: Demo@1234)');
    return;
  }

  const passwordHash = bcrypt.hashSync('Demo@1234', 10);
  const userResult = db
    .prepare('INSERT INTO users (email, password_hash, name, account_mode, onboarding_completed) VALUES (?, ?, ?, ?, 1)')
    .run(DEMO_EMAIL, passwordHash, 'Sreemathy', 'founder');
  const userId = Number(userResult.lastInsertRowid);

  db.prepare(
    `INSERT INTO onboarding (user_id, vision_12m, monthly_income_target, business_revenue_target, profit_target, savings_target, asset_target, home_target, impact_target, health_goal, family_goal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    'Build a training and coaching business that transforms 1,000 students while owning a home for my family.',
    150000,
    800000,
    300000,
    50000,
    2000000,
    12500000,
    'Train 1,000 students in career-ready skills',
    'Consistent morning workout and 8,000 steps daily',
    'One uninterrupted family dinner every day'
  );

  db.prepare(
    `INSERT INTO money_goals (user_id, monthly_revenue_target, monthly_profit_target, savings_target, asset_target, personal_income_target)
     VALUES (?, 800000, 300000, 50000, 12500000, 150000)`
  ).run(userId);

  // Goals across categories with the full vision -> today chain
  const goals: [string, string, string, string, string, string, string, number, number, string][] = [
    [
      'Business',
      'College Training Partnerships',
      'Become the go-to skills-training partner for 100 colleges across Tamil Nadu.',
      '100 college partnerships signed',
      '25 colleges in active conversation or signed',
      '8 new college conversations started',
      'Contact 10 colleges this week',
      4,
      10,
      'colleges',
    ],
    [
      'Business',
      'Vendor & Corporate Tie-ups',
      'Partner with 20 vendors and corporates for referrals and bulk training contracts.',
      '20 vendor partnerships',
      '6 signed partnerships',
      '2 new partnership conversations',
      'Follow up with 3 vendor leads',
      2,
      20,
      'partners',
    ],
    [
      'Business',
      'Student Enrollments',
      'Train 1,000 students at ₹20,000 per program.',
      '1,000 students enrolled',
      '150 students enrolled',
      '40 students enrolled',
      'Enroll 5 students this week',
      82,
      1000,
      'students',
    ],
    [
      'Money',
      'Monthly Revenue Target',
      'Reach ₹8,00,000 in monthly revenue through training programs and partnerships.',
      '₹96,00,000 annual run-rate',
      '₹24,00,000 quarterly revenue',
      '₹8,00,000 this month',
      '₹2,00,000 this week',
      20000,
      800000,
      '₹',
    ],
    [
      'Home',
      'Property Goal',
      'Own a home for the family, valued around ₹1,25,00,000.',
      '₹1,25,00,000 property secured',
      'Down payment plan finalised',
      'Savings plan active',
      'Research 3 properties or loan options',
      500000,
      12500000,
      '₹',
    ],
    [
      'Health',
      'Daily Movement',
      'Feel strong and energised through consistent movement.',
      'Daily workout habit fully established',
      '75 workout days in 90 days',
      '24 workout days in 30 days',
      '5 workouts this week',
      3,
      5,
      'sessions',
    ],
  ];

  const goalStmt = db.prepare(
    `INSERT INTO goals (user_id, category, title, vision, target_12m, target_90d, target_30d, target_weekly, today_action, progress_current, progress_target, unit)
     VALUES (@userId, @category, @title, @vision, @target12m, @target90d, @target30d, @targetWeekly, @todayAction, @progressCurrent, @progressTarget, @unit)`
  );
  for (const [category, title, vision, target12m, target90d, target30d, targetWeekly, current, target, unit] of goals) {
    goalStmt.run({
      userId,
      category,
      title,
      vision,
      target12m,
      target90d,
      target30d,
      targetWeekly,
      todayAction: 'Take one concrete step toward this goal today.',
      progressCurrent: current,
      progressTarget: target,
      unit,
    });
  }

  // Money entries for the current month — realistic, modest, honest numbers
  const moneyStmt = db.prepare('INSERT INTO money_entries (user_id, date, type, amount, note) VALUES (?, ?, ?, ?, ?)');
  moneyStmt.run(userId, daysAgoStr(10), 'revenue', 15000, 'Corporate workshop - half batch payment');
  moneyStmt.run(userId, daysAgoStr(4), 'revenue', 5000, 'Student enrollment - installment');
  moneyStmt.run(userId, daysAgoStr(8), 'expense', 6000, 'Marketing - social media ads');
  moneyStmt.run(userId, daysAgoStr(6), 'expense', 5000, 'Venue rental for workshop');
  moneyStmt.run(userId, daysAgoStr(3), 'profit', 4000, 'Net after this month\'s direct costs');
  moneyStmt.run(userId, daysAgoStr(2), 'savings', 2000, 'Moved to savings account');
  // Previous months for trend chart
  for (let m = 1; m <= 4; m++) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    const dateStr = d.toISOString().slice(0, 10);
    moneyStmt.run(userId, dateStr, 'revenue', 10000 + m * 3000, `Month -${m} revenue`);
    moneyStmt.run(userId, dateStr, 'expense', 6000 + m * 1000, `Month -${m} expenses`);
    moneyStmt.run(userId, dateStr, 'profit', Math.max(0, 4000 + m * 2000), `Month -${m} profit`);
  }

  // Leads / CRM pipeline
  const leadStmt = db.prepare(
    `INSERT INTO leads (user_id, name, organisation, role, phone, email, source, opportunity_type, estimated_value, notes, next_followup, status)
     VALUES (@userId, @name, @organisation, @role, @phone, @email, @source, @opportunityType, @estimatedValue, @notes, @nextFollowup, @status)`
  );
  const leads = [
    { name: 'Priya Ramesh', organisation: 'ABC Arts College', role: 'HOD Placement', phone: '9000000001', email: 'priya@abccollege.edu', source: 'LinkedIn', opportunityType: 'College', estimatedValue: 150000, notes: 'Interested in a 2-day soft skills workshop.', nextFollowup: todayStr(), status: 'Follow-up' },
    { name: 'Arun Kumar', organisation: 'Vendor Connect Pvt Ltd', role: 'Partnerships Lead', phone: '9000000002', email: 'arun@vendorconnect.com', source: 'Referral', opportunityType: 'Vendor', estimatedValue: 200000, notes: 'Wants a revenue-share model.', nextFollowup: daysAgoStr(-2), status: 'Proposal' },
    { name: 'Divya S', organisation: 'Self', role: 'Student', phone: '9000000003', email: 'divya@example.com', source: 'Instagram', opportunityType: 'Student', estimatedValue: 20000, notes: 'Asked about EMI options.', nextFollowup: todayStr(), status: 'Conversation' },
    { name: 'Karthik Rajan', organisation: 'Nexus Corporate Training', role: 'L&D Manager', phone: '9000000004', email: 'karthik@nexuscorp.com', source: 'Cold outreach', opportunityType: 'Corporate', estimatedValue: 300000, notes: '', nextFollowup: daysAgoStr(-5), status: 'New Lead' },
    { name: 'Meena Iyer', organisation: 'Bright Future College', role: 'Principal', phone: '9000000005', email: 'meena@brightfuture.edu', source: 'Event', opportunityType: 'College', estimatedValue: 180000, notes: 'Signed! Batch starts next month.', nextFollowup: null, status: 'Won' },
    { name: 'Suresh Babu', organisation: 'Skill Bridge', role: 'Founder', phone: '9000000006', email: 'suresh@skillbridge.in', source: 'Referral', opportunityType: 'Partnership', estimatedValue: 100000, notes: 'Went with a competitor.', nextFollowup: null, status: 'Lost' },
    { name: 'Lavanya R', organisation: 'Self', role: 'Student', phone: '9000000007', email: 'lavanya@example.com', source: 'WhatsApp', opportunityType: 'Student', estimatedValue: 20000, notes: 'Overdue follow-up - reach out today.', nextFollowup: daysAgoStr(2), status: 'Follow-up' },
  ] as const;
  for (const l of leads) leadStmt.run({ userId, ...l });

  // College outreach tracker
  const collegeStmt = db.prepare(
    `INSERT INTO college_outreach (user_id, college_name, city, contact_person, role, phone, email, department, training_need, last_contacted, next_followup, status, proposal_sent, estimated_value, notes)
     VALUES (@userId, @collegeName, @city, @contactPerson, @role, @phone, @email, @department, @trainingNeed, @lastContacted, @nextFollowup, @status, @proposalSent, @estimatedValue, @notes)`
  );
  const colleges = [
    { collegeName: 'ABC Arts College', city: 'Salem', contactPerson: 'Priya Ramesh', role: 'HOD Placement', phone: '9000000001', email: 'priya@abccollege.edu', department: 'Placement Cell', trainingNeed: 'Soft skills + resume building', lastContacted: todayStr(), nextFollowup: daysAgoStr(-3), status: 'Meeting', proposalSent: 0, estimatedValue: 150000, notes: '' },
    { collegeName: 'Bright Future College', city: 'Salem', contactPerson: 'Meena Iyer', role: 'Principal', phone: '9000000005', email: 'meena@brightfuture.edu', department: 'Administration', trainingNeed: 'Full career-readiness program', lastContacted: daysAgoStr(10), nextFollowup: null, status: 'Won', proposalSent: 1, estimatedValue: 180000, notes: 'Signed!' },
    { collegeName: 'Sri Ganesh Engineering College', city: 'Namakkal', contactPerson: 'Ravi Shankar', role: 'Dean', phone: '9000000010', email: 'ravi@srige.edu', department: 'Training & Placement', trainingNeed: 'Technical communication', lastContacted: daysAgoStr(5), nextFollowup: todayStr(), status: 'Interested', proposalSent: 0, estimatedValue: 120000, notes: '' },
    { collegeName: 'Vivekananda College', city: 'Erode', contactPerson: '', role: '', phone: '', email: '', department: '', trainingNeed: '', lastContacted: null, nextFollowup: null, status: 'To Contact', proposalSent: 0, estimatedValue: 0, notes: '' },
    { collegeName: 'St. Mary\'s College', city: 'Salem', contactPerson: '', role: '', phone: '', email: '', department: '', trainingNeed: '', lastContacted: null, nextFollowup: null, status: 'To Contact', proposalSent: 0, estimatedValue: 0, notes: '' },
  ] as const;
  for (const c of colleges) collegeStmt.run({ userId, ...c });

  // Habits
  const habitNames = ['Morning Routine', 'Workout', 'College Outreach', 'Follow-ups', 'Night Review'];
  const habitIds: number[] = [];
  for (const name of habitNames) {
    const r = db.prepare('INSERT INTO habits (user_id, name) VALUES (?, ?)').run(userId, name);
    habitIds.push(Number(r.lastInsertRowid));
  }
  const habitLogStmt = db.prepare(
    `INSERT INTO habit_logs (habit_id, date, done) VALUES (?, ?, 1) ON CONFLICT(habit_id, date) DO NOTHING`
  );
  for (const habitId of habitIds) {
    for (let i = 1; i <= 5; i++) {
      if (Math.random() > 0.25) habitLogStmt.run(habitId, daysAgoStr(i));
    }
  }

  // Evidence log
  const evidenceStmt = db.prepare('INSERT INTO evidence_logs (user_id, date, category, description) VALUES (?, ?, ?, ?)');
  evidenceStmt.run(userId, daysAgoStr(1), 'Business', 'Closed the Bright Future College partnership after 3 follow-up calls.');
  evidenceStmt.run(userId, daysAgoStr(2), 'Discipline', 'Completed the morning routine and workout before 8am.');
  evidenceStmt.run(userId, daysAgoStr(3), 'Confidence', 'Presented the training proposal to a room of 5 decision makers without notes.');
  evidenceStmt.run(userId, daysAgoStr(4), 'Money', 'Received the first installment from a new student enrollment.');

  // Morning routine + night review for yesterday (completed) and a partial for today
  db.prepare(
    `INSERT INTO morning_routines (
      user_id, date, gratitude1, gratitude2, gratitude3, future_self, manifestation_statement,
      repeat_3_done, repeat_6_done, repeat_9_done, visualization_see, visualization_hear, visualization_feel,
      visualization_who, visualization_result, big3_revenue, big3_growth, big3_personal, money_move, courage_action,
      clarity, energy, confidence, focus, completed
    ) VALUES (?, ?, 'My health', 'My students', 'This growing business', 'She moves first and follows up without waiting to feel ready.',
      'I am building a training business that changes lives, one student at a time.',
      1, 1, 1, 'A packed workshop hall', 'Applause after a session', 'Proud and calm', 'My students and my family',
      'Signed 3 new college partnerships', 'Call 5 warm leads', 'Post one piece of content', 'Have dinner with family without my phone',
      'Call the corporate lead I have been avoiding', 'Call the corporate lead I have been avoiding', 8, 7, 8, 7, 1)`
  ).run(userId, daysAgoStr(1));

  db.prepare(
    `INSERT INTO night_reviews (
      user_id, date, business_win, money_earned, money_lead, money_offer, money_followup, money_asset, money_product,
      personal_win, evidence, lesson, release, tomorrow_priority, completed
    ) VALUES (?, ?, 'Followed up with 3 leads and moved one to proposal stage.', 1, 1, 1, 1, 0, 0,
      'Finished the workout streak for the week.', 'Moved a lead from conversation to proposal after a clear follow-up call.',
      'Following up same-day keeps momentum alive.', 'The urge to check every notification instead of focusing.',
      'Send the ABC Arts College proposal.', 1)`
  ).run(userId, daysAgoStr(1));

  // Weekly review
  db.prepare(
    `INSERT INTO weekly_reviews (user_id, week_start, data) VALUES (?, ?, ?)`
  ).run(
    userId,
    weekStartStr(new Date(Date.now() - 7 * 86400000)),
    JSON.stringify({
      revenue: 20000,
      profit: 4000,
      leads: 7,
      salesConversations: 5,
      conversions: 1,
      wins: ['Signed Bright Future College', 'Consistent morning routine'],
      misses: ['Missed one follow-up with Karthik'],
      lessons: ['Same-day follow-up converts better'],
      bottleneck: 'Not enough new conversations started per day',
      nextWeekGoal: 'Start 10 new conversations',
      topPriorities: ['Contact 10 colleges', 'Send 3 proposals', 'Close 1 corporate deal'],
      stop: 'Waiting until leads feel "ready" to follow up',
      start: 'Daily 15-minute outreach block',
      continue: 'Morning routine before checking phone',
    })
  );

  console.log('Seed complete.');
  console.log('Demo login -> email: demo@manifestcrm.app / password: Demo@1234');
}

seed();
