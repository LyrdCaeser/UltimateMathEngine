import { Router } from 'express';
import { query } from '../db';
import { sendError } from './helpers';

export const settingsRouter = Router();

settingsRouter.get('/:userId', async (req, res) => {
  try {
    const result = await query(
      `SELECT user_id, theme, accuracy_target::text, settings, updated_at
       FROM user_settings
       WHERE user_id = $1`,
      [req.params.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Settings not found' });
    return res.json({ settings: result.rows[0] });
  } catch (error) {
    sendError(res, error);
  }
});

settingsRouter.patch('/:userId', async (req, res) => {
  try {
    const theme = typeof req.body.theme === 'string' ? req.body.theme : 'dark-neon';
    const settings = req.body.settings && typeof req.body.settings === 'object' ? req.body.settings : {};
    const result = await query(
      `INSERT INTO user_settings(user_id, theme, settings)
       VALUES($1, $2, $3::jsonb)
       ON CONFLICT(user_id)
       DO UPDATE SET theme = EXCLUDED.theme,
                     settings = user_settings.settings || EXCLUDED.settings,
                     updated_at = now()
       RETURNING user_id, theme, accuracy_target::text, settings, updated_at`,
      [req.params.userId, theme, JSON.stringify(settings)]
    );
    res.json({ settings: result.rows[0] });
  } catch (error) {
    sendError(res, error);
  }
});
