export type ApiResult = {
  result: string;
  precisionNote: string;
};

export type GameRate = {
  id: string;
  game_code: string;
  currency_code: string;
  source_name: string;
  amount_vnd: string;
  currency_amount: string;
  bonus_amount: string;
  is_active: boolean;
  note: string | null;
  source_updated_at: string | null;
};

export type HistoryItem = {
  id: string;
  module: string;
  expression: string;
  result: string;
  precision_note: string | null;
  created_at: string;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed: ${response.status}`);
  }
  return data;
}

export const api = {
  health: () => request<{ ok: boolean; databaseConfigured: boolean; dataMode: string; autosave: string }>('/api/health'),
  createGuestUser: (displayName?: string) => request<{ userId: string; sessionId: string; displayName: string }>('/api/users/guest', {
    method: 'POST',
    body: { displayName }
  }),
  loadSessions: (userId: string) => request<{ sessions: Array<{ id: string; title: string; current_module: string; draft_state: unknown; updated_at: string }> }>(`/api/sessions/${userId}`),
  loadSession: (userId: string, sessionId: string) => request<{ session: { id: string; current_module: string; draft_state: unknown; updated_at: string } }>(`/api/sessions/${userId}/${sessionId}`),
  autosaveSession: (userId: string, sessionId: string, currentModule: string, draftState: unknown) => request<{ session: { updated_at: string } }>(`/api/sessions/${userId}/${sessionId}/autosave`, {
    method: 'PATCH',
    body: { currentModule, draftState }
  }),
  calculateBasic: (body: unknown) => request<ApiResult>('/api/calculate/basic', { method: 'POST', body }),
  calculateScientific: (body: unknown) => request<ApiResult>('/api/calculate/scientific', { method: 'POST', body }),
  calculateSolver: (body: unknown) => request<ApiResult>('/api/calculate/solver', { method: 'POST', body }),
  calculateFinance: (body: unknown) => request<ApiResult>('/api/calculate/finance', { method: 'POST', body }),
  convertUnit: (body: unknown) => request<ApiResult>('/api/convert/unit', { method: 'POST', body }),
  getHistory: (userId: string) => request<{ history: HistoryItem[] }>(`/api/history/${userId}`),
  getGameRates: () => request<{ rates: GameRate[] }>('/api/game-rates'),
  addGameRate: (body: unknown) => request<{ rate: GameRate }>('/api/game-rates', { method: 'POST', body }),
  convertGameCurrency: (body: unknown) => request<{ resultAmount: string; method: string; precisionNote: string; usedRates: GameRate[] }>('/api/convert/game', { method: 'POST', body }),
  saveSettings: (userId: string, body: unknown) => request<{ settings: unknown }>(`/api/settings/${userId}`, { method: 'PATCH', body })
};
