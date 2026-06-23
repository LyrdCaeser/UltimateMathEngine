import { useEffect, useMemo, useState } from 'react';
import { api, ApiResult, GameRate, HistoryItem } from './api/client';

type Tab = 'basic' | 'scientific' | 'solver' | 'finance' | 'unit' | 'game' | 'settings';

type DraftState = {
  basic: { a: string; b: string; operation: string };
  scientific: { value: string; operation: string; angleMode: string };
  solver: { kind: string; values: string[] };
  finance: { kind: string; payload: Record<string, string> };
  unit: { category: string; value: string; from: string; to: string };
  game: { gameCode: string; currencyCode: string; amountVnd: string };
  settings: { theme: string };
};

const defaultDraft: DraftState = {
  basic: { a: '1', b: '1', operation: 'add' },
  scientific: { value: '90', operation: 'sin', angleMode: 'deg' },
  solver: { kind: 'quadratic', values: ['1', '-3', '2', '1', '1', '2'] },
  finance: { kind: 'discount', payload: { originalPrice: '100000', percent: '10' } },
  unit: { category: 'length', value: '1', from: 'm', to: 'cm' },
  game: { gameCode: 'FREE_FIRE', currencyCode: 'KC', amountVnd: '100000' },
  settings: { theme: 'dark-neon' }
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'basic', label: 'Basic' },
  { id: 'scientific', label: 'Scientific' },
  { id: 'solver', label: 'Solver' },
  { id: 'finance', label: 'Finance' },
  { id: 'unit', label: 'Unit Converter' },
  { id: 'game', label: 'Game Converter' },
  { id: 'settings', label: 'VIP UI Settings' }
];

const unitMap: Record<string, string[]> = {
  length: ['mm', 'cm', 'm', 'km'],
  mass: ['g', 'kg', 'ton'],
  time: ['second', 'minute', 'hour', 'day'],
  data: ['B', 'KB', 'MB', 'GB', 'TB'],
  temperature: ['C', 'F', 'K']
};

const gamePairs = [
  { gameCode: 'FREE_FIRE', currencyCode: 'KC', label: 'Free Fire — KC' },
  { gameCode: 'LIEN_QUAN', currencyCode: 'QH', label: 'Liên Quân — QH' },
  { gameCode: 'HSR', currencyCode: 'NAS', label: 'Honkai Star Rail — NAS' },
  { gameCode: 'GENSHIN', currencyCode: 'NT', label: 'Genshin Impact — NT' }
];

function safeDraft(value: unknown): DraftState {
  if (!value || typeof value !== 'object') return defaultDraft;
  return { ...defaultDraft, ...(value as Partial<DraftState>) };
}

export default function App() {
  const [userId, setUserId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [draft, setDraft] = useState<DraftState>(defaultDraft);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [rates, setRates] = useState<GameRate[]>([]);
  const [status, setStatus] = useState('Chưa kết nối database. Tạo user thật trước để lưu dữ liệu.');
  const [error, setError] = useState('');
  const [rateForm, setRateForm] = useState({ gameCode: 'FREE_FIRE', currencyCode: 'KC', amountVnd: '100000', currencyAmount: '', bonusAmount: '0', sourceName: 'Manual verified rate', note: '' });

  const canSave = Boolean(userId && sessionId);

  useEffect(() => {
    api.health()
      .then((health) => setStatus(health.databaseConfigured ? 'Database đã cấu hình. Sẵn sàng autosave thật.' : 'Thiếu DATABASE_URL. API DB sẽ báo 503 cho đến khi cấu hình Neon/Postgres.'))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!canSave) return;
    const handle = window.setTimeout(() => {
      api.autosaveSession(userId, sessionId, activeTab, draft)
        .then((data) => setStatus(`Autosaved server DB lúc ${new Date(data.session.updated_at).toLocaleString()}`))
        .catch((err: Error) => setError(err.message));
    }, 700);
    return () => window.clearTimeout(handle);
  }, [activeTab, draft, userId, sessionId, canSave]);

  const selectedUnitOptions = useMemo(() => unitMap[draft.unit.category] ?? unitMap.length, [draft.unit.category]);

  async function refreshHistory() {
    if (!userId) return;
    const data = await api.getHistory(userId);
    setHistory(data.history);
  }

  async function createGuest() {
    setError('');
    const data = await api.createGuestUser('UME User');
    setUserId(data.userId);
    setSessionId(data.sessionId);
    setStatus('Đã tạo user/session thật trong database. Autosave bật.');
    await refreshRates();
  }

  async function loadSession() {
    setError('');
    const data = await api.loadSession(userId, sessionId);
    setActiveTab(data.session.current_module as Tab);
    setDraft(safeDraft(data.session.draft_state));
    setStatus('Đã tải lại session từ database.');
    await refreshHistory();
    await refreshRates();
  }

  async function refreshRates() {
    const data = await api.getGameRates();
    setRates(data.rates);
  }

  async function runBasic() {
    const body = { userId, sessionId, operation: draft.basic.operation, values: [draft.basic.a, draft.basic.b], expression: `${draft.basic.operation}(${draft.basic.a}, ${draft.basic.b})` };
    const data = await api.calculateBasic(body);
    setResult(data);
    await refreshHistory();
  }

  async function runScientific() {
    const body = { userId, sessionId, ...draft.scientific, expression: `${draft.scientific.operation}(${draft.scientific.value})` };
    const data = await api.calculateScientific(body);
    setResult(data);
    await refreshHistory();
  }

  async function runSolver() {
    const body = { userId, sessionId, kind: draft.solver.kind, values: draft.solver.values, expression: `${draft.solver.kind} solver` };
    const data = await api.calculateSolver(body);
    setResult(data);
    await refreshHistory();
  }

  async function runFinance() {
    const body = { userId, sessionId, kind: draft.finance.kind, payload: draft.finance.payload, expression: `${draft.finance.kind}` };
    const data = await api.calculateFinance(body);
    setResult(data);
    await refreshHistory();
  }

  async function runUnit() {
    const body = { userId, sessionId, ...draft.unit };
    const data = await api.convertUnit(body);
    setResult(data);
    await refreshHistory();
  }

  async function addRate() {
    setError('');
    await api.addGameRate(rateForm);
    setStatus('Đã lưu tỷ giá game thật vào database.');
    await refreshRates();
  }

  async function runGame() {
    const body = { userId, sessionId, ...draft.game };
    const data = await api.convertGameCurrency(body);
    setResult({ result: `${data.resultAmount} ${draft.game.currencyCode}`, precisionNote: data.precisionNote });
    await refreshHistory();
  }

  async function saveSettings() {
    await api.saveSettings(userId, { theme: draft.settings.theme, settings: draft.settings });
    setStatus('Đã lưu cài đặt UI vào database.');
  }

  async function guarded(action: () => Promise<void>) {
    try {
      setError('');
      if (!canSave) throw new Error('Cần userId + sessionId thật trước khi tính/lưu.');
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <main className="appShell">
      <section className="hero panel">
        <div>
          <p className="eyebrow">Real Calculation System</p>
          <h1>Ultimate Math Engine</h1>
          <p className="subtle">V1 + V2 + V3. Dữ liệu đi qua API và database, autosave server-side, target chuẩn xác ≥ 99%.</p>
        </div>
        <div className="badges">
          <span>Real Data</span>
          <span>Server Autosave</span>
          <span>DB Only</span>
          <span>≥99%</span>
        </div>
      </section>

      <section className="panel connectionGrid">
        <div>
          <h2>Kết nối dữ liệu thật</h2>
          <p className="subtle">F5 không mất dữ liệu trong DB, nhưng chưa có đăng nhập nên cần giữ/paste lại userId + sessionId để tải session.</p>
        </div>
        <button onClick={() => createGuest().catch((err: Error) => setError(err.message))} className="primary">Tạo user thật</button>
        <label>User ID<input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid user" /></label>
        <label>Session ID<input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="uuid session" /></label>
        <button onClick={() => guarded(loadSession).catch(() => undefined)}>Load session từ DB</button>
      </section>

      <section className="statusLine">
        <span>{status}</span>
        {error && <strong>{error}</strong>}
      </section>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </nav>

      <section className="workspace">
        <div className="panel calculatorPanel">
          {activeTab === 'basic' && (
            <div className="formGrid">
              <h2>Máy tính cơ bản</h2>
              <select value={draft.basic.operation} onChange={(e) => setDraft({ ...draft, basic: { ...draft.basic, operation: e.target.value } })}>
                <option value="add">Cộng</option><option value="subtract">Trừ</option><option value="multiply">Nhân</option><option value="divide">Chia</option><option value="percentOf">% của</option><option value="power">Lũy thừa</option><option value="sqrt">Căn bậc hai</option>
              </select>
              <input value={draft.basic.a} onChange={(e) => setDraft({ ...draft, basic: { ...draft.basic, a: e.target.value } })} />
              <input value={draft.basic.b} onChange={(e) => setDraft({ ...draft, basic: { ...draft.basic, b: e.target.value } })} />
              <button className="primary" onClick={() => guarded(runBasic)}>Tính</button>
            </div>
          )}

          {activeTab === 'scientific' && (
            <div className="formGrid">
              <h2>Máy tính khoa học</h2>
              <select value={draft.scientific.operation} onChange={(e) => setDraft({ ...draft, scientific: { ...draft.scientific, operation: e.target.value } })}>
                <option value="sin">sin</option><option value="cos">cos</option><option value="tan">tan</option><option value="log10">log10</option><option value="ln">ln</option><option value="exp">e^x</option><option value="abs">abs</option><option value="factorial">giai thừa</option>
              </select>
              <select value={draft.scientific.angleMode} onChange={(e) => setDraft({ ...draft, scientific: { ...draft.scientific, angleMode: e.target.value } })}>
                <option value="deg">Độ</option><option value="rad">Radian</option>
              </select>
              <input value={draft.scientific.value} onChange={(e) => setDraft({ ...draft, scientific: { ...draft.scientific, value: e.target.value } })} />
              <button className="primary" onClick={() => guarded(runScientific)}>Tính</button>
            </div>
          )}

          {activeTab === 'solver' && (
            <div className="formGrid">
              <h2>Giải toán tự động</h2>
              <select value={draft.solver.kind} onChange={(e) => setDraft({ ...draft, solver: { ...draft.solver, kind: e.target.value } })}>
                <option value="linear">ax + b = 0</option><option value="quadratic">ax² + bx + c = 0</option><option value="system2">Hệ 2 ẩn</option>
              </select>
              <p className="subtle">Linear dùng 2 ô đầu. Quadratic dùng 3 ô đầu. Hệ 2 ẩn dùng 6 ô: a,b,c,d,e,f.</p>
              <div className="miniGrid">
                {draft.solver.values.map((value, index) => (
                  <input key={index} value={value} onChange={(e) => {
                    const values = [...draft.solver.values];
                    values[index] = e.target.value;
                    setDraft({ ...draft, solver: { ...draft.solver, values } });
                  }} />
                ))}
              </div>
              <button className="primary" onClick={() => guarded(runSolver)}>Giải</button>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="formGrid">
              <h2>Tính tiền / đời sống</h2>
              <select value={draft.finance.kind} onChange={(e) => setDraft({ ...draft, finance: { ...draft.finance, kind: e.target.value } })}>
                <option value="discount">Giảm giá</option><option value="profitLoss">Lời / lỗ</option><option value="simpleInterest">Lãi đơn</option><option value="compoundInterest">Lãi kép</option><option value="installment">Trả góp</option>
              </select>
              {['originalPrice','percent','cost','revenue','principal','annualRate','years','months','compoundsPerYear'].map((key) => (
                <label key={key}>{key}<input value={draft.finance.payload[key] ?? ''} onChange={(e) => setDraft({ ...draft, finance: { ...draft.finance, payload: { ...draft.finance.payload, [key]: e.target.value } } })} /></label>
              ))}
              <button className="primary" onClick={() => guarded(runFinance)}>Tính</button>
            </div>
          )}

          {activeTab === 'unit' && (
            <div className="formGrid">
              <h2>Chuyển đổi đơn vị</h2>
              <select value={draft.unit.category} onChange={(e) => {
                const options = unitMap[e.target.value] ?? ['m'];
                setDraft({ ...draft, unit: { ...draft.unit, category: e.target.value, from: options[0], to: options[1] ?? options[0] } });
              }}>
                {Object.keys(unitMap).map((key) => <option key={key} value={key}>{key}</option>)}
              </select>
              <input value={draft.unit.value} onChange={(e) => setDraft({ ...draft, unit: { ...draft.unit, value: e.target.value } })} />
              <select value={draft.unit.from} onChange={(e) => setDraft({ ...draft, unit: { ...draft.unit, from: e.target.value } })}>{selectedUnitOptions.map((unit) => <option key={unit}>{unit}</option>)}</select>
              <select value={draft.unit.to} onChange={(e) => setDraft({ ...draft, unit: { ...draft.unit, to: e.target.value } })}>{selectedUnitOptions.map((unit) => <option key={unit}>{unit}</option>)}</select>
              <button className="primary" onClick={() => guarded(runUnit)}>Đổi</button>
            </div>
          )}

          {activeTab === 'game' && (
            <div className="formGrid">
              <h2>Game Converter</h2>
              <p className="subtle">Không có tỷ giá ảo. Muốn tính thì nhập gói nạp/thẻ thật vào DB trước.</p>
              <select value={`${draft.game.gameCode}/${draft.game.currencyCode}`} onChange={(e) => {
                const [gameCode, currencyCode] = e.target.value.split('/');
                setDraft({ ...draft, game: { ...draft.game, gameCode, currencyCode } });
              }}>
                {gamePairs.map((pair) => <option key={pair.label} value={`${pair.gameCode}/${pair.currencyCode}`}>{pair.label}</option>)}
              </select>
              <input value={draft.game.amountVnd} onChange={(e) => setDraft({ ...draft, game: { ...draft.game, amountVnd: e.target.value } })} placeholder="VND" />
              <button className="primary" onClick={() => guarded(runGame)}>Quy đổi</button>

              <h3>Thêm tỷ giá thật</h3>
              <div className="miniGrid">
                <input value={rateForm.gameCode} onChange={(e) => setRateForm({ ...rateForm, gameCode: e.target.value })} placeholder="FREE_FIRE" />
                <input value={rateForm.currencyCode} onChange={(e) => setRateForm({ ...rateForm, currencyCode: e.target.value })} placeholder="KC" />
                <input value={rateForm.amountVnd} onChange={(e) => setRateForm({ ...rateForm, amountVnd: e.target.value })} placeholder="VND" />
                <input value={rateForm.currencyAmount} onChange={(e) => setRateForm({ ...rateForm, currencyAmount: e.target.value })} placeholder="Currency" />
                <input value={rateForm.bonusAmount} onChange={(e) => setRateForm({ ...rateForm, bonusAmount: e.target.value })} placeholder="Bonus" />
                <input value={rateForm.sourceName} onChange={(e) => setRateForm({ ...rateForm, sourceName: e.target.value })} placeholder="Nguồn" />
              </div>
              <input value={rateForm.note} onChange={(e) => setRateForm({ ...rateForm, note: e.target.value })} placeholder="Ghi chú xác minh" />
              <button onClick={() => guarded(addRate)}>Lưu tỷ giá vào DB</button>
              <button onClick={() => guarded(refreshRates)}>Tải tỷ giá</button>
              <div className="rateList">{rates.map((rate) => <span key={rate.id}>{rate.game_code}/{rate.currency_code}: {rate.amount_vnd}đ → {rate.currency_amount}+{rate.bonus_amount}</span>)}</div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="formGrid">
              <h2>VIP UI Settings</h2>
              <select value={draft.settings.theme} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, theme: e.target.value } })}>
                <option value="dark-neon">Dark Neon</option><option value="glass-vip">Glass VIP</option><option value="midnight">Midnight</option>
              </select>
              <button className="primary" onClick={() => guarded(saveSettings)}>Lưu setting DB</button>
            </div>
          )}
        </div>

        <aside className="panel resultPanel">
          <h2>Kết quả</h2>
          {result ? <><div className="resultBox">{result.result}</div><p className="subtle">{result.precisionNote}</p></> : <p className="subtle">Chưa có kết quả.</p>}
          <button onClick={() => guarded(refreshHistory)}>Refresh history</button>
          <h3>Lịch sử DB</h3>
          <div className="historyList">
            {history.map((item) => <div key={item.id} className="historyItem"><strong>{item.module}</strong><span>{item.expression}</span><b>{item.result}</b></div>)}
          </div>
        </aside>
      </section>
    </main>
  );
}
