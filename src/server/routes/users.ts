import { Router } from 'express';
import { query } from '../db';
import { sendError } from './helpers';

export const usersRouter = Router();

usersRouter.post('/guest', async (req, res) => {
  try {
    const displayName = typeof req.body?.displayName === 'string' && req.body.displayName.trim()
      ? req.body.displayName.trim()
      : 'Guest User';

    const userResult = await query<{ id: string; display_name: string }>(
      'INSERT INTO users(display_name) VALUES($1) RETURNING id, display_name',
      [displayName]
    );
    const user = userResult.rows[0];

    await query('INSERT INTO user_settings(user_id) VALUES($1)', [user.id]);

    const sessionResult = await query<{ id: string; title: string; current_module: string; draft_state: unknown }>(
      `INSERT INTO ume_sessions(user_id, title, current_module, draft_state)
       VALUES($1, 'Main Session', 'basic', '{}'::jsonb)
       RETURNING id, title, current_module, draft_state`,
      [user.id]
    );

    res.json({ userId: user.id, displayName: user.display_name, sessionId: sessionResult.rows[0].id, session: sessionResult.rows[0] });
  } catch (error) {
    sendError(res, error);
  }
});
