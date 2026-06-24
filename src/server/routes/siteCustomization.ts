import { Router } from 'express';
import { query } from '../db';
import { sendError } from './helpers';

export const siteCustomizationRouter = Router();

function adminKey(): string | null {
  const key = process.env.UME_ADMIN_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : null;
}

function requireAdminKey(input: unknown): void {
  const configuredKey = adminKey();
  if (!configuredKey) {
    const error = new Error('UME_ADMIN_KEY is not configured on the server.');
    (error as Error & { status?: number }).status = 503;
    throw error;
  }

  if (typeof input !== 'string' || input !== configuredKey) {
    const error = new Error('Sai key admin. Không có quyền chỉnh giao diện/nhạc.');
    (error as Error & { status?: number }).status = 401;
    throw error;
  }
}

function cleanText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function cleanVolume(value: unknown, fallback = 0.45): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function sendRouteError(res: import('express').Response, error: unknown): void {
  const status = (error as Error & { status?: number })?.status;

  if (status) {
    res.status(status).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }

  sendError(res, error);
}

siteCustomizationRouter.get('/site-settings', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, background_url, music_url, music_title, music_enabled, volume::text, updated_at
       FROM site_settings
       WHERE id = 'global'`
    );

    if (result.rowCount === 0) {
      const created = await query(
        `INSERT INTO site_settings(id)
         VALUES('global')
         ON CONFLICT(id) DO NOTHING
         RETURNING id, background_url, music_url, music_title, music_enabled, volume::text, updated_at`
      );

      return res.json({ settings: created.rows[0] });
    }

    return res.json({ settings: result.rows[0] });
  } catch (error) {
    sendRouteError(res, error);
  }
});

siteCustomizationRouter.patch('/site-settings/admin', async (req, res) => {
  try {
    requireAdminKey(req.body.adminKey);

    const current = await query(
      `SELECT background_url, music_url, music_title, music_enabled, volume::text
       FROM site_settings
       WHERE id = 'global'`
    );

    const row = current.rows[0] ?? {};

    const backgroundUrl = cleanText(req.body.backgroundUrl, row.background_url ?? '/wolf-bg.jpg') || '/wolf-bg.jpg';
    const musicUrl = cleanText(req.body.musicUrl, row.music_url ?? '');
    const musicTitle = cleanText(req.body.musicTitle, row.music_title ?? '');
    const musicEnabled = typeof req.body.musicEnabled === 'boolean'
      ? req.body.musicEnabled
      : Boolean(row.music_enabled);
    const volume = cleanVolume(req.body.volume, Number(row.volume ?? 0.45));

    const result = await query(
      `INSERT INTO site_settings(id, background_url, music_url, music_title, music_enabled, volume)
       VALUES('global', $1, $2, $3, $4, $5)
       ON CONFLICT(id)
       DO UPDATE SET background_url = EXCLUDED.background_url,
                     music_url = EXCLUDED.music_url,
                     music_title = EXCLUDED.music_title,
                     music_enabled = EXCLUDED.music_enabled,
                     volume = EXCLUDED.volume,
                     updated_at = now()
       RETURNING id, background_url, music_url, music_title, music_enabled, volume::text, updated_at`,
      [backgroundUrl, musicUrl, musicTitle, musicEnabled, volume]
    );

    res.json({ settings: result.rows[0] });
  } catch (error) {
    sendRouteError(res, error);
  }
});

siteCustomizationRouter.post('/music-requests', async (req, res) => {
  try {
    const requesterName = cleanText(req.body.requesterName, 'Người dùng') || 'Người dùng';
    const songTitle = cleanText(req.body.songTitle);
    const musicUrl = cleanText(req.body.musicUrl);
    const note = cleanText(req.body.note);

    if (!songTitle) return res.status(400).json({ error: 'Thiếu tên bài nhạc.' });
    if (!musicUrl) return res.status(400).json({ error: 'Thiếu link nhạc.' });

    const result = await query(
      `INSERT INTO music_change_requests(requester_name, song_title, music_url, note)
       VALUES($1, $2, $3, $4)
       RETURNING id, requester_name, song_title, music_url, note, status, created_at, reviewed_at`,
      [requesterName, songTitle, musicUrl, note]
    );

    res.status(201).json({ request: result.rows[0] });
  } catch (error) {
    sendRouteError(res, error);
  }
});

siteCustomizationRouter.get('/music-requests/admin', async (req, res) => {
  try {
    requireAdminKey(req.query.adminKey);

    const status = cleanText(req.query.status, 'all');
    const params: string[] = [];
    let where = '';

    if (status !== 'all') {
      params.push(status);
      where = 'WHERE status = $1';
    }

    const result = await query(
      `SELECT id, requester_name, song_title, music_url, note, status, created_at, reviewed_at
       FROM music_change_requests
       ${where}
       ORDER BY created_at DESC
       LIMIT 80`,
      params
    );

    res.json({ requests: result.rows });
  } catch (error) {
    sendRouteError(res, error);
  }
});

siteCustomizationRouter.patch('/music-requests/:id/admin', async (req, res) => {
  try {
    requireAdminKey(req.body.adminKey);

    const action = cleanText(req.body.action);
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action không hợp lệ.' });
    }

    const result = await query(
      `UPDATE music_change_requests
       SET status = $2,
           reviewed_at = now()
       WHERE id = $1
       RETURNING id, requester_name, song_title, music_url, note, status, created_at, reviewed_at`,
      [req.params.id, action]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu.' });
    }

    if (action === 'approved' && req.body.applyToSite === true) {
      const request = result.rows[0];

      await query(
        `INSERT INTO site_settings(id, music_url, music_title, music_enabled)
         VALUES('global', $1, $2, true)
         ON CONFLICT(id)
         DO UPDATE SET music_url = EXCLUDED.music_url,
                       music_title = EXCLUDED.music_title,
                       music_enabled = true,
                       updated_at = now()`,
        [request.music_url, request.song_title]
      );
    }

    res.json({ request: result.rows[0] });
  } catch (error) {
    sendRouteError(res, error);
  }
});
