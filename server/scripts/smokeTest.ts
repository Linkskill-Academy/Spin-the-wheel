/**
 * Backend smoke test — real HTTP requests against a running server.
 *
 * Usage:
 *   npm run dev            (in one terminal, from server/)
 *   npm run test:smoke     (in another terminal, from server/)
 *
 * Exits 0 and prints "BACKEND SMOKE TEST PASSED" only if every test passes.
 * Exits 1 otherwise.
 */

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:4000';

let passed = 0;
let failed = 0;

function ok(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function req(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  return { status: res.status, json };
}

async function main() {
  const rand = Date.now();
  const userAEmail = `smoke-a-${rand}@test.local`;
  const userBEmail = `smoke-b-${rand}@test.local`;
  const password = 'SmokeTest@1234';

  // ---------- HEALTH ----------
  {
    const { status } = await req('/api/health');
    ok('GET /api/health -> 200', status === 200);
  }

  // ---------- SIGNUP / LOGIN (user A) ----------
  let tokenA = '';
  {
    const { status, json } = await req('/api/auth/signup', {
      method: 'POST',
      body: { email: userAEmail, password, name: 'Smoke Tester A', accountMode: 'founder' },
    });
    ok('POST /api/auth/signup (user A) -> 201 + token', status === 201 && !!json.token);
    tokenA = json.token;
  }

  {
    const { status, json } = await req('/api/auth/login', {
      method: 'POST',
      body: { email: 'demo@manifestcrm.app', password: 'Demo@1234' },
    });
    ok('POST /api/auth/login (seeded demo account) -> 200 + JWT', status === 200 && !!json.token);
  }

  {
    const { status, json } = await req('/api/auth/login', {
      method: 'POST',
      body: { email: userAEmail, password: 'wrong-password' },
    });
    ok('POST /api/auth/login with wrong password -> 401', status === 401);
    ok('Login error message present', typeof json.error === 'string' && json.error.length > 0);
  }

  {
    const { status, json } = await req('/api/auth/signup', {
      method: 'POST',
      body: { email: userAEmail, password: 'short' },
    });
    ok('POST /api/auth/signup missing name / short password -> 400', status === 400 && !!json.error);
  }

  // ---------- AUTHENTICATED USER ----------
  {
    const { status, json } = await req('/api/auth/me', { token: tokenA });
    ok('GET /api/auth/me -> 200 + matching email', status === 200 && json.user?.email === userAEmail);
  }

  {
    const { status } = await req('/api/auth/me');
    ok('GET /api/auth/me with no token -> 401', status === 401);
  }

  {
    const { status } = await req('/api/auth/me', { token: 'not-a-real-jwt' });
    ok('GET /api/auth/me with invalid JWT -> 401', status === 401);
  }

  // ---------- ONBOARDING ----------
  {
    const { status } = await req('/api/onboarding', {
      method: 'POST',
      token: tokenA,
      body: {
        vision12m: 'Smoke-tested vision',
        monthlyIncomeTarget: 100000,
        businessRevenueTarget: 500000,
        profitTarget: 100000,
        savingsTarget: 20000,
        assetTarget: 1000000,
        homeTarget: 5000000,
        impactTarget: 'Test impact',
        healthGoal: 'Test health goal',
        familyGoal: 'Test family goal',
      },
    });
    ok('POST /api/onboarding -> 200', status === 200);
  }

  // ---------- SETTINGS (PATCH /api/auth/me) ----------
  {
    const { status, json } = await req('/api/auth/me', {
      method: 'PATCH',
      token: tokenA,
      body: { currency: 'USD', dailyOutreachTarget: 15, morningReminderEnabled: false, nightReviewReminderEnabled: true },
    });
    ok(
      'PATCH /api/auth/me updates settings',
      status === 200 &&
        json.user?.currency === 'USD' &&
        json.user?.dailyOutreachTarget === 15 &&
        json.user?.morningReminderEnabled === false &&
        json.user?.nightReviewReminderEnabled === true
    );
  }
  {
    const { status, json } = await req('/api/auth/me', { method: 'PATCH', token: tokenA, body: { currency: 'JPY' } });
    ok('PATCH /api/auth/me rejects an unsupported currency -> 400', status === 400 && !!json.error);
  }
  // Restore INR for the rest of the run (keeps later assertions currency-agnostic where it matters).
  await req('/api/auth/me', { method: 'PATCH', token: tokenA, body: { currency: 'INR', dailyOutreachTarget: 10 } });

  // ---------- GOALS ----------
  let goalId: number | undefined;
  {
    const { status, json } = await req('/api/goals', {
      method: 'POST',
      token: tokenA,
      body: { category: 'Business', title: 'Smoke Test Goal', progressCurrent: 0, progressTarget: 10, unit: 'units' },
    });
    ok('POST /api/goals -> 201', status === 201 && !!json.goal?.id);
    goalId = json.goal?.id;
  }
  {
    const { status, json } = await req('/api/goals', { token: tokenA });
    ok('GET /api/goals -> 200 + array containing the new goal', status === 200 && json.goals.some((g: any) => g.id === goalId));
  }
  {
    const { status, json } = await req('/api/goals', { method: 'POST', token: tokenA, body: { title: '' } });
    ok('POST /api/goals missing category -> 400', status === 400 && !!json.error);
  }

  // ---------- MORNING ROUTINE ----------
  const today = new Date().toISOString().slice(0, 10);
  {
    const { status, json } = await req('/api/morning', {
      method: 'POST',
      token: tokenA,
      body: {
        date: today,
        gratitude1: 'Health',
        gratitude2: 'Family',
        gratitude3: 'This opportunity',
        futureSelf: 'She acts before she feels ready.',
        manifestationStatement: 'I am building a business that changes lives.',
        big3Revenue: 'Call 5 leads',
        big3Growth: 'Post one piece of content',
        big3Personal: 'Family dinner',
        moneyMove: 'Follow up with warm leads',
        courageAction: 'Send the proposal I have been avoiding',
        clarity: 8,
        energy: 7,
        confidence: 8,
        focus: 7,
        completed: true,
      },
    });
    const m = json.morning;
    ok(
      'POST /api/morning saves gratitude, big3, money move, courage action, scores',
      status === 200 &&
        m?.gratitude1 === 'Health' &&
        m?.big3Revenue === 'Call 5 leads' &&
        m?.moneyMove === 'Follow up with warm leads' &&
        m?.courageAction === 'Send the proposal I have been avoiding' &&
        m?.clarity === 8 &&
        m?.energy === 7 &&
        m?.confidence === 8 &&
        m?.focus === 7
    );
  }
  {
    const { status, json } = await req(`/api/morning/${today}`, { token: tokenA });
    ok('GET /api/morning/:date returns the saved entry', status === 200 && json.morning?.gratitude1 === 'Health');
  }

  // ---------- TASKS ----------
  let taskId: number | undefined;
  {
    const { status, json } = await req('/api/tasks', {
      method: 'POST',
      token: tokenA,
      body: { title: 'Smoke test task', size: 'big' },
    });
    ok('POST /api/tasks -> 201', status === 201 && !!json.task?.id);
    taskId = json.task?.id;
  }
  {
    const { status, json } = await req(`/api/tasks/${taskId}`, { method: 'PATCH', token: tokenA, body: { done: true } });
    ok('PATCH /api/tasks/:id marks done -> 200', status === 200 && json.task?.done === true);
  }
  {
    const { status, json } = await req('/api/tasks', { token: tokenA });
    ok('GET /api/tasks returns today\'s tasks', status === 200 && json.tasks.some((t: any) => t.id === taskId));
  }
  {
    // 1-3-5 limit: only 1 "big" task allowed per day
    const { status, json } = await req('/api/tasks', {
      method: 'POST',
      token: tokenA,
      body: { title: 'Second big task', size: 'big' },
    });
    ok('POST /api/tasks over the 1-3-5 limit -> 400 with friendly message', status === 400 && /focus/i.test(json.error || ''));
  }

  // ---------- LEADS (CRM) ----------
  let leadId: number | undefined;
  {
    const { status, json } = await req('/api/leads', {
      method: 'POST',
      token: tokenA,
      body: { name: 'Smoke Lead', opportunityType: 'Corporate', estimatedValue: 50000 },
    });
    ok('POST /api/leads -> 201', status === 201 && !!json.lead?.id);
    leadId = json.lead?.id;
  }
  {
    const { status, json } = await req(`/api/leads/${leadId}`, {
      method: 'PATCH',
      token: tokenA,
      body: { status: 'Follow-up', nextFollowup: today },
    });
    ok('PATCH /api/leads/:id moves stage + sets follow-up', status === 200 && json.lead?.status === 'Follow-up' && json.lead?.nextFollowup === today);
  }
  {
    const { status, json } = await req('/api/leads', { token: tokenA });
    ok('GET /api/leads returns the lead', status === 200 && json.leads.some((l: any) => l.id === leadId));
  }
  {
    const { status, json } = await req('/api/leads/stats', { token: tokenA });
    ok('GET /api/leads/stats returns pipeline stats', status === 200 && typeof json.stats?.totalPipelineValue === 'number');
  }

  // ---------- COLLEGE OUTREACH ----------
  let collegeId: number | undefined;
  {
    const { status, json } = await req('/api/colleges', {
      method: 'POST',
      token: tokenA,
      body: { collegeName: 'Smoke Test College' },
    });
    ok('POST /api/colleges -> 201', status === 201 && !!json.college?.id);
    collegeId = json.college?.id;
  }
  {
    const { status, json } = await req(`/api/colleges/${collegeId}`, {
      method: 'PATCH',
      token: tokenA,
      body: { status: 'Contacted', lastContacted: today },
    });
    ok('PATCH /api/colleges/:id -> Contacted', status === 200 && json.college?.status === 'Contacted');
  }
  {
    const { status, json } = await req(`/api/colleges/${collegeId}`, { method: 'PATCH', token: tokenA, body: { status: 'Interested' } });
    ok('PATCH /api/colleges/:id -> Interested', status === 200 && json.college?.status === 'Interested');
  }
  {
    const { status, json } = await req('/api/colleges/stats', { token: tokenA });
    ok(
      "GET /api/colleges/stats reflects today's contact count",
      status === 200 && typeof json.stats?.contactedToday === 'number' && json.stats.contactedToday >= 1
    );
  }

  // ---------- MONEY ----------
  {
    const { status } = await req('/api/money/entries', { method: 'POST', token: tokenA, body: { type: 'revenue', amount: 15000 } });
    ok('POST /api/money/entries (revenue) -> 201', status === 201);
  }
  {
    const { status } = await req('/api/money/entries', { method: 'POST', token: tokenA, body: { type: 'expense', amount: 4000 } });
    ok('POST /api/money/entries (expense) -> 201', status === 201);
  }
  {
    const { status, json } = await req('/api/money/summary', { token: tokenA });
    ok(
      'GET /api/money/summary totals revenue and expense correctly',
      status === 200 && json.current?.revenue === 15000 && json.current?.expense === 4000
    );
  }

  // ---------- HABITS ----------
  let habitId: number | undefined;
  {
    const { status, json } = await req('/api/habits', { method: 'POST', token: tokenA, body: { name: 'Smoke Test Habit' } });
    ok('POST /api/habits -> 201', status === 201 && !!json.habit?.id);
    habitId = json.habit?.id;
  }
  {
    const { status } = await req(`/api/habits/${habitId}/toggle`, { method: 'POST', token: tokenA, body: { date: today, done: true } });
    ok('POST /api/habits/:id/toggle -> 200', status === 200);
  }
  {
    const { status, json } = await req('/api/habits', { token: tokenA });
    ok(
      'GET /api/habits returns habit + today\'s completion log',
      status === 200 && json.habits.some((h: any) => h.id === habitId) && json.logs.some((l: any) => l.habitId === habitId && l.done)
    );
  }

  // ---------- EVIDENCE ----------
  {
    const { status } = await req('/api/evidence', {
      method: 'POST',
      token: tokenA,
      body: { category: 'Business', description: 'Smoke-tested evidence entry' },
    });
    ok('POST /api/evidence -> 201', status === 201);
  }
  {
    const { status, json } = await req('/api/evidence', { token: tokenA });
    ok('GET /api/evidence returns the timeline', status === 200 && json.evidence.some((e: any) => e.description === 'Smoke-tested evidence entry'));
  }

  // ---------- NIGHT REVIEW ----------
  {
    const { status, json } = await req('/api/night', {
      method: 'POST',
      token: tokenA,
      body: { date: today, businessWin: 'Closed a smoke-test deal', moneyEarned: true, completed: true },
    });
    ok('POST /api/night saves the review', status === 200 && json.night?.businessWin === 'Closed a smoke-test deal' && json.night?.moneyEarned === true);
  }
  {
    const { status, json } = await req(`/api/night/${today}`, { token: tokenA });
    ok('GET /api/night/:date returns the saved review', status === 200 && json.night?.businessWin === 'Closed a smoke-test deal');
  }

  // ---------- WEEKLY / MONTHLY REVIEWS ----------
  {
    const { status, json } = await req('/api/reviews/weekly', { token: tokenA });
    ok('GET /api/reviews/weekly returns a valid (possibly empty) list', status === 200 && Array.isArray(json.reviews));
  }
  {
    const { status, json } = await req('/api/reviews/monthly', { token: tokenA });
    ok('GET /api/reviews/monthly returns a valid (possibly empty) list', status === 200 && Array.isArray(json.reviews));
  }
  {
    const { status, json } = await req('/api/reviews/monthly-trend', { token: tokenA });
    ok('GET /api/reviews/monthly-trend returns a valid structure', status === 200 && Array.isArray(json.trend));
  }

  // ---------- SECURITY: cross-user isolation ----------
  let tokenB = '';
  {
    const { json } = await req('/api/auth/signup', {
      method: 'POST',
      body: { email: userBEmail, password, name: 'Smoke Tester B', accountMode: 'founder' },
    });
    tokenB = json.token;
  }
  {
    const { status } = await req(`/api/goals/${goalId}`, { method: 'PATCH', token: tokenB, body: { title: 'Hijacked!' } });
    ok("User B cannot PATCH user A's goal (-> 404)", status === 404);
  }
  {
    const { status } = await req(`/api/leads/${leadId}`, { method: 'PATCH', token: tokenB, body: { status: 'Won' } });
    ok("User B cannot PATCH user A's lead (-> 404)", status === 404);
  }
  {
    const { json } = await req('/api/goals', { token: tokenB });
    ok("User B's goal list does not contain user A's goal", !json.goals.some((g: any) => g.id === goalId));
  }
  {
    const { status } = await req(`/api/tasks/${taskId}`, { method: 'PATCH', token: tokenB, body: { done: false } });
    ok("User B cannot PATCH user A's task (-> 404)", status === 404);
  }

  // ---------- SECURITY: malformed input doesn't crash the server ----------
  {
    const { status } = await req('/api/goals/not-a-number', { method: 'PATCH', token: tokenA, body: { title: 'x' } });
    ok('PATCH /api/goals/:id with a non-numeric id -> 404 (no crash)', status === 404);
  }
  {
    const { status } = await req('/api/leads/99999999', { method: 'PATCH', token: tokenA, body: { status: 'Won' } });
    ok('PATCH /api/leads/:id with a non-existent id -> 404 (no crash)', status === 404);
  }
  {
    const { status } = await req('/api/health');
    ok('Server still responds to /api/health after malformed requests', status === 200);
  }

  // ---------- DATA EXPORT ----------
  {
    const { status, json } = await req('/api/export/json', { token: tokenA });
    ok(
      'GET /api/export/json returns a full data dump for the signed-in user only',
      status === 200 && Array.isArray(json.goals) && json.goals.some((g: any) => g.id === goalId) && json.user?.email === userAEmail
    );
  }
  {
    const res = await fetch(`${BASE}/api/export/csv/leads`, { headers: { Authorization: `Bearer ${tokenA}` } });
    const text = await res.text();
    ok(
      'GET /api/export/csv/leads returns CSV with a header row and the smoke-test lead',
      res.status === 200 && text.startsWith('id,') && text.includes('Smoke Lead')
    );
  }
  {
    const { status } = await req('/api/export/csv/not-a-real-resource', { token: tokenA });
    ok('GET /api/export/csv/:resource with an unknown resource -> 400 (no crash)', status === 400);
  }
  {
    const { status } = await req('/api/export/json');
    ok('GET /api/export/json with no token -> 401', status === 401);
  }

  // ---------- SUMMARY ----------
  console.log('');
  console.log(`${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('BACKEND SMOKE TEST PASSED');
    process.exit(0);
  } else {
    console.log('BACKEND SMOKE TEST FAILED');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
