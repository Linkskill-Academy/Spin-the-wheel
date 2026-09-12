import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { todayStr } from '../utils/date';

export const morningRouter = Router();
morningRouter.use(requireAuth);

function toDto(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    gratitude1: row.gratitude1,
    gratitude2: row.gratitude2,
    gratitude3: row.gratitude3,
    futureSelf: row.future_self,
    manifestationStatement: row.manifestation_statement,
    repeat3Done: !!row.repeat_3_done,
    repeat6Done: !!row.repeat_6_done,
    repeat9Done: !!row.repeat_9_done,
    visualizationSee: row.visualization_see,
    visualizationHear: row.visualization_hear,
    visualizationFeel: row.visualization_feel,
    visualizationWho: row.visualization_who,
    visualizationResult: row.visualization_result,
    big3Revenue: row.big3_revenue,
    big3Growth: row.big3_growth,
    big3Personal: row.big3_personal,
    moneyMove: row.money_move,
    courageAction: row.courage_action,
    clarity: row.clarity,
    energy: row.energy,
    confidence: row.confidence,
    focus: row.focus,
    completed: !!row.completed,
  };
}

morningRouter.get('/:date', (req: AuthedRequest, res) => {
  const row = db
    .prepare('SELECT * FROM morning_routines WHERE user_id = ? AND date = ?')
    .get(req.userId, req.params.date);
  res.json({ morning: toDto(row) });
});

const schema = z.object({
  date: z.string().default(() => todayStr()),
  gratitude1: z.string().default(''),
  gratitude2: z.string().default(''),
  gratitude3: z.string().default(''),
  futureSelf: z.string().default(''),
  manifestationStatement: z.string().default(''),
  repeat3Done: z.boolean().default(false),
  repeat6Done: z.boolean().default(false),
  repeat9Done: z.boolean().default(false),
  visualizationSee: z.string().default(''),
  visualizationHear: z.string().default(''),
  visualizationFeel: z.string().default(''),
  visualizationWho: z.string().default(''),
  visualizationResult: z.string().default(''),
  big3Revenue: z.string().default(''),
  big3Growth: z.string().default(''),
  big3Personal: z.string().default(''),
  moneyMove: z.string().default(''),
  courageAction: z.string().default(''),
  clarity: z.number().min(0).max(10).default(0),
  energy: z.number().min(0).max(10).default(0),
  confidence: z.number().min(0).max(10).default(0),
  focus: z.number().min(0).max(10).default(0),
  completed: z.boolean().default(false),
});

morningRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const d = parsed.data;

  db.prepare(
    `INSERT INTO morning_routines (
      user_id, date, gratitude1, gratitude2, gratitude3, future_self, manifestation_statement,
      repeat_3_done, repeat_6_done, repeat_9_done, visualization_see, visualization_hear,
      visualization_feel, visualization_who, visualization_result, big3_revenue, big3_growth,
      big3_personal, money_move, courage_action, clarity, energy, confidence, focus, completed
    ) VALUES (
      @userId, @date, @gratitude1, @gratitude2, @gratitude3, @futureSelf, @manifestationStatement,
      @repeat3Done, @repeat6Done, @repeat9Done, @visualizationSee, @visualizationHear,
      @visualizationFeel, @visualizationWho, @visualizationResult, @big3Revenue, @big3Growth,
      @big3Personal, @moneyMove, @courageAction, @clarity, @energy, @confidence, @focus, @completed
    )
    ON CONFLICT(user_id, date) DO UPDATE SET
      gratitude1=excluded.gratitude1, gratitude2=excluded.gratitude2, gratitude3=excluded.gratitude3,
      future_self=excluded.future_self, manifestation_statement=excluded.manifestation_statement,
      repeat_3_done=excluded.repeat_3_done, repeat_6_done=excluded.repeat_6_done, repeat_9_done=excluded.repeat_9_done,
      visualization_see=excluded.visualization_see, visualization_hear=excluded.visualization_hear,
      visualization_feel=excluded.visualization_feel, visualization_who=excluded.visualization_who,
      visualization_result=excluded.visualization_result, big3_revenue=excluded.big3_revenue,
      big3_growth=excluded.big3_growth, big3_personal=excluded.big3_personal, money_move=excluded.money_move,
      courage_action=excluded.courage_action, clarity=excluded.clarity, energy=excluded.energy,
      confidence=excluded.confidence, focus=excluded.focus, completed=excluded.completed`
  ).run({
    userId: req.userId,
    ...d,
    repeat3Done: d.repeat3Done ? 1 : 0,
    repeat6Done: d.repeat6Done ? 1 : 0,
    repeat9Done: d.repeat9Done ? 1 : 0,
    completed: d.completed ? 1 : 0,
  });

  const row = db
    .prepare('SELECT * FROM morning_routines WHERE user_id = ? AND date = ?')
    .get(req.userId, d.date);
  res.json({ morning: toDto(row) });
});
