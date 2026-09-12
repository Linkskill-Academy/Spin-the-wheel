import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { runMigrations } from './db/migrate';
import { authRouter } from './routes/auth';
import { onboardingRouter } from './routes/onboarding';
import { goalsRouter } from './routes/goals';
import { morningRouter } from './routes/morning';
import { nightRouter } from './routes/night';
import { checkinsRouter } from './routes/checkins';
import { leadsRouter } from './routes/leads';
import { collegeRouter } from './routes/college';
import { moneyRouter } from './routes/money';
import { habitsRouter } from './routes/habits';
import { evidenceRouter } from './routes/evidence';
import { tasksRouter } from './routes/tasks';
import { reviewsRouter } from './routes/reviews';
import { dashboardRouter } from './routes/dashboard';

runMigrations();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/morning', morningRouter);
app.use('/api/night', nightRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/colleges', collegeRouter);
app.use('/api/money', moneyRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Manifestation & Execution CRM API running on http://localhost:${PORT}`);
});
