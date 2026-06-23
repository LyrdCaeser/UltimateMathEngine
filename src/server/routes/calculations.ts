import { Router } from 'express';
import { query } from '../db';
import { calculateBasic, BasicOperation } from '../calc/basic';
import { calculateScientific, ScientificOperation, AngleMode } from '../calc/scientific';
import { solve, SolverKind } from '../calc/solver';
import { calculateFinance, FinanceKind } from '../calc/finance';
import { convertUnit, unitOptions } from '../calc/unitConverter';
import { sendError, saveHistory } from './helpers';

export const calculationsRouter = Router();

function requireUserId(body: Record<string, unknown>): string {
  if (typeof body.userId !== 'string' || !body.userId.trim()) throw new Error('userId is required');
  return body.userId;
}

function sessionId(body: Record<string, unknown>): string | null {
  return typeof body.sessionId === 'string' && body.sessionId.trim() ? body.sessionId : null;
}

calculationsRouter.post('/calculate/basic', async (req, res) => {
  try {
    const userId = requireUserId(req.body);
    const result = calculateBasic(req.body.operation as BasicOperation, Array.isArray(req.body.values) ? req.body.values : []);
    await saveHistory({
      query,
      userId,
      sessionId: sessionId(req.body),
      module: 'basic',
      expression: typeof req.body.expression === 'string' ? req.body.expression : String(req.body.operation),
      result: result.result,
      precisionNote: result.precisionNote,
      inputPayload: req.body
    });
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

calculationsRouter.post('/calculate/scientific', async (req, res) => {
  try {
    const userId = requireUserId(req.body);
    const result = calculateScientific(
      req.body.operation as ScientificOperation,
      req.body.value,
      (req.body.angleMode === 'rad' ? 'rad' : 'deg') as AngleMode
    );
    await saveHistory({
      query,
      userId,
      sessionId: sessionId(req.body),
      module: 'scientific',
      expression: typeof req.body.expression === 'string' ? req.body.expression : String(req.body.operation),
      result: result.result,
      precisionNote: result.precisionNote,
      inputPayload: req.body
    });
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

calculationsRouter.post('/calculate/solver', async (req, res) => {
  try {
    const userId = requireUserId(req.body);
    const result = solve(req.body.kind as SolverKind, Array.isArray(req.body.values) ? req.body.values : []);
    await saveHistory({
      query,
      userId,
      sessionId: sessionId(req.body),
      module: 'solver',
      expression: typeof req.body.expression === 'string' ? req.body.expression : String(req.body.kind),
      result: result.result,
      precisionNote: result.precisionNote,
      inputPayload: req.body
    });
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

calculationsRouter.post('/calculate/finance', async (req, res) => {
  try {
    const userId = requireUserId(req.body);
    const result = calculateFinance(req.body.kind as FinanceKind, req.body.payload ?? {});
    await saveHistory({
      query,
      userId,
      sessionId: sessionId(req.body),
      module: 'finance',
      expression: typeof req.body.expression === 'string' ? req.body.expression : String(req.body.kind),
      result: result.result,
      precisionNote: result.precisionNote,
      inputPayload: req.body
    });
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

calculationsRouter.post('/convert/unit', async (req, res) => {
  try {
    const userId = requireUserId(req.body);
    const result = convertUnit(String(req.body.category), req.body.value, String(req.body.from), String(req.body.to));
    await saveHistory({
      query,
      userId,
      sessionId: sessionId(req.body),
      module: 'unit',
      expression: `${req.body.value} ${req.body.from} -> ${req.body.to}`,
      result: result.result,
      precisionNote: result.precisionNote,
      inputPayload: req.body
    });
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

calculationsRouter.get('/unit-options', (_req, res) => {
  res.json({ options: unitOptions() });
});

calculationsRouter.get('/history/:userId', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const result = await query(
      `SELECT id, module, expression, result, precision_note, input_payload, created_at
       FROM calculation_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.params.userId, limit]
    );
    res.json({ history: result.rows });
  } catch (error) {
    sendError(res, error);
  }
});
