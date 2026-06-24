import { useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiResult, GameRate, HistoryItem, MusicRequest, SiteSettings } from './api/client';

type Tab = 'basic' | 'scientific' | 'solver' | 'finance' | 'unit' | 'game' | 'settings';
type Lang = 'vi' | 'en' | 'zh';

type DraftState = {
  basic: { a: string; b: string; operation: string };
  scientific: { value: string; operation: string; angleMode: string };
  solver: { kind: string; values: string[] };
  finance: { kind: string; payload: Record<string, string> };
  unit: { category: string; value: string; from: string; to: string };
  game: { gameCode: string; currencyCode: string; amountVnd: string };
  settings: { theme: string; language: Lang };
};

const defaultDraft: DraftState = {
  basic: { a: '1', b: '1', operation: 'add' },
  scientific: { value: '90', operation: 'sin', angleMode: 'deg' },
  solver: { kind: 'quadratic', values: ['1', '-3', '2', '1', '1', '2'] },
  finance: { kind: 'discount', payload: { originalPrice: '100000', percent: '10' } },
  unit: { category: 'length', value: '1', from: 'm', to: 'cm' },
  game: { gameCode: 'FREE_FIRE', currencyCode: 'KC', amountVnd: '100000' },
  settings: { theme: 'dark-neon', language: 'vi' }
};

const translations = {
  vi: {
    appBadge: 'HỆ THỐNG TÍNH TOÁN DỮ LIỆU THẬT',
    subtitle: 'V1 + V2 + V3. Dữ liệu thật qua API và cơ sở dữ liệu, tự động lưu phía máy chủ, độ chính xác mục tiêu ≥ 99%.',
    realData: 'Dữ Liệu Thật', serverAutosave: 'Tự Lưu Server', dbOnly: 'Chỉ Dùng CSDL', accuracy: '≥99%',
    language: 'Ngôn Ngữ', vietnamese: 'Tiếng Việt', english: 'English', chinese: '中文',
    connectionTitle: 'Kết nối dữ liệu thật',
    createUser: 'Tạo user thật', loadSession: 'Tải phiên từ CSDL', userId: 'User ID', sessionId: 'Session ID',
    userPlaceholder: 'Nhập User ID...', sessionPlaceholder: 'Nhập Session ID...',
    dbReady: 'Cơ sở dữ liệu đã cấu hình. Sẵn sàng tự động lưu thật.',
    dbMissing: 'Thiếu DATABASE_URL. API DB sẽ báo 503 cho đến khi cấu hình Neon/PostgreSQL.',
    initialStatus: 'Sẵn sàng kết nối dữ liệu thật.',
    guestCreated: 'Đã tạo user/session thật trong cơ sở dữ liệu. Tự lưu đã bật.',
    sessionLoaded: 'Đã tải lại phiên từ cơ sở dữ liệu.',
    autosaved: 'Đã tự lưu server lúc',
    needSession: 'Cần User ID + Session ID thật trước khi tính/lưu.',
    tabs: { basic: 'Cơ Bản', scientific: 'Khoa Học', solver: 'Giải PT', finance: 'Tài Chính', unit: 'Đổi Đơn Vị', game: 'Quy Đổi Game', settings: 'Cài Đặt' },
    basicTitle: 'Máy tính cơ bản', operation: 'Phép tính', firstNumber: 'Số thứ nhất', secondNumber: 'Số thứ hai',
    firstPlaceholder: 'Nhập số thứ nhất...', secondPlaceholder: 'Nhập số thứ hai...', calculate: 'Tính kết quả',
    add: 'Cộng', subtract: 'Trừ', multiply: 'Nhân', divide: 'Chia', percentOf: '% của', power: 'Lũy thừa', sqrt: 'Căn bậc hai',
    scientificTitle: 'Máy tính khoa học', angleMode: 'Kiểu góc', degree: 'Độ', radian: 'Radian', value: 'Giá trị',
    solverTitle: 'Giải toán tự động', solverHint: 'Bậc 1 dùng 2 ô đầu. Bậc 2 dùng 3 ô đầu. Hệ 2 ẩn dùng 6 ô: a,b,c,d,e,f.', solve: 'Giải',
    linear: 'ax + b = 0', quadratic: 'ax² + bx + c = 0', system2: 'Hệ 2 ẩn',
    financeTitle: 'Tính tiền / đời sống', discount: 'Giảm giá', profitLoss: 'Lời / lỗ', simpleInterest: 'Lãi đơn', compoundInterest: 'Lãi kép', installment: 'Trả góp',
    unitTitle: 'Chuyển đổi đơn vị', category: 'Nhóm đơn vị', from: 'Từ', to: 'Sang', convert: 'Đổi',
    gameTitle: 'Quy đổi game', gameHint: 'Không có tỷ giá ảo. Muốn tính chuẩn thì nhập gói nạp/thẻ thật vào CSDL trước.',
    amountVnd: 'Số tiền VND', addRealRate: 'Thêm tỷ giá thật', saveRate: 'Lưu tỷ giá vào CSDL', loadRates: 'Tải tỷ giá', verifiedNote: 'Ghi chú xác minh', source: 'Nguồn', currency: 'Số lượng', bonus: 'Thưởng thêm',
    settingsTitle: 'Cài đặt VIP', saveSettings: 'Lưu cài đặt vào CSDL', theme: 'Giao diện',
    result: 'Kết quả', noResult: 'Chưa có kết quả.', refreshHistory: 'Làm mới lịch sử', historyDb: 'Lịch sử CSDL', footer: 'Dữ liệu thật qua API & CSDL • Tự động lưu phía server • Độ chính xác mục tiêu ≥ 99%',
    musicNow: 'Nhạc nền', playMusic: 'Bật nhạc', pauseMusic: 'Tắt nhạc', volumeDown: 'Giảm âm', volumeUp: 'Tăng âm',
    adminLock: 'Khóa chỉnh web', adminKey: 'Key quản trị', unlockHint: 'Chỉ người có key mới đổi được ảnh nền và nhạc chung.', unlock: 'Mở khóa', saveSite: 'Lưu ảnh/nhạc web', backgroundUrl: 'Link ảnh nền', musicUrl: 'Link nhạc', musicTitle: 'Tên nhạc', enableMusic: 'Phát nhạc cho web',
    musicRequestTitle: 'Yêu cầu đổi nhạc', requesterName: 'Tên người yêu cầu', songTitle: 'Tên bài nhạc', note: 'Ghi chú', sendRequest: 'Gửi yêu cầu đổi nhạc', approvalBoard: 'Bảng phê duyệt yêu cầu nhạc', loadRequests: 'Tải yêu cầu', approve: 'Duyệt', reject: 'Từ chối', applyMusic: 'Duyệt & đổi nhạc luôn', noRequests: 'Chưa có yêu cầu.'
  },
  en: {
    appBadge: 'REAL-DATA CALCULATION SYSTEM',
    subtitle: 'V1 + V2 + V3. Real data through API and database, server-side autosave, target accuracy ≥ 99%.',
    realData: 'Real Data', serverAutosave: 'Server Autosave', dbOnly: 'DB Only', accuracy: '≥99%',
    language: 'Language', vietnamese: 'Tiếng Việt', english: 'English', chinese: '中文',
    connectionTitle: 'Real data connection', createUser: 'Create real user', loadSession: 'Load session from DB', userId: 'User ID', sessionId: 'Session ID',
    userPlaceholder: 'Enter User ID...', sessionPlaceholder: 'Enter Session ID...',
    dbReady: 'Database configured. Real autosave is ready.', dbMissing: 'DATABASE_URL is missing. DB APIs will return 503 until Neon/PostgreSQL is configured.',
    initialStatus: 'Ready for real data connection.', guestCreated: 'Created a real user/session in the database. Autosave is enabled.', sessionLoaded: 'Session loaded from database.', autosaved: 'Server autosaved at', needSession: 'A real User ID + Session ID is required before calculating/saving.',
    tabs: { basic: 'Basic', scientific: 'Scientific', solver: 'Equation Solver', finance: 'Finance', unit: 'Unit Converter', game: 'Game Converter', settings: 'Settings' },
    basicTitle: 'Basic calculator', operation: 'Operation', firstNumber: 'First number', secondNumber: 'Second number', firstPlaceholder: 'Enter first number...', secondPlaceholder: 'Enter second number...', calculate: 'Calculate',
    add: 'Add', subtract: 'Subtract', multiply: 'Multiply', divide: 'Divide', percentOf: 'Percent of', power: 'Power', sqrt: 'Square root',
    scientificTitle: 'Scientific calculator', angleMode: 'Angle mode', degree: 'Degree', radian: 'Radian', value: 'Value',
    solverTitle: 'Automatic solver', solverHint: 'Linear uses first 2 fields. Quadratic uses first 3 fields. 2-variable system uses 6 fields: a,b,c,d,e,f.', solve: 'Solve', linear: 'ax + b = 0', quadratic: 'ax² + bx + c = 0', system2: '2-variable system',
    financeTitle: 'Money / life tools', discount: 'Discount', profitLoss: 'Profit / loss', simpleInterest: 'Simple interest', compoundInterest: 'Compound interest', installment: 'Installment',
    unitTitle: 'Unit converter', category: 'Category', from: 'From', to: 'To', convert: 'Convert',
    gameTitle: 'Game converter', gameHint: 'No fake rates. Add verified real card/top-up packages to the database first.', amountVnd: 'Amount VND', addRealRate: 'Add real rate', saveRate: 'Save rate to DB', loadRates: 'Load rates', verifiedNote: 'Verification note', source: 'Source', currency: 'Currency amount', bonus: 'Bonus',
    settingsTitle: 'VIP settings', saveSettings: 'Save settings to DB', theme: 'Theme',
    result: 'Result', noResult: 'No result yet.', refreshHistory: 'Refresh history', historyDb: 'DB history', footer: 'Real data via API & DB • Server-side autosave • Target accuracy ≥ 99%',
    musicNow: 'Background music', playMusic: 'Play music', pauseMusic: 'Pause music', volumeDown: 'Volume down', volumeUp: 'Volume up',
    adminLock: 'Web edit lock', adminKey: 'Admin key', unlockHint: 'Only the key holder can change the global background and music.', unlock: 'Unlock', saveSite: 'Save site media', backgroundUrl: 'Background image URL', musicUrl: 'Music URL', musicTitle: 'Music title', enableMusic: 'Enable site music',
    musicRequestTitle: 'Request music change', requesterName: 'Requester name', songTitle: 'Song title', note: 'Note', sendRequest: 'Send music request', approvalBoard: 'Music request approval board', loadRequests: 'Load requests', approve: 'Approve', reject: 'Reject', applyMusic: 'Approve & apply', noRequests: 'No requests yet.'
  },
  zh: {
    appBadge: '真实数据计算系统',
    subtitle: 'V1 + V2 + V3。数据通过 API 与数据库，服务器端自动保存，目标准确率 ≥ 99%。',
    realData: '真实数据', serverAutosave: '服务器自动保存', dbOnly: '仅使用数据库', accuracy: '≥99%',
    language: '语言', vietnamese: 'Tiếng Việt', english: 'English', chinese: '中文',
    connectionTitle: '真实数据连接', createUser: '创建真实用户', loadSession: '从数据库加载会话', userId: '用户 ID', sessionId: '会话 ID',
    userPlaceholder: '输入 User ID...', sessionPlaceholder: '输入 Session ID...',
    dbReady: '数据库已配置。真实自动保存已就绪。', dbMissing: '缺少 DATABASE_URL。配置 Neon/PostgreSQL 前，数据库 API 将返回 503。',
    initialStatus: '准备连接真实数据。', guestCreated: '已在数据库创建真实用户/会话。自动保存已开启。', sessionLoaded: '已从数据库加载会话。', autosaved: '服务器自动保存于', needSession: '计算/保存前需要真实 User ID + Session ID。',
    tabs: { basic: '基础', scientific: '科学', solver: '方程求解', finance: '财务', unit: '单位转换', game: '游戏换算', settings: '设置' },
    basicTitle: '基础计算器', operation: '运算', firstNumber: '第一个数', secondNumber: '第二个数', firstPlaceholder: '输入第一个数...', secondPlaceholder: '输入第二个数...', calculate: '计算结果',
    add: '加', subtract: '减', multiply: '乘', divide: '除', percentOf: '百分比', power: '幂', sqrt: '平方根',
    scientificTitle: '科学计算器', angleMode: '角度模式', degree: '角度', radian: '弧度', value: '数值',
    solverTitle: '自动解题', solverHint: '一次方程使用前 2 个输入。二次方程使用前 3 个输入。二元方程组使用 6 个输入：a,b,c,d,e,f。', solve: '求解', linear: 'ax + b = 0', quadratic: 'ax² + bx + c = 0', system2: '二元方程组',
    financeTitle: '金钱 / 生活工具', discount: '折扣', profitLoss: '盈亏', simpleInterest: '单利', compoundInterest: '复利', installment: '分期付款',
    unitTitle: '单位转换', category: '类别', from: '从', to: '到', convert: '转换',
    gameTitle: '游戏换算', gameHint: '不使用虚假汇率。请先把已验证的真实充值/卡券套餐加入数据库。', amountVnd: '金额 VND', addRealRate: '添加真实汇率', saveRate: '保存汇率到数据库', loadRates: '加载汇率', verifiedNote: '验证备注', source: '来源', currency: '货币数量', bonus: '额外奖励',
    settingsTitle: 'VIP 设置', saveSettings: '保存设置到数据库', theme: '主题',
    result: '结果', noResult: '暂无结果。', refreshHistory: '刷新历史', historyDb: '数据库历史', footer: '真实数据经由 API 与数据库 • 服务器端自动保存 • 目标准确率 ≥ 99%',
    musicNow: '背景音乐', playMusic: '播放音乐', pauseMusic: '暂停音乐', volumeDown: '降低音量', volumeUp: '提高音量',
    adminLock: '网站编辑锁', adminKey: '管理密钥', unlockHint: '只有持有密钥的人可以修改全站背景和音乐。', unlock: '解锁', saveSite: '保存网站媒体', backgroundUrl: '背景图链接', musicUrl: '音乐链接', musicTitle: '音乐标题', enableMusic: '启用网站音乐',
    musicRequestTitle: '申请更换音乐', requesterName: '申请人', songTitle: '歌曲名', note: '备注', sendRequest: '提交音乐申请', approvalBoard: '音乐申请审核表', loadRequests: '加载申请', approve: '批准', reject: '拒绝', applyMusic: '批准并应用', noRequests: '暂无申请。'
  }
} as const;

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

const defaultSiteSettings: SiteSettings = {
  id: 'global',
  background_url: '/wolf-bg.jpg',
  music_url: '',
  music_title: '',
  music_enabled: false,
  volume: '0.45',
  updated_at: ''
};

function safeDraft(value: unknown): DraftState {
  if (!value || typeof value !== 'object') return defaultDraft;
  const incoming = value as Partial<DraftState>;
  return {
    ...defaultDraft,
    ...incoming,
    basic: { ...defaultDraft.basic, ...incoming.basic },
    scientific: { ...defaultDraft.scientific, ...incoming.scientific },
    solver: { ...defaultDraft.solver, ...incoming.solver },
    finance: { ...defaultDraft.finance, ...incoming.finance },
    unit: { ...defaultDraft.unit, ...incoming.unit },
    game: { ...defaultDraft.game, ...incoming.game },
    settings: { ...defaultDraft.settings, ...incoming.settings }
  };
}

function cssUrl(url: string): string {
  return `url("${url.replace(/"/g, '%22')}")`;
}

export default function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [userId, setUserId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [draft, setDraft] = useState<DraftState>(defaultDraft);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [rates, setRates] = useState<GameRate[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [musicRequests, setMusicRequests] = useState<MusicRequest[]>([]);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [status, setStatus] = useState<string>(translations.vi.initialStatus);
  const [error, setError] = useState('');
  const [rateForm, setRateForm] = useState({ gameCode: 'FREE_FIRE', currencyCode: 'KC', amountVnd: '100000', currencyAmount: '', bonusAmount: '0', sourceName: 'Manual verified rate', note: '' });
  const [adminKey, setAdminKey] = useState('');
  const [siteForm, setSiteForm] = useState({ backgroundUrl: '/wolf-bg.jpg', musicUrl: '', musicTitle: '', musicEnabled: false, volume: '0.45' });
  const [requestForm, setRequestForm] = useState({ requesterName: '', songTitle: '', musicUrl: '', note: '' });

  const lang = draft.settings.language;
  const tr = translations[lang];
  const canSave = Boolean(userId && sessionId);
  const volume = Math.max(0, Math.min(1, Number(siteSettings.volume || siteForm.volume || 0.45)));

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'basic', label: tr.tabs.basic, icon: '▣' },
    { id: 'scientific', label: tr.tabs.scientific, icon: '⚗' },
    { id: 'solver', label: tr.tabs.solver, icon: 'ƒ' },
    { id: 'finance', label: tr.tabs.finance, icon: '↗' },
    { id: 'unit', label: tr.tabs.unit, icon: '⇄' },
    { id: 'game', label: tr.tabs.game, icon: '🎮' },
    { id: 'settings', label: tr.tabs.settings, icon: '⚙' }
  ];

  useEffect(() => {
    api.health()
      .then((health) => setStatus(health.databaseConfigured ? translations[lang].dbReady : translations[lang].dbMissing))
      .catch((err: Error) => setError(err.message));
    api.getSiteSettings()
      .then((data) => {
        setSiteSettings(data.settings);
        setSiteForm({
          backgroundUrl: data.settings.background_url || '/wolf-bg.jpg',
          musicUrl: data.settings.music_url || '',
          musicTitle: data.settings.music_title || '',
          musicEnabled: Boolean(data.settings.music_enabled),
          volume: data.settings.volume || '0.45'
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [lang]);

  useEffect(() => {
    if (!canSave) return;
    const handle = window.setTimeout(() => {
      api.autosaveSession(userId, sessionId, activeTab, draft)
        .then((data) => setStatus(`${translations[lang].autosaved} ${new Date(data.session.updated_at).toLocaleString()}`))
        .catch((err: Error) => setError(err.message));
    }, 700);
    return () => window.clearTimeout(handle);
  }, [activeTab, draft, userId, sessionId, canSave, lang]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume, siteSettings.music_url]);

  const selectedUnitOptions = useMemo(() => unitMap[draft.unit.category] ?? ['m'], [draft.unit.category]);

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
    setStatus(translations[lang].guestCreated);
    await refreshRates();
  }

  async function loadSession() {
    setError('');
    const data = await api.loadSession(userId, sessionId);
    setActiveTab(data.session.current_module as Tab);
    setDraft(safeDraft(data.session.draft_state));
    setStatus(translations[lang].sessionLoaded);
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
    setStatus(lang === 'vi' ? 'Đã lưu tỷ giá game thật vào cơ sở dữ liệu.' : lang === 'en' ? 'Saved the real game rate to the database.' : '已将真实游戏汇率保存到数据库。');
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
    setStatus(lang === 'vi' ? 'Đã lưu cài đặt UI vào cơ sở dữ liệu.' : lang === 'en' ? 'Saved UI settings to the database.' : '已将界面设置保存到数据库。');
  }

  async function saveSiteSettings() {
    const data = await api.updateSiteSettings({
      adminKey,
      backgroundUrl: siteForm.backgroundUrl,
      musicUrl: siteForm.musicUrl,
      musicTitle: siteForm.musicTitle,
      musicEnabled: siteForm.musicEnabled,
      volume: Number(siteForm.volume)
    });
    setSiteSettings(data.settings);
    setStatus(lang === 'vi' ? 'Đã cập nhật ảnh nền/nhạc web.' : lang === 'en' ? 'Updated site background/music.' : '已更新网站背景/音乐。');
  }

  async function sendMusicRequest() {
    const data = await api.createMusicRequest(requestForm);
    setRequestForm({ requesterName: '', songTitle: '', musicUrl: '', note: '' });
    setStatus(lang === 'vi' ? `Đã gửi yêu cầu đổi nhạc: ${data.request.song_title}` : lang === 'en' ? `Music request sent: ${data.request.song_title}` : `已提交音乐申请：${data.request.song_title}`);
  }

  async function loadMusicRequests() {
    const data = await api.getMusicRequests(adminKey, 'all');
    setMusicRequests(data.requests);
  }

  async function reviewMusicRequest(id: string, action: 'approved' | 'rejected', applyToSite = false) {
    await api.reviewMusicRequest(id, { adminKey, action, applyToSite });
    await loadMusicRequests();
    const settings = await api.getSiteSettings();
    setSiteSettings(settings.settings);
    setSiteForm({
      backgroundUrl: settings.settings.background_url || '/wolf-bg.jpg',
      musicUrl: settings.settings.music_url || '',
      musicTitle: settings.settings.music_title || '',
      musicEnabled: Boolean(settings.settings.music_enabled),
      volume: settings.settings.volume || '0.45'
    });
  }

  async function guarded(action: () => Promise<void>) {
    try {
      setError('');
      if (!canSave) throw new Error(translations[lang].needSession);
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function unguarded(action: () => Promise<void>) {
    try {
      setError('');
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  function setLanguage(language: Lang) {
    setDraft({ ...draft, settings: { ...draft.settings, language } });
  }

  function changeVolume(delta: number) {
    const next = Math.max(0, Math.min(1, Number(siteForm.volume || siteSettings.volume || 0.45) + delta));
    setSiteForm({ ...siteForm, volume: next.toFixed(2) });
    setSiteSettings({ ...siteSettings, volume: next.toFixed(2) });
  }

  async function toggleMusic() {
    if (!audioRef.current || !siteSettings.music_url) return;
    if (audioRef.current.paused) {
      await audioRef.current.play();
      setMusicPlaying(true);
    } else {
      audioRef.current.pause();
      setMusicPlaying(false);
    }
  }

  return (
    <main className={`appShell lang-${lang}`} style={{ '--ume-bg-image': cssUrl(siteSettings.background_url || '/wolf-bg.jpg') } as React.CSSProperties}>
      <div className="dynamicBackground" />
      {siteSettings.music_url && (
        <audio ref={audioRef} src={siteSettings.music_url} loop preload="none" />
      )}

      <section className="hero panel neonPanel">
        <div className="logoMark">Σ</div>
        <div className="heroCopy">
          <p className="eyebrow">{tr.appBadge}</p>
          <h1>Ultimate Math Engine</h1>
          <p className="subtle heroSubtle">{tr.subtitle}</p>
          <div className="badges">
            <span>◉ {tr.realData}</span>
            <span>☁ {tr.serverAutosave}</span>
            <span>▣ {tr.dbOnly}</span>
            <span>◎ {tr.accuracy}</span>
          </div>
        </div>
        <div className="topTools">
          <label className="languageSelectLabel">🌐 {tr.language}
            <select className="languageSelect" value={lang} onChange={(e) => setLanguage(e.target.value as Lang)}>
              <option value="vi">🇻🇳 {tr.vietnamese}</option>
              <option value="en">🇺🇸 {tr.english}</option>
              <option value="zh">🇨🇳 {tr.chinese}</option>
            </select>
          </label>
          <button className="cyanButton musicToggle" onClick={() => unguarded(toggleMusic)} disabled={!siteSettings.music_url}>
            {musicPlaying ? `⏸ ${tr.pauseMusic}` : `▶ ${tr.playMusic}`}
          </button>
          <div className="musicMeta">{tr.musicNow}: {siteSettings.music_title || '—'}</div>
        </div>
      </section>

      <section className="panel neonPanel connectionGrid cleanConnection">
        <div className="connectionIntro">
          <h2>🔗 {tr.connectionTitle}</h2>
        </div>
        <button onClick={() => createGuest().catch((err: Error) => setError(err.message))} className="primary hotPink">👤+ {tr.createUser}</button>
        <label>{tr.userId}<input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder={tr.userPlaceholder} /></label>
        <label>{tr.sessionId}<input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder={tr.sessionPlaceholder} /></label>
        <button className="cyanButton" onClick={() => guarded(loadSession).catch(() => undefined)}>▣ {tr.loadSession}</button>
      </section>

      <section className="statusLine">
        <span>✓ {status}</span>
        {error && <strong>⚠ {error}</strong>}
      </section>

      <nav className="tabs panel neonPanel">
        {tabs.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
            <span className="tabIcon">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </nav>

      <section className="workspace">
        <div className="panel neonPanel calculatorPanel">
          {activeTab === 'basic' && (
            <div className="formGrid">
              <h2>▣ {tr.basicTitle}</h2>
              <label>{tr.operation}<select value={draft.basic.operation} onChange={(e) => setDraft({ ...draft, basic: { ...draft.basic, operation: e.target.value } })}>
                <option value="add">{tr.add}</option><option value="subtract">{tr.subtract}</option><option value="multiply">{tr.multiply}</option><option value="divide">{tr.divide}</option><option value="percentOf">{tr.percentOf}</option><option value="power">{tr.power}</option><option value="sqrt">{tr.sqrt}</option>
              </select></label>
              <div className="twoColumns">
                <label>{tr.firstNumber}<input value={draft.basic.a} onChange={(e) => setDraft({ ...draft, basic: { ...draft.basic, a: e.target.value } })} placeholder={tr.firstPlaceholder} /></label>
                <label>{tr.secondNumber}<input value={draft.basic.b} onChange={(e) => setDraft({ ...draft, basic: { ...draft.basic, b: e.target.value } })} placeholder={tr.secondPlaceholder} /></label>
              </div>
              <button className="primary gradientAction" onClick={() => guarded(runBasic)}>⚡ {tr.calculate}</button>
            </div>
          )}

          {activeTab === 'scientific' && (
            <div className="formGrid">
              <h2>⚗ {tr.scientificTitle}</h2>
              <label>{tr.operation}<select value={draft.scientific.operation} onChange={(e) => setDraft({ ...draft, scientific: { ...draft.scientific, operation: e.target.value } })}>
                <option value="sin">sin</option><option value="cos">cos</option><option value="tan">tan</option><option value="log10">log10</option><option value="ln">ln</option><option value="exp">e^x</option><option value="abs">abs</option><option value="factorial">factorial</option>
              </select></label>
              <label>{tr.angleMode}<select value={draft.scientific.angleMode} onChange={(e) => setDraft({ ...draft, scientific: { ...draft.scientific, angleMode: e.target.value } })}>
                <option value="deg">{tr.degree}</option><option value="rad">{tr.radian}</option>
              </select></label>
              <label>{tr.value}<input value={draft.scientific.value} onChange={(e) => setDraft({ ...draft, scientific: { ...draft.scientific, value: e.target.value } })} /></label>
              <button className="primary gradientAction" onClick={() => guarded(runScientific)}>⚡ {tr.calculate}</button>
            </div>
          )}

          {activeTab === 'solver' && (
            <div className="formGrid">
              <h2>ƒ(x) {tr.solverTitle}</h2>
              <label>{tr.operation}<select value={draft.solver.kind} onChange={(e) => setDraft({ ...draft, solver: { ...draft.solver, kind: e.target.value } })}>
                <option value="linear">{tr.linear}</option><option value="quadratic">{tr.quadratic}</option><option value="system2">{tr.system2}</option>
              </select></label>
              <p className="subtle">{tr.solverHint}</p>
              <div className="miniGrid">
                {draft.solver.values.map((value, index) => (
                  <input key={index} value={value} onChange={(e) => {
                    const values = [...draft.solver.values];
                    values[index] = e.target.value;
                    setDraft({ ...draft, solver: { ...draft.solver, values } });
                  }} />
                ))}
              </div>
              <button className="primary gradientAction" onClick={() => guarded(runSolver)}>⚡ {tr.solve}</button>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="formGrid">
              <h2>↗ {tr.financeTitle}</h2>
              <label>{tr.operation}<select value={draft.finance.kind} onChange={(e) => setDraft({ ...draft, finance: { ...draft.finance, kind: e.target.value } })}>
                <option value="discount">{tr.discount}</option><option value="profitLoss">{tr.profitLoss}</option><option value="simpleInterest">{tr.simpleInterest}</option><option value="compoundInterest">{tr.compoundInterest}</option><option value="installment">{tr.installment}</option>
              </select></label>
              {['originalPrice','percent','cost','revenue','principal','annualRate','years','months','compoundsPerYear'].map((key) => (
                <label key={key}>{key}<input value={draft.finance.payload[key] ?? ''} onChange={(e) => setDraft({ ...draft, finance: { ...draft.finance, payload: { ...draft.finance.payload, [key]: e.target.value } } })} /></label>
              ))}
              <button className="primary gradientAction" onClick={() => guarded(runFinance)}>⚡ {tr.calculate}</button>
            </div>
          )}

          {activeTab === 'unit' && (
            <div className="formGrid">
              <h2>⇄ {tr.unitTitle}</h2>
              <label>{tr.category}<select value={draft.unit.category} onChange={(e) => {
                const options = unitMap[e.target.value] ?? ['m'];
                setDraft({ ...draft, unit: { ...draft.unit, category: e.target.value, from: options[0], to: options[1] ?? options[0] } });
              }}>
                {Object.keys(unitMap).map((key) => <option key={key} value={key}>{key}</option>)}
              </select></label>
              <label>{tr.value}<input value={draft.unit.value} onChange={(e) => setDraft({ ...draft, unit: { ...draft.unit, value: e.target.value } })} /></label>
              <div className="twoColumns">
                <label>{tr.from}<select value={draft.unit.from} onChange={(e) => setDraft({ ...draft, unit: { ...draft.unit, from: e.target.value } })}>{selectedUnitOptions.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
                <label>{tr.to}<select value={draft.unit.to} onChange={(e) => setDraft({ ...draft, unit: { ...draft.unit, to: e.target.value } })}>{selectedUnitOptions.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
              </div>
              <button className="primary gradientAction" onClick={() => guarded(runUnit)}>⚡ {tr.convert}</button>
            </div>
          )}

          {activeTab === 'game' && (
            <div className="formGrid">
              <h2>🎮 {tr.gameTitle}</h2>
              <p className="subtle">{tr.gameHint}</p>
              <label>{tr.gameTitle}<select value={`${draft.game.gameCode}/${draft.game.currencyCode}`} onChange={(e) => {
                const [gameCode, currencyCode] = e.target.value.split('/');
                setDraft({ ...draft, game: { ...draft.game, gameCode, currencyCode } });
              }}>
                {gamePairs.map((pair) => <option key={pair.label} value={`${pair.gameCode}/${pair.currencyCode}`}>{pair.label}</option>)}
              </select></label>
              <label>{tr.amountVnd}<input value={draft.game.amountVnd} onChange={(e) => setDraft({ ...draft, game: { ...draft.game, amountVnd: e.target.value } })} placeholder="VND" /></label>
              <button className="primary gradientAction" onClick={() => guarded(runGame)}>⚡ {tr.convert}</button>

              <h3>{tr.addRealRate}</h3>
              <div className="miniGrid">
                <input value={rateForm.gameCode} onChange={(e) => setRateForm({ ...rateForm, gameCode: e.target.value })} placeholder="FREE_FIRE" />
                <input value={rateForm.currencyCode} onChange={(e) => setRateForm({ ...rateForm, currencyCode: e.target.value })} placeholder="KC" />
                <input value={rateForm.amountVnd} onChange={(e) => setRateForm({ ...rateForm, amountVnd: e.target.value })} placeholder="VND" />
                <input value={rateForm.currencyAmount} onChange={(e) => setRateForm({ ...rateForm, currencyAmount: e.target.value })} placeholder={tr.currency} />
                <input value={rateForm.bonusAmount} onChange={(e) => setRateForm({ ...rateForm, bonusAmount: e.target.value })} placeholder={tr.bonus} />
                <input value={rateForm.sourceName} onChange={(e) => setRateForm({ ...rateForm, sourceName: e.target.value })} placeholder={tr.source} />
              </div>
              <input value={rateForm.note} onChange={(e) => setRateForm({ ...rateForm, note: e.target.value })} placeholder={tr.verifiedNote} />
              <div className="twoButtons">
                <button onClick={() => guarded(addRate)}>{tr.saveRate}</button>
                <button onClick={() => guarded(refreshRates)}>{tr.loadRates}</button>
              </div>
              <div className="rateList">{rates.map((rate) => <span key={rate.id}>{rate.game_code}/{rate.currency_code}: {rate.amount_vnd}đ → {rate.currency_amount}+{rate.bonus_amount}</span>)}</div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="formGrid">
              <h2>⚙ {tr.settingsTitle}</h2>
              <div className="twoColumns">
                <label>{tr.theme}<select value={draft.settings.theme} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, theme: e.target.value } })}>
                  <option value="dark-neon">Dark Neon</option><option value="glass-vip">Glass VIP</option><option value="midnight">Midnight</option>
                </select></label>
                <label>{tr.language}<select value={lang} onChange={(e) => setLanguage(e.target.value as Lang)}>
                  <option value="vi">Tiếng Việt</option><option value="en">English</option><option value="zh">中文</option>
                </select></label>
              </div>
              <button className="primary gradientAction" onClick={() => guarded(saveSettings)}>⚡ {tr.saveSettings}</button>

              <div className="mediaPanel">
                <h3>🎵 {tr.musicNow}</h3>
                <div className="musicControls">
                  <button className="cyanButton" onClick={() => unguarded(toggleMusic)} disabled={!siteSettings.music_url}>{musicPlaying ? tr.pauseMusic : tr.playMusic}</button>
                  <button onClick={() => changeVolume(-0.1)}>− {tr.volumeDown}</button>
                  <input type="range" min="0" max="1" step="0.01" value={siteForm.volume} onChange={(e) => { setSiteForm({ ...siteForm, volume: e.target.value }); setSiteSettings({ ...siteSettings, volume: e.target.value }); }} />
                  <button onClick={() => changeVolume(0.1)}>+ {tr.volumeUp}</button>
                </div>
              </div>

              <div className="mediaPanel adminPanel">
                <h3>🔐 {tr.adminLock}</h3>
                <p className="subtle">{tr.unlockHint}</p>
                <label>{tr.adminKey}<input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="••••••••" /></label>
                <div className="twoColumns">
                  <label>{tr.backgroundUrl}<input value={siteForm.backgroundUrl} onChange={(e) => setSiteForm({ ...siteForm, backgroundUrl: e.target.value })} placeholder="/wolf-bg.jpg hoặc https://..." /></label>
                  <label>{tr.musicTitle}<input value={siteForm.musicTitle} onChange={(e) => setSiteForm({ ...siteForm, musicTitle: e.target.value })} /></label>
                </div>
                <label>{tr.musicUrl}<input value={siteForm.musicUrl} onChange={(e) => setSiteForm({ ...siteForm, musicUrl: e.target.value })} placeholder="https://...mp3" /></label>
                <label className="checkRow"><input type="checkbox" checked={siteForm.musicEnabled} onChange={(e) => setSiteForm({ ...siteForm, musicEnabled: e.target.checked })} /> {tr.enableMusic}</label>
                <button className="primary hotPink" onClick={() => unguarded(saveSiteSettings)}>💾 {tr.saveSite}</button>
              </div>

              <div className="mediaPanel requestPanel">
                <h3>🎧 {tr.musicRequestTitle}</h3>
                <div className="twoColumns">
                  <label>{tr.requesterName}<input value={requestForm.requesterName} onChange={(e) => setRequestForm({ ...requestForm, requesterName: e.target.value })} /></label>
                  <label>{tr.songTitle}<input value={requestForm.songTitle} onChange={(e) => setRequestForm({ ...requestForm, songTitle: e.target.value })} /></label>
                </div>
                <label>{tr.musicUrl}<input value={requestForm.musicUrl} onChange={(e) => setRequestForm({ ...requestForm, musicUrl: e.target.value })} placeholder="https://...mp3" /></label>
                <label>{tr.note}<input value={requestForm.note} onChange={(e) => setRequestForm({ ...requestForm, note: e.target.value })} /></label>
                <button className="cyanButton" onClick={() => unguarded(sendMusicRequest)}>✉ {tr.sendRequest}</button>
              </div>

              <div className="mediaPanel approvalPanel">
                <h3>✅ {tr.approvalBoard}</h3>
                <button className="cyanButton" onClick={() => unguarded(loadMusicRequests)}>↻ {tr.loadRequests}</button>
                <div className="approvalTable">
                  {musicRequests.length === 0 && <p className="subtle">{tr.noRequests}</p>}
                  {musicRequests.map((request) => (
                    <div className={`approvalRow ${request.status}`} key={request.id}>
                      <div><strong>{request.song_title}</strong><span>{request.requester_name} • {request.status}</span></div>
                      <a href={request.music_url} target="_blank" rel="noreferrer">Link</a>
                      <div className="approvalActions">
                        <button onClick={() => unguarded(() => reviewMusicRequest(request.id, 'approved', false))}>{tr.approve}</button>
                        <button className="hotPink" onClick={() => unguarded(() => reviewMusicRequest(request.id, 'approved', true))}>{tr.applyMusic}</button>
                        <button onClick={() => unguarded(() => reviewMusicRequest(request.id, 'rejected', false))}>{tr.reject}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="panel neonPanel resultPanel">
          <h2>▣ {tr.result}</h2>
          {result ? <><div className="resultBox">{result.result}</div><p className="subtle">{result.precisionNote}</p></> : <div className="emptyResult">▤<p>{tr.noResult}</p></div>}
          <button className="cyanButton" onClick={() => guarded(refreshHistory)}>↻ {tr.refreshHistory}</button>
          <h3>{tr.historyDb}</h3>
          <div className="historyList">
            {history.map((item) => <div key={item.id} className="historyItem"><strong>{item.module}</strong><span>{item.expression}</span><b>{item.result}</b></div>)}
          </div>
        </aside>
      </section>

      <footer>{tr.footer}</footer>
    </main>
  );
}
