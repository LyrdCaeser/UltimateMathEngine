import { Router } from 'express';
import { query } from '../db';
import { sendError } from './helpers';

export const sessionsRouter = Router();

sessionsRouter.get('/:userId', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, user_id, title, current_module, draft_state, created_at, updated_at
       FROM ume_sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.params.userId]
    );
    res.json({ sessions: result.rows });
  } catch (error) {
    sendError(res, error);
  }
});

sessionsRouter.get('/:userId/:sessionId', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, user_id, title, current_module, draft_state, created_at, updated_at
       FROM ume_sessions
       WHERE user_id = $1 AND id = $2`,
      [req.params.userId, req.params.sessionId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Session not found' });
    return res.json({ session: result.rows[0] });
  } catch (error) {
    sendError(res, error);
  }
});

sessionsRouter.post('/:userId', async (req, res) => {
  try {
    const title = typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim() : 'Untitled Session';
    const result = await query(
      `INSERT INTO ume_sessions(user_id, title)
       VALUES($1, $2)
       RETURNING id, user_id, title, current_module, draft_state, created_at, updated_at`,
      [req.params.userId, title]
    );
    res.json({ session: result.rows[0] });
  } catch (error) {
    sendError(res, error);
  }
});

sessionsRouter.patch('/:userId/:sessionId/autosave', async (req, res) => {
  try {
    const currentModule = typeof req.body?.currentModule === 'string' ? req.body.currentModule : 'basic';
    const draftState = req.body?.draftState && typeof req.body.draftState === 'object' ? req.body.draftState : {};

    const result = await query(
      `UPDATE ume_sessions
       SET current_module = $3,
           draft_state = $4::jsonb
       WHERE user_id = $1 AND id = $2
       RETURNING id, user_id, title, current_module, draft_state, created_at, updated_at`,
      [req.params.userId, req.params.sessionId, currentModule, JSON.stringify(draftState)]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Session not found' });
    return res.json({ session: result.rows[0] });
  } catch (error) {
    sendError(res, error);
  }
});
