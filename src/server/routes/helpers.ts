import { Response } from 'express';
import { DatabaseNotConfiguredError } from '../db';

export function sendError(res: Response, error: unknown): void {
  if (error instanceof DatabaseNotConfiguredError) {
    res.status(503).json({ error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  res.status(400).json({ error: message });
}

export async function saveHistory(params: {
  query: typeof import('../db').query;
  userId: string;
  sessionId?: string | null;
  module: string;
  expression: string;
  result: string;
  precisionNote?: string;
  inputPayload?: unknown;
}): Promise<void> {
  await params.query(
    `INSERT INTO calculation_history
      (user_id, session_id, module, expression, result, precision_note, input_payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      params.userId,
      params.sessionId ?? null,
      params.module,
      params.expression,
      params.result,
      params.precisionNote ?? null,
      JSON.stringify(params.inputPayload ?? {})
    ]
  );
}
