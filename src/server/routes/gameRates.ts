import { Router } from 'express';
import { query } from '../db';
import { convertByRateTable, GameRate } from '../calc/gameConverter';
import { sendError, saveHistory } from './helpers';

export const gameRatesRouter = Router();

type OfficialGameSource = {
  gameCode: string;
  currencyCode: string;
  sourceName: string;
  officialUrl: string;
};

const OFFICIAL_GAME_SOURCES: Record<string, OfficialGameSource> = {
  FREE_FIRE: {
    gameCode: 'FREE_FIRE',
    currencyCode: 'KC',
    sourceName: 'Garena nạp thẻ chính thức',
    officialUrl: 'https://napthe.vn/app'
  },
  LIEN_QUAN: {
    gameCode: 'LIEN_QUAN',
    currencyCode: 'QH',
    sourceName: 'Garena nạp thẻ chính thức',
    officialUrl: 'https://napthe.vn/app'
  },
  HSR: {
    gameCode: 'HSR',
    currencyCode: 'NAS',
    sourceName: 'HoYoverse Top-Up Center',
    officialUrl: 'https://sdk.hoyoverse.com/payment/hsr/index.html'
  },
  GENSHIN: {
    gameCode: 'GENSHIN',
    currencyCode: 'NT',
    sourceName: 'HoYoverse Top-Up Center',
    officialUrl: 'https://sdk.hoyoverse.com/payment/genshin/index.html'
  }
};

function normalizeCode(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${fieldName} is required`);
  return value.trim().toUpperCase();
}

function requireAdminKey(input: unknown): void {
  const configuredKey = process.env.UME_ADMIN_KEY;
  if (!configuredKey || !configuredKey.trim()) {
    const error = new Error('UME_ADMIN_KEY is not configured on the server.');
    (error as Error & { status?: number }).status = 503;
    throw error;
  }

  if (typeof input !== 'string' || input !== configuredKey.trim()) {
    const error = new Error('Sai key quản trị. Không có quyền cập nhật tỷ giá chính thức.');
    (error as Error & { status?: number }).status = 401;
    throw error;
  }
}

function sendRouteError(res: import('express').Response, error: unknown): void {
  const status = (error as Error & { status?: number })?.status;
  if (status) {
    res.status(status).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    return;
  }
  sendError(res, error);
}

function cleanPositiveNumber(value: unknown, fieldName: string): string {
  const raw = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  const n = Number(raw);
  if (!raw || !Number.isFinite(n) || n <= 0) throw new Error(`${fieldName} must be a positive number`);
  return raw;
}

function cleanNonNegativeNumber(value: unknown, fieldName: string): string {
  const raw = value === undefined || value === null || value === '' ? '0' : String(value).trim();
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${fieldName} must be a non-negative number`);
  return raw;
}

gameRatesRouter.get('/game-rates', async (_req, res) => {
  try {
    const result = await query<GameRate & { is_active: boolean }>(
      `SELECT id, game_code, currency_code, source_name, amount_vnd::text, currency_amount::text,
              bonus_amount::text, is_active, note, source_updated_at, created_at, updated_at
       FROM game_rate_tables
       ORDER BY game_code, currency_code, amount_vnd ASC`
    );
    res.json({ rates: result.rows });
  } catch (error) {
    sendRouteError(res, error);
  }
});

gameRatesRouter.post('/game-rates', async (req, res) => {
  try {
    requireAdminKey(req.body.adminKey);

    const gameCode = normalizeCode(req.body.gameCode, 'gameCode');
    const currencyCode = normalizeCode(req.body.currencyCode, 'currencyCode');
    const officialSource = OFFICIAL_GAME_SOURCES[gameCode];

    if (!officialSource) {
      return res.status(400).json({ error: 'Game chưa được hỗ trợ trong bảng nguồn chính thức.' });
    }

    if (currencyCode !== officialSource.currencyCode) {
      return res.status(400).json({ error: `Currency không hợp lệ cho ${gameCode}. Phải là ${officialSource.currencyCode}.` });
    }

    const amountVnd = cleanPositiveNumber(req.body.amountVnd, 'amountVnd');
    const currencyAmount = cleanPositiveNumber(req.body.currencyAmount, 'currencyAmount');
    const bonusAmount = cleanNonNegativeNumber(req.body.bonusAmount, 'bonusAmount');
    const note = `Official source: ${officialSource.officialUrl}`;

    const result = await query(
      `INSERT INTO game_rate_tables
       (game_code, currency_code, source_name, amount_vnd, currency_amount, bonus_amount, is_active, note, source_updated_at)
       VALUES($1, $2, $3, $4, $5, $6, true, $7, now())
       RETURNING id, game_code, currency_code, source_name, amount_vnd::text, currency_amount::text,
                 bonus_amount::text, is_active, note, source_updated_at, created_at, updated_at`,
      [
        officialSource.gameCode,
        officialSource.currencyCode,
        officialSource.sourceName,
        amountVnd,
        currencyAmount,
        bonusAmount,
        note
      ]
    );

    res.json({ rate: result.rows[0] });
  } catch (error) {
    sendRouteError(res, error);
  }
});

gameRatesRouter.patch('/game-rates/:id', async (req, res) => {
  try {
    requireAdminKey(req.body.adminKey);

    const bonusAmount = req.body.bonusAmount === undefined ? null : cleanNonNegativeNumber(req.body.bonusAmount, 'bonusAmount');
    const currencyAmount = req.body.currencyAmount === undefined ? null : cleanPositiveNumber(req.body.currencyAmount, 'currencyAmount');
    const amountVnd = req.body.amountVnd === undefined ? null : cleanPositiveNumber(req.body.amountVnd, 'amountVnd');

    const result = await query(
      `UPDATE game_rate_tables
       SET amount_vnd = COALESCE($2, amount_vnd),
           currency_amount = COALESCE($3, currency_amount),
           bonus_amount = COALESCE($4, bonus_amount),
           is_active = COALESCE($5, is_active),
           source_updated_at = now(),
           updated_at = now()
       WHERE id = $1
       RETURNING id, game_code, currency_code, source_name, amount_vnd::text, currency_amount::text,
                 bonus_amount::text, is_active, note, source_updated_at, created_at, updated_at`,
      [
        req.params.id,
        amountVnd,
        currencyAmount,
        bonusAmount,
        typeof req.body.isActive === 'boolean' ? req.body.isActive : null
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rate not found' });
    return res.json({ rate: result.rows[0] });
  } catch (error) {
    sendRouteError(res, error);
  }
});

gameRatesRouter.post('/convert/game', async (req, res) => {
  try {
    if (typeof req.body.userId !== 'string' || !req.body.userId.trim()) throw new Error('userId is required');
    const gameCode = normalizeCode(req.body.gameCode, 'gameCode');
    const currencyCode = normalizeCode(req.body.currencyCode, 'currencyCode');

    const officialSource = OFFICIAL_GAME_SOURCES[gameCode];
    if (!officialSource || officialSource.currencyCode !== currencyCode) {
      return res.status(400).json({ error: 'Game/currency không hợp lệ.' });
    }

    const rateResult = await query<GameRate>(
      `SELECT id, game_code, currency_code, source_name, amount_vnd::text, currency_amount::text,
              bonus_amount::text, note, source_updated_at
       FROM game_rate_tables
       WHERE is_active = true AND game_code = $1 AND currency_code = $2
       ORDER BY amount_vnd ASC`,
      [gameCode, currencyCode]
    );

    if (rateResult.rowCount === 0) {
      return res.status(400).json({
        error: 'Chưa có tỷ giá chính thức đã xác minh cho game này. Quản trị viên cần cập nhật từ nguồn chính thức trước.'
      });
    }

    const conversion = convertByRateTable({
      gameCode,
      currencyCode,
      amountVnd: req.body.amountVnd,
      rates: rateResult.rows
    });

    await saveHistory({
      query,
      userId: req.body.userId,
      sessionId: typeof req.body.sessionId === 'string' ? req.body.sessionId : null,
      module: 'game',
      expression: `${req.body.amountVnd} VND -> ${gameCode}/${currencyCode}`,
      result: conversion.resultAmount,
      precisionNote: `${conversion.precisionNote} Source: ${officialSource.sourceName}.`,
      inputPayload: { ...req.body, method: conversion.method, usedRates: conversion.usedRates }
    });

    res.json({
      ...conversion,
      precisionNote: `${conversion.precisionNote} Nguồn: ${officialSource.sourceName}.`
    });
  } catch (error) {
    sendRouteError(res, error);
  }
});
