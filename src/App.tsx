import { useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiResult, GameRate, HistoryItem, MusicRequest, SiteSettings } from './api/client';

type Tab = 'basic' | 'scientific' | 'solver' | 'finance' | 'unit' | 'game' | 'settings';
type Lang = 'vi' | 'en' | 'zh';
type HelpSection = 'guide' | 'policy' | 'qrt' | 'about';

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
    subtitle: '',
    openHelp: 'HDSD A-Z • Chính sách • QRT • Giới thiệu', helpTitle: 'Trung tâm hướng dẫn & thông tin', guideTab: 'HDSD A-Z', policyTab: 'Chính sách', qrtTab: 'QRT', aboutTab: 'Giới thiệu', close: 'Đóng',
    realData: 'Dữ Liệu Thật', serverAutosave: 'Tự Lưu Server', dbOnly: 'Chỉ Dùng CSDL', accuracy: '≥99%',
    language: 'Ngôn Ngữ', vietnamese: 'Tiếng Việt', english: 'English', chinese: '中文',
    connectionTitle: 'Kết nối dữ liệu thật',
    createUser: 'Tạo user thật', loadSession: 'Tải phiên từ CSDL', userId: 'User ID', sessionId: 'Session ID',
    userPlaceholder: 'Nhập User ID...', sessionPlaceholder: 'Nhập Session ID...',
    dbReady: 'Hệ thống sẵn sàng.',
    dbMissing: 'Hệ thống chưa kết nối cơ sở dữ liệu.',
    initialStatus: 'Sẵn sàng.',
    guestCreated: 'Đã tạo phiên sử dụng.',
    sessionLoaded: 'Đã tải phiên sử dụng.',
    autosaved: 'Đã lưu lúc',
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
    gameTitle: 'Quy đổi game', gameHint: 'Chọn game, nhập số tiền và dùng bảng tỷ giá đã lưu để quy đổi.',
    amountVnd: 'Số tiền VND', addRealRate: 'Thêm tỷ giá thật', saveRate: 'Lưu tỷ giá vào CSDL', loadRates: 'Tải tỷ giá', verifiedNote: 'Ghi chú xác minh', source: 'Nguồn', currency: 'Số lượng', bonus: 'Thưởng thêm',
    settingsTitle: 'Cài đặt VIP', saveSettings: 'Lưu cài đặt vào CSDL', theme: 'Giao diện',
    result: 'Kết quả', noResult: 'Chưa có kết quả.', refreshHistory: 'Làm mới lịch sử', historyDb: 'Lịch sử CSDL', footer: 'Ultimate Math Engine • Công cụ tính toán, quy đổi và quản lý phiên sử dụng.',
    musicNow: 'Nhạc nền', playMusic: 'Bật nhạc', pauseMusic: 'Tắt nhạc', volumeDown: 'Giảm âm', volumeUp: 'Tăng âm',
    adminLock: 'Khóa chỉnh web', adminKey: 'Key quản trị', unlockHint: 'Chỉ người có key mới đổi được ảnh nền và nhạc chung.', unlock: 'Mở khóa', saveSite: 'Lưu ảnh/nhạc web', backgroundUrl: 'Link ảnh nền', musicUrl: 'Link nhạc', musicTitle: 'Tên nhạc', enableMusic: 'Phát nhạc cho web',
    musicRequestTitle: 'Yêu cầu đổi nhạc', requesterName: 'Tên người yêu cầu', songTitle: 'Tên bài nhạc', note: 'Ghi chú', sendRequest: 'Gửi yêu cầu đổi nhạc', approvalBoard: 'Bảng phê duyệt yêu cầu nhạc', loadRequests: 'Tải yêu cầu', approve: 'Duyệt', reject: 'Từ chối', applyMusic: 'Duyệt & đổi nhạc luôn', noRequests: 'Chưa có yêu cầu.'
  },
  en: {
    appBadge: 'REAL-DATA CALCULATION SYSTEM',
    subtitle: '',
    openHelp: 'A-Z Guide • Policies • QRT • About', helpTitle: 'Guide & information center', guideTab: 'A-Z Guide', policyTab: 'Policies', qrtTab: 'QRT', aboutTab: 'About', close: 'Close',
    realData: 'Real Data', serverAutosave: 'Server Autosave', dbOnly: 'DB Only', accuracy: '≥99%',
    language: 'Language', vietnamese: 'Tiếng Việt', english: 'English', chinese: '中文',
    connectionTitle: 'Real data connection', createUser: 'Create real user', loadSession: 'Load session from DB', userId: 'User ID', sessionId: 'Session ID',
    userPlaceholder: 'Enter User ID...', sessionPlaceholder: 'Enter Session ID...',
    dbReady: 'System ready.', dbMissing: 'Database connection is not configured.',
    initialStatus: 'Ready.', guestCreated: 'Session created.', sessionLoaded: 'Session loaded.', autosaved: 'Saved at', needSession: 'A real User ID + Session ID is required before calculating/saving.',
    tabs: { basic: 'Basic', scientific: 'Scientific', solver: 'Equation Solver', finance: 'Finance', unit: 'Unit Converter', game: 'Game Converter', settings: 'Settings' },
    basicTitle: 'Basic calculator', operation: 'Operation', firstNumber: 'First number', secondNumber: 'Second number', firstPlaceholder: 'Enter first number...', secondPlaceholder: 'Enter second number...', calculate: 'Calculate',
    add: 'Add', subtract: 'Subtract', multiply: 'Multiply', divide: 'Divide', percentOf: 'Percent of', power: 'Power', sqrt: 'Square root',
    scientificTitle: 'Scientific calculator', angleMode: 'Angle mode', degree: 'Degree', radian: 'Radian', value: 'Value',
    solverTitle: 'Automatic solver', solverHint: 'Linear uses first 2 fields. Quadratic uses first 3 fields. 2-variable system uses 6 fields: a,b,c,d,e,f.', solve: 'Solve', linear: 'ax + b = 0', quadratic: 'ax² + bx + c = 0', system2: '2-variable system',
    financeTitle: 'Money / life tools', discount: 'Discount', profitLoss: 'Profit / loss', simpleInterest: 'Simple interest', compoundInterest: 'Compound interest', installment: 'Installment',
    unitTitle: 'Unit converter', category: 'Category', from: 'From', to: 'To', convert: 'Convert',
    gameTitle: 'Game converter', gameHint: 'Choose a game, enter an amount, and convert using saved rate rows.', amountVnd: 'Amount VND', addRealRate: 'Add real rate', saveRate: 'Save rate to DB', loadRates: 'Load rates', verifiedNote: 'Verification note', source: 'Source', currency: 'Currency amount', bonus: 'Bonus',
    settingsTitle: 'VIP settings', saveSettings: 'Save settings to DB', theme: 'Theme',
    result: 'Result', noResult: 'No result yet.', refreshHistory: 'Refresh history', historyDb: 'DB history', footer: 'Ultimate Math Engine • Calculator, converter, and session management tool.',
    musicNow: 'Background music', playMusic: 'Play music', pauseMusic: 'Pause music', volumeDown: 'Volume down', volumeUp: 'Volume up',
    adminLock: 'Web edit lock', adminKey: 'Admin key', unlockHint: 'Only the key holder can change the global background and music.', unlock: 'Unlock', saveSite: 'Save site media', backgroundUrl: 'Background image URL', musicUrl: 'Music URL', musicTitle: 'Music title', enableMusic: 'Enable site music',
    musicRequestTitle: 'Request music change', requesterName: 'Requester name', songTitle: 'Song title', note: 'Note', sendRequest: 'Send music request', approvalBoard: 'Music request approval board', loadRequests: 'Load requests', approve: 'Approve', reject: 'Reject', applyMusic: 'Approve & apply', noRequests: 'No requests yet.'
  },
  zh: {
    appBadge: '真实数据计算系统',
    subtitle: '',
    openHelp: 'A-Z 指南 • 政策 • QRT • 介绍', helpTitle: '指南与信息中心', guideTab: 'A-Z 指南', policyTab: '政策', qrtTab: 'QRT', aboutTab: '介绍', close: '关闭',
    realData: '真实数据', serverAutosave: '服务器自动保存', dbOnly: '仅使用数据库', accuracy: '≥99%',
    language: '语言', vietnamese: 'Tiếng Việt', english: 'English', chinese: '中文',
    connectionTitle: '真实数据连接', createUser: '创建真实用户', loadSession: '从数据库加载会话', userId: '用户 ID', sessionId: '会话 ID',
    userPlaceholder: '输入 User ID...', sessionPlaceholder: '输入 Session ID...',
    dbReady: '系统已就绪。', dbMissing: '数据库连接尚未配置。',
    initialStatus: '已就绪。', guestCreated: '会话已创建。', sessionLoaded: '会话已加载。', autosaved: '保存于', needSession: '计算/保存前需要真实 User ID + Session ID。',
    tabs: { basic: '基础', scientific: '科学', solver: '方程求解', finance: '财务', unit: '单位转换', game: '游戏换算', settings: '设置' },
    basicTitle: '基础计算器', operation: '运算', firstNumber: '第一个数', secondNumber: '第二个数', firstPlaceholder: '输入第一个数...', secondPlaceholder: '输入第二个数...', calculate: '计算结果',
    add: '加', subtract: '减', multiply: '乘', divide: '除', percentOf: '百分比', power: '幂', sqrt: '平方根',
    scientificTitle: '科学计算器', angleMode: '角度模式', degree: '角度', radian: '弧度', value: '数值',
    solverTitle: '自动解题', solverHint: '一次方程使用前 2 个输入。二次方程使用前 3 个输入。二元方程组使用 6 个输入：a,b,c,d,e,f。', solve: '求解', linear: 'ax + b = 0', quadratic: 'ax² + bx + c = 0', system2: '二元方程组',
    financeTitle: '金钱 / 生活工具', discount: '折扣', profitLoss: '盈亏', simpleInterest: '单利', compoundInterest: '复利', installment: '分期付款',
    unitTitle: '单位转换', category: '类别', from: '从', to: '到', convert: '转换',
    gameTitle: '游戏换算', gameHint: '选择游戏、输入金额，并使用已保存的汇率进行换算。', amountVnd: '金额 VND', addRealRate: '添加真实汇率', saveRate: '保存汇率到数据库', loadRates: '加载汇率', verifiedNote: '验证备注', source: '来源', currency: '货币数量', bonus: '额外奖励',
    settingsTitle: 'VIP 设置', saveSettings: '保存设置到数据库', theme: '主题',
    result: '结果', noResult: '暂无结果。', refreshHistory: '刷新历史', historyDb: '数据库历史', footer: 'Ultimate Math Engine • 计算、换算与会话管理工具。',
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

const helpContent: Record<Lang, Record<HelpSection, { title: string; items: string[] }>> = {
  vi: {
    guide: {
      title: 'Hướng dẫn sử dụng từ A-Z',
      items: [
        'Bấm “Tạo user thật” để tạo phiên sử dụng. Khi có User ID và Session ID, các thao tác tính toán/lưu cài đặt sẽ đi qua hệ thống máy chủ.',
        'Chọn module cần dùng ở thanh tab: Cơ Bản, Khoa Học, Giải PT, Tài Chính, Đổi Đơn Vị, Quy Đổi Game hoặc Cài Đặt.',
        'Nhập số liệu vào biểu mẫu, bấm “Tính kết quả” hoặc “Đổi”. Kết quả sẽ hiện ở khung bên phải, lịch sử nằm trong mục Lịch sử.',
        'Tab Quy Đổi Game dùng bảng tỷ giá đã lưu. Muốn quy đổi KC/QH/NAS/NT chuẩn, hãy nhập gói nạp/thẻ đã xác minh trước.',
        'Tab Cài Đặt cho phép đổi ngôn ngữ, bật/tắt nhạc, chỉnh âm lượng, gửi yêu cầu đổi nhạc và quản trị ảnh nền/nhạc nếu có key.',
        'Nút “Tải phiên từ CSDL” dùng khi muốn mở lại đúng phiên đã tạo trước đó bằng User ID và Session ID.'
      ]
    },
    policy: {
      title: 'Chính sách sử dụng',
      items: [
        'Kết quả tính toán phụ thuộc vào số liệu người dùng nhập và công thức của từng module.',
        'Các công cụ tài chính chỉ phục vụ tham khảo, không thay thế tư vấn tài chính, pháp lý hoặc quyết định mua bán thật.',
        'Tỷ giá game phải được cập nhật từ nguồn hợp lệ. Nếu nhà phát hành đổi giá/gói nạp, người quản trị cần cập nhật lại bảng tỷ giá.',
        'Không nhập mật khẩu, mã OTP, khóa ngân hàng hoặc dữ liệu nhạy cảm vào các ô ghi chú/yêu cầu.',
        'Người dùng gửi yêu cầu đổi nhạc phải dùng link hợp lệ và chịu trách nhiệm về nội dung/link đã gửi.'
      ]
    },
    qrt: {
      title: 'QRT — Quyền riêng tư & trách nhiệm',
      items: [
        'Dữ liệu phiên, lịch sử tính toán, tỷ giá game, cài đặt giao diện và yêu cầu đổi nhạc được lưu theo cấu trúc của hệ thống.',
        'Key quản trị chỉ dùng để chỉnh ảnh nền, nhạc nền và duyệt yêu cầu. Không chia sẻ key cho người khác.',
        'Người quản trị chịu trách nhiệm kiểm tra link nhạc/ảnh trước khi phê duyệt hoặc áp dụng lên web.',
        'Hệ thống không tự xác minh giá game theo thời gian thực; độ đúng của quy đổi game phụ thuộc bảng tỷ giá hiện đang lưu.',
        'Khi phát hiện dữ liệu sai, link lỗi hoặc nội dung không phù hợp, hãy cập nhật/xóa trong phần quản trị.'
      ]
    },
    about: {
      title: 'Giới thiệu Ultimate Math Engine',
      items: [
        'Ultimate Math Engine là web tính toán đa năng: máy tính cơ bản, khoa học, giải phương trình, tài chính, đổi đơn vị và quy đổi game.',
        'Web được thiết kế theo phong cách neon, hỗ trợ tiếng Việt, tiếng Anh và tiếng Trung.',
        'Mục tiêu của web là gom nhiều công cụ tính toán thường dùng vào một nơi, giao diện dễ dùng và có thể mở rộng thêm module sau này.',
        'Bản hiện tại có hệ thống nhạc nền, yêu cầu đổi nhạc, bảng duyệt yêu cầu và khóa quản trị cho ảnh nền/nhạc chung.'
      ]
    }
  },
  en: {
    guide: {
      title: 'A-Z user guide',
      items: [
        'Click “Create real user” to create a session. After you have a User ID and Session ID, calculations and settings can be saved through the server.',
        'Choose a module from the tabs: Basic, Scientific, Equation Solver, Finance, Unit Converter, Game Converter, or Settings.',
        'Enter values, then click “Calculate” or “Convert”. Results appear on the right and history appears in the History panel.',
        'Game Converter uses saved rate rows. For accurate KC/QH/NAS/NT conversion, add verified top-up/card packages first.',
        'Settings lets you change language, play/pause music, adjust volume, submit music requests, and edit global background/music with the admin key.',
        'Use “Load session from DB” when you want to reopen a previous session with its User ID and Session ID.'
      ]
    },
    policy: {
      title: 'Usage policies',
      items: [
        'Calculation results depend on the values entered by the user and each module formula.',
        'Finance tools are for reference only and do not replace financial, legal, or purchasing advice.',
        'Game rates must be updated from valid sources. If publishers change prices/packages, the admin must update the rate table.',
        'Do not enter passwords, OTP codes, banking keys, or sensitive information into notes or request fields.',
        'Music request senders are responsible for submitting valid links and appropriate content.'
      ]
    },
    qrt: {
      title: 'QRT — Privacy & responsibility',
      items: [
        'Sessions, calculation history, game rates, UI settings, and music requests are saved according to the system structure.',
        'The admin key is only for background/music management and request approval. Do not share it.',
        'Admins are responsible for checking music/image links before approval or publishing.',
        'The system does not verify game prices in real time; game conversion accuracy depends on the currently saved rate table.',
        'When incorrect data, broken links, or unsuitable content are found, update or remove them in the admin area.'
      ]
    },
    about: {
      title: 'About Ultimate Math Engine',
      items: [
        'Ultimate Math Engine is a multi-tool calculator web app: basic calculator, scientific calculator, equation solver, finance tools, unit converter, and game converter.',
        'The web app uses a neon interface and supports Vietnamese, English, and Chinese.',
        'Its goal is to collect common calculation tools in one place with a clear interface and room for future modules.',
        'The current version includes background music, music change requests, request approval, and admin-locked background/music controls.'
      ]
    }
  },
  zh: {
    guide: {
      title: 'A-Z 使用指南',
      items: [
        '点击“创建真实用户”创建会话。获得 User ID 和 Session ID 后，计算与设置可以通过服务器保存。',
        '从标签栏选择模块：基础、科学、方程求解、财务、单位转换、游戏换算或设置。',
        '输入数值后点击“计算”或“转换”。结果显示在右侧，历史记录显示在历史面板。',
        '游戏换算使用已保存的汇率行。若要准确换算 KC/QH/NAS/NT，请先添加已验证的充值/卡券套餐。',
        '设置页面可切换语言、播放/暂停音乐、调整音量、提交换歌申请，并可使用管理密钥修改全站背景/音乐。',
        '若要重新打开之前的会话，请使用 User ID 和 Session ID 点击“从数据库加载会话”。'
      ]
    },
    policy: {
      title: '使用政策',
      items: [
        '计算结果取决于用户输入的数据以及各模块公式。',
        '财务工具仅供参考，不能替代财务、法律或真实交易建议。',
        '游戏汇率必须来自有效来源。若发行商更改价格/套餐，管理员需要更新汇率表。',
        '请勿在备注或申请栏输入密码、OTP、银行密钥或敏感信息。',
        '提交换歌申请的用户需对链接有效性与内容负责。'
      ]
    },
    qrt: {
      title: 'QRT — 隐私与责任',
      items: [
        '会话、计算历史、游戏汇率、界面设置和换歌申请会按系统结构保存。',
        '管理密钥仅用于背景/音乐管理和申请审核，请勿分享。',
        '管理员在批准或发布前需要检查音乐/图片链接。',
        '系统不会实时验证游戏价格；游戏换算准确度取决于当前保存的汇率表。',
        '发现错误数据、失效链接或不合适内容时，请在管理区更新或删除。'
      ]
    },
    about: {
      title: '关于 Ultimate Math Engine',
      items: [
        'Ultimate Math Engine 是一个多功能计算网站：基础计算器、科学计算器、方程求解、财务工具、单位转换和游戏换算。',
        '网站采用霓虹风格界面，支持越南语、英语和中文。',
        '目标是把常用计算工具集中在一个地方，界面清晰，并能继续扩展新模块。',
        '当前版本包含背景音乐、换歌申请、申请审核，以及受管理密钥保护的背景/音乐控制。'
      ]
    }
  }
};

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSection, setHelpSection] = useState<HelpSection>('guide');

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
          <div className="heroActions">
            <button className="primary helpButton" onClick={() => setHelpOpen(true)}>📘 {tr.openHelp}</button>
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

      {helpOpen && (
        <section className="modalOverlay" role="dialog" aria-modal="true" aria-label={tr.helpTitle}>
          <div className="helpModal panel neonPanel">
            <div className="helpHeader">
              <div>
                <p className="eyebrow">{tr.helpTitle}</p>
                <h2>{helpContent[lang][helpSection].title}</h2>
              </div>
              <button className="closeButton" onClick={() => setHelpOpen(false)}>× {tr.close}</button>
            </div>

            <div className="helpTabs">
              {(['guide', 'policy', 'qrt', 'about'] as HelpSection[]).map((section) => (
                <button
                  key={section}
                  className={helpSection === section ? 'active' : ''}
                  onClick={() => setHelpSection(section)}
                >
                  {section === 'guide' ? tr.guideTab : section === 'policy' ? tr.policyTab : section === 'qrt' ? tr.qrtTab : tr.aboutTab}
                </button>
              ))}
            </div>

            <div className="helpBody">
              <ol>
                {helpContent[lang][helpSection].items.map((item, index) => (
                  <li key={`${helpSection}-${index}`}>{item}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

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
