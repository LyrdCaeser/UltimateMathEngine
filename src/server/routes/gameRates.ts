import { Router } from 'express';
import { query } from '../db';
import { convertByRateTable, GameRate } from '../calc/gameConverter';
import { sendError, saveHistory } from './helpers';

export const gameRatesRouter = Router();

function normalizeCode(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${fieldName} is required`);
  return value.trim().toUpperCase();
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
    sendError(res, error);
  }
});

gameRatesRouter.post('/game-rates', async (req, res) => {
  try {
    const gameCode = normalizeCode(req.body.gameCode, 'gameCode');
    const currencyCode = normalizeCode(req.body.currencyCode, 'currencyCode');
    const sourceName = typeof req.body.sourceName === 'string' && req.body.sourceName.trim()
      ? req.body.sourceName.trim()
      : 'Manual verified rate';
    const result = await query(
      `INSERT INTO game_rate_tables
       (game_code, currency_code, source_name, amount_vnd, currency_amount, bonus_amount, is_active, note, source_updated_at)
       VALUES($1, $2, $3, $4, $5, $6, true, $7, now())
       RETURNING id, game_code, currency_code, source_name, amount_vnd::text, currency_amount::text,
                 bonus_amount::text, is_active, note, source_updated_at, created_at, updated_at`,
      [
        gameCode,
        currencyCode,
        sourceName,
        req.body.amountVnd,
        req.body.currencyAmount,
        req.body.bonusAmount ?? 0,
        typeof req.body.note === 'string' ? req.body.note : null
      ]
    );
    res.json({ rate: result.rows[0] });
  } catch (error) {
    sendError(res, error);
  }
});

gameRatesRouter.patch('/game-rates/:id', async (req, res) => {
  try {
    const result = await query(
      `UPDATE game_rate_tables
       SET game_code = COALESCE($2, game_code),
           currency_code = COALESCE($3, currency_code),
           source_name = COALESCE($4, source_name),
           amount_vnd = COALESCE($5, amount_vnd),
           currency_amount = COALESCE($6, currency_amount),
           bonus_amount = COALESCE($7, bonus_amount),
           is_active = COALESCE($8, is_active),
           note = COALESCE($9, note),
           source_updated_at = now()
       WHERE id = $1
       RETURNING id, game_code, currency_code, source_name, amount_vnd::text, currency_amount::text,
                 bonus_amount::text, is_active, note, source_updated_at, created_at, updated_at`,
      [
        req.params.id,
        req.body.gameCode ? normalizeCode(req.body.gameCode, 'gameCode') : null,
        req.body.currencyCode ? normalizeCode(req.body.currencyCode, 'currencyCode') : null,
        typeof req.body.sourceName === 'string' ? req.body.sourceName : null,
        req.body.amountVnd ?? null,
        req.body.currencyAmount ?? null,
        req.body.bonusAmount ?? null,
        typeof req.body.isActive === 'boolean' ? req.body.isActive : null,
        typeof req.body.note === 'string' ? req.body.note : null
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rate not found' });
    return res.json({ rate: result.rows[0] });
  } catch (error) {
    sendError(res, error);
  }
});

gameRatesRouter.post('/convert/game', async (req, res) => {
  try {
    if (typeof req.body.userId !== 'string' || !req.body.userId.trim()) throw new Error('userId is required');
    const gameCode = normalizeCode(req.body.gameCode, 'gameCode');
    const currencyCode = normalizeCode(req.body.currencyCode, 'currencyCode');

    const rateResult = await query<GameRate>(
      `SELECT id, game_code, currency_code, source_name, amount_vnd::text, currency_amount::text,
              bonus_amount::text, note, source_updated_at
       FROM game_rate_tables
       WHERE is_active = true AND game_code = $1 AND currency_code = $2
       ORDER BY amount_vnd ASC`,
      [gameCode, currencyCode]
    );

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
      precisionNote: conversion.precisionNote,
      inputPayload: { ...req.body, method: conversion.method, usedRates: conversion.usedRates }
    });

    res.json(conversion);
  } catch (error) {
    sendError(res, error);
  }
});
