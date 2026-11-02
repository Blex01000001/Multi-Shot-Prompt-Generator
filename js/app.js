// ---------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------
const I18N = {
  en: {
    docTitle: 'MiniMax H3 Multi-Shot Prompt Generator',
    title: 'MiniMax H3 Multi-Shot Prompt Generator',
    subtitle: 'Structured AI video prompts & multi-shot storyboard tool',
    reset: 'Reset',
    badge: 'MiniMax H3 compatible',
    language: 'Language',
    seqTitle: 'Shot Sequence',
    seqDesc: 'Manage the number of shots and the timestamp step',
    totalShots: 'Total shots',
    exportedCount: '({n} in output)',
    addShot: 'Add Shot',
    timeStepLabel: 'Default time step for new shots',
    sec: 'sec',
    autoFormat: 'Auto formatting',
    autoPeriodLabel: 'Append a period (.) to the end of each shot',
    addShotBottom: 'Add the next shot to the sequence',
    audioTitle: 'Soundscape & Music',
    soundscapeHint: '(ambient sound)',
    musicHint: '(background music)',
    previewTitle: 'Live Output (Preview)',
    copy: 'Copy Prompt',
    copied: 'Copied!',
    comfyNote: 'Paste directly into a ComfyUI MiniMax H3 workflow',
    chars: '{n} chars',
    tagsTitle: 'Common AI Video Prompt Tags',
    tagsHint: 'Click to insert into the current shot',
    toastCopied: 'Full prompt copied to clipboard!',
    toastReset: 'Reset to the default sample!',
    toastChip: 'Tag inserted into the selected shot card',
    moveUp: 'Move up',
    moveDown: 'Move down',
    duplicate: 'Duplicate shot',
    delete: 'Delete shot',
    adjustMinus: 'Subtract {n} ms',
    adjustPlus: 'Add {n} ms',
    placeholder: 'Describe on-screen motion, body movement, camera work or facial expression...',
    skipped: 'Empty shot — it will be skipped in the output',
    tsInvalid: 'Invalid timestamp — use MM:SS.mmm (e.g. 00:01.500)',
    tsOrder: 'Must be later than the previous shot ({prev} at {ts})',
    tsSummary: '{n} timestamp issue(s) — check the highlighted shots',
    manageTags: 'Manage',
    searchTags: 'Search tags...',
    manageTitle: 'Manage Prompt Tags',
    close: 'Close',
    tagTextLabel: 'Prompt text (English)',
    tagTextPlaceholder: 'e.g. camera slowly pulls back',
    tagNoteLabel: 'Note (optional, shown as tooltip)',
    tagNotePlaceholder: 'e.g. slow dolly out',
    add: 'Add',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    deleteTag: 'Delete tag',
    confirmDelete: 'Delete?',
    exportJson: 'Export JSON',
    importJson: 'Import JSON',
    restoreDefaults: 'Restore defaults',
    tagCount: '{n} tags',
    noTags: 'No tags yet. Click “Manage” to add your own.',
    noTagsMatch: 'No tags match your search.',
    tagEmptyError: 'Prompt text cannot be empty.',
    tagDuplicateError: 'This tag already exists.',
    toastTagAdded: 'Tag added',
    toastTagUpdated: 'Tag updated',
    toastTagDeleted: 'Tag deleted',
    toastExported: 'Tags exported as JSON',
    toastImported: 'Imported {added} tag(s), skipped {skipped} duplicate(s)',
    toastImportFail: 'Import failed: not a valid tag JSON file',
    confirmRestore: 'Replace all your tags with the default set? Export a backup first if you want to keep them.',
    toastRestored: 'Default tags restored',
    dragHandle: 'Drag to reorder',
    toastSelectCopy: 'The browser blocked copying. The prompt is selected — press Ctrl+C (⌘C on Mac).',
  },
  'zh-Hant': {
    docTitle: 'MiniMax H3 多鏡頭提示詞產生器',
    title: 'MiniMax H3 多鏡頭提示詞產生器',
    subtitle: '結構化 AI 影片 Prompt 與多鏡頭分鏡腳本工具',
    reset: '重置範例',
    badge: '支援 MiniMax H3 規範',
    language: '語言',
    seqTitle: '鏡頭序列設定',
    seqDesc: '管理多鏡頭數量與時間戳記遞增間隔',
    totalShots: '總鏡頭數',
    exportedCount: '（輸出 {n} 個）',
    addShot: '新增 Shot',
    timeStepLabel: '新增鏡頭預設時間間隔',
    sec: '秒',
    autoFormat: '自動格式優化',
    autoPeriodLabel: '自動在每個 Shot 結尾補上句號 (.)',
    addShotBottom: '新增下一個 Shot 到序列',
    audioTitle: '聲音與音樂設定 (Soundscape & Music)',
    soundscapeHint: '(環境音效)',
    musicHint: '(背景音樂)',
    previewTitle: '即時整合輸出 (Preview)',
    copy: '複製 Prompt',
    copied: '已複製！',
    comfyNote: '可直接貼入 ComfyUI MiniMax H3 工作流',
    chars: '{n} 字元',
    tagsTitle: '常用 AI 影片提示詞標籤',
    tagsHint: '點擊自動插入至當前 Shot',
    toastCopied: '已複製完整的 Prompt 至剪貼簿！',
    toastReset: '已重置為預設範例！',
    toastChip: '已插入提示詞至目前選取的 Shot 卡片',
    moveUp: '向上移',
    moveDown: '向下移',
    duplicate: '複製 Shot',
    delete: '刪除 Shot',
    adjustMinus: '減少 {n} 毫秒',
    adjustPlus: '增加 {n} 毫秒',
    placeholder: '輸入畫面動態、肢體動作、運鏡或表情描述...',
    skipped: '空白鏡頭，輸出時會自動略過',
    tsInvalid: '時間戳記格式錯誤，請使用 MM:SS.mmm（例如 00:01.500）',
    tsOrder: '必須晚於上一個鏡頭（{prev} 為 {ts}）',
    tsSummary: '有 {n} 個時間戳記問題，請檢查標示紅色的鏡頭',
    manageTags: '管理',
    searchTags: '搜尋標籤...',
    manageTitle: '管理提示詞標籤',
    close: '關閉',
    tagTextLabel: '提示詞內容（英文）',
    tagTextPlaceholder: '例如：camera slowly pulls back',
    tagNoteLabel: '說明（選填，滑鼠移上時顯示）',
    tagNotePlaceholder: '例如：鏡頭緩慢拉遠',
    add: '新增',
    edit: '編輯',
    save: '儲存',
    cancel: '取消',
    deleteTag: '刪除標籤',
    confirmDelete: '確定刪除？',
    exportJson: '匯出 JSON',
    importJson: '匯入 JSON',
    restoreDefaults: '恢復預設標籤',
    tagCount: '共 {n} 個',
    noTags: '目前沒有標籤，點「管理」新增自己的標籤。',
    noTagsMatch: '找不到符合的標籤。',
    tagEmptyError: '提示詞內容不能空白。',
    tagDuplicateError: '這個標籤已經存在。',
    toastTagAdded: '已新增標籤',
    toastTagUpdated: '已更新標籤',
    toastTagDeleted: '已刪除標籤',
    toastExported: '已匯出標籤 JSON 檔',
    toastImported: '已匯入 {added} 個標籤，略過 {skipped} 個重複',
    toastImportFail: '匯入失敗：不是有效的標籤 JSON 檔',
    confirmRestore: '要用預設標籤取代目前所有標籤嗎？如果想保留，請先匯出備份。',
    toastRestored: '已恢復預設標籤',
    dragHandle: '拖曳以調整順序',
    toastSelectCopy: '瀏覽器阻擋了複製，已幫你選取 Prompt，請按 Ctrl+C（Mac 為 ⌘C）。',
  },
  ja: {
    docTitle: 'MiniMax H3 マルチショット プロンプトジェネレーター',
    title: 'MiniMax H3 マルチショット プロンプトジェネレーター',
    subtitle: '構造化 AI 動画プロンプト＆マルチショット絵コンテツール',
    reset: 'リセット',
    badge: 'MiniMax H3 対応',
    language: '言語',
    seqTitle: 'ショットシーケンス',
    seqDesc: 'ショット数とタイムスタンプの間隔を管理',
    totalShots: '総ショット数',
    exportedCount: '（出力 {n} 件）',
    addShot: 'ショット追加',
    timeStepLabel: '新規ショットのデフォルト間隔',
    sec: '秒',
    autoFormat: '自動フォーマット',
    autoPeriodLabel: '各ショットの末尾にピリオド (.) を自動追加',
    addShotBottom: '次のショットをシーケンスに追加',
    audioTitle: 'サウンド＆音楽設定',
    soundscapeHint: '(環境音)',
    musicHint: '(BGM)',
    previewTitle: 'リアルタイム出力 (Preview)',
    copy: 'プロンプトをコピー',
    copied: 'コピーしました！',
    comfyNote: 'ComfyUI の MiniMax H3 ワークフローにそのまま貼り付け可能',
    chars: '{n} 文字',
    tagsTitle: 'よく使う AI 動画プロンプトタグ',
    tagsHint: 'クリックで現在のショットに挿入',
    toastCopied: 'プロンプト全体をクリップボードにコピーしました！',
    toastReset: 'デフォルトのサンプルにリセットしました！',
    toastChip: '選択中のショットカードにタグを挿入しました',
    moveUp: '上へ移動',
    moveDown: '下へ移動',
    duplicate: 'ショットを複製',
    delete: 'ショットを削除',
    adjustMinus: '{n} ミリ秒減らす',
    adjustPlus: '{n} ミリ秒増やす',
    placeholder: '画面の動き、身体の動作、カメラワーク、表情などを入力...',
    skipped: '空欄のショットは出力時にスキップされます',
    tsInvalid: 'タイムスタンプの形式が不正です。MM:SS.mmm（例：00:01.500）で入力してください',
    tsOrder: '前のショット（{prev}：{ts}）より後の時刻にしてください',
    tsSummary: 'タイムスタンプの問題が {n} 件あります。赤く表示されたショットを確認してください',
    manageTags: '管理',
    searchTags: 'タグを検索...',
    manageTitle: 'プロンプトタグの管理',
    close: '閉じる',
    tagTextLabel: 'プロンプト（英語）',
    tagTextPlaceholder: '例：camera slowly pulls back',
    tagNoteLabel: 'メモ（任意・ツールチップに表示）',
    tagNotePlaceholder: '例：カメラがゆっくり引く',
    add: '追加',
    edit: '編集',
    save: '保存',
    cancel: 'キャンセル',
    deleteTag: 'タグを削除',
    confirmDelete: '削除しますか？',
    exportJson: 'JSON をエクスポート',
    importJson: 'JSON をインポート',
    restoreDefaults: 'デフォルトに戻す',
    tagCount: '{n} 件',
    noTags: 'タグがありません。「管理」から追加してください。',
    noTagsMatch: '一致するタグがありません。',
    tagEmptyError: 'プロンプトを入力してください。',
    tagDuplicateError: 'このタグは既に存在します。',
    toastTagAdded: 'タグを追加しました',
    toastTagUpdated: 'タグを更新しました',
    toastTagDeleted: 'タグを削除しました',
    toastExported: 'タグを JSON でエクスポートしました',
    toastImported: '{added} 件をインポート、重複 {skipped} 件をスキップしました',
    toastImportFail: 'インポート失敗：有効なタグ JSON ファイルではありません',
    confirmRestore: 'すべてのタグをデフォルトに置き換えますか？残したい場合は先にエクスポートしてください。',
    toastRestored: 'デフォルトのタグに戻しました',
    dragHandle: 'ドラッグで並べ替え',
    toastSelectCopy: 'ブラウザがコピーをブロックしました。プロンプトを選択したので Ctrl+C（Mac は ⌘C）を押してください。',
  },
};

const SUPPORTED_LANGS = ['en', 'zh-Hant', 'ja'];
const LANG_STORAGE_KEY = 'msp-lang';

function loadLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(saved)) return saved;
  } catch (e) { /* storage unavailable */ }
  return 'en';
}

function saveLang(lang) {
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) { /* ignore */ }
}

let currentLang = loadLang();

function t(key, vars = {}) {
  const dict = I18N[currentLang] || I18N.en;
  let str = dict[key] ?? I18N.en[key] ?? key;
  Object.keys(vars).forEach(k => {
    str = str.replaceAll(`{${k}}`, vars[k]);
  });
  return str;
}

// ---------------------------------------------------------------------
// Prompt tags (user-managed, stored in localStorage)
// The tag text is sent to the model (always English). The tooltip shows
// the user's own `note`, or for built-in tags the translation in `notes`.
// ---------------------------------------------------------------------
const DEFAULT_TAGS = [
  { text: 'pouting with flushed cheeks', notes: { 'zh-Hant': '傲嬌鼓嘴臉紅', ja: '頬を赤らめてふくれっ面' } },
  { text: 'looking back over her shoulder', notes: { 'zh-Hant': '轉頭回眸看', ja: '肩越しに振り返る' } },
  { text: 'camera slowly pushes in', notes: { 'zh-Hant': '鏡頭緩慢推進', ja: 'カメラがゆっくり寄る' } },
  { text: 'smoothly orbits around to her back', notes: { 'zh-Hant': '平滑環繞到身後', ja: '背後へ滑らかに回り込む' } },
  { text: 'panting and breathing rapidly', notes: { 'zh-Hant': '喘氣急促呼吸', ja: '息を切らして荒く呼吸する' } },
  { text: 'winks shyly with one eye closed', notes: { 'zh-Hant': '害羞閉單眼', ja: '恥ずかしそうに片目をつぶる' } },
  { text: 'viscous clear liquid slowly drips', notes: { 'zh-Hant': '黏稠透明液體緩慢滴落', ja: '粘り気のある透明な液体がゆっくり滴る' } },
  { text: 'stretches into thin strands', notes: { 'zh-Hant': '拉成細絲狀', ja: '細い糸状に伸びる' } },
  { text: 'low-angle shot looking up', notes: { 'zh-Hant': '仰角向上拍攝', ja: 'ローアングルで見上げる' } },
  { text: 'lifting skirt and swaying back and forth', notes: { 'zh-Hant': '拉起裙襬搖擺', ja: 'スカートを持ち上げて左右に揺れる' } },
];

const TAGS_STORAGE_KEY = 'msp-tags';
const TAGS_EXPORT_TYPE = 'minimax-h3-prompt-tags';

function makeTagId() {
  return 'tag-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Normalise anything tag-like into { id, text, note, notes? }; null if unusable.
function normalizeTag(raw) {
  if (typeof raw === 'string') raw = { text: raw };
  if (!raw || typeof raw !== 'object' || typeof raw.text !== 'string') return null;
  const text = raw.text.trim();
  if (!text) return null;
  const tag = { id: makeTagId(), text, note: typeof raw.note === 'string' ? raw.note.trim() : '' };
  if (raw.notes && typeof raw.notes === 'object') {
    const notes = {};
    SUPPORTED_LANGS.forEach(lang => {
      if (typeof raw.notes[lang] === 'string' && raw.notes[lang].trim()) notes[lang] = raw.notes[lang].trim();
    });
    if (Object.keys(notes).length) tag.notes = notes;
  }
  return tag;
}

function defaultTags() {
  return DEFAULT_TAGS.map(normalizeTag);
}

function loadTags() {
  try {
    const raw = localStorage.getItem(TAGS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeTag).filter(Boolean);
    }
  } catch (e) { /* storage unavailable or corrupted: fall back to defaults */ }
  return defaultTags();
}

function saveTags() {
  try {
    const data = state.tags.map(({ text, note, notes }) => (notes ? { text, note, notes } : { text, note }));
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

function tagTooltip(tag) {
  return tag.note || (tag.notes && tag.notes[currentLang]) || '';
}

function tagKey(text) {
  return text.trim().toLowerCase();
}

function tagMatches(tag, query) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [tag.text, tag.note, ...(tag.notes ? Object.values(tag.notes) : [])].join(' ').toLowerCase();
  return haystack.includes(q);
}

const TIME_STEPS = [0.8, 1, 1.5, 2, 3];

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
// Default initial sample state (Blank description)
const initialShots = [
  {
    id: 1,
    timestamp: '00:00.000',
    description: ''
  },
  {
    id: 2,
    timestamp: '00:01.000',
    description: ''
  }
];

let nextShotId = 100;

let state = {
  tags: loadTags(),
  shots: JSON.parse(JSON.stringify(initialShots)),
  overallSoundscape: 'N/A',
  nonDiegeticMusic: 'N/A',
  timeStepSec: 1,
  autoPeriod: true,
  activeShotIndex: 0
};

// DOM Elements
const shotsListEl = document.getElementById('shots-list');
const outputPreviewEl = document.getElementById('output-preview');
const shotCountBadgeEl = document.getElementById('shot-count-badge');
const exportedCountEl = document.getElementById('exported-count');
const charCountEl = document.getElementById('char-count');
const soundscapeInput = document.getElementById('soundscape-input');
const musicInput = document.getElementById('music-input');
const timeStepSelect = document.getElementById('time-step-select');
const autoPeriodCheck = document.getElementById('auto-period-check');
const copyBtn = document.getElementById('copy-btn');
const copyText = document.getElementById('copy-text');
const addShotBtn = document.getElementById('add-shot-btn');
const addShotBottomBtn = document.getElementById('add-shot-bottom-btn');
const resetBtn = document.getElementById('reset-btn');
const tsWarningEl = document.getElementById('ts-warning');
const tsWarningTextEl = document.getElementById('ts-warning-text');
const chipsListEl = document.getElementById('chips-list');
const langBtn = document.getElementById('lang-btn');
const langMenu = document.getElementById('lang-menu');
const tagSearchInput = document.getElementById('tag-search');
const manageTagsBtn = document.getElementById('manage-tags-btn');
const tagModal = document.getElementById('tag-modal');
const tagModalBackdrop = document.getElementById('tag-modal-backdrop');
const tagModalClose = document.getElementById('tag-modal-close');
const tagAddForm = document.getElementById('tag-add-form');
const tagAddText = document.getElementById('tag-add-text');
const tagAddNote = document.getElementById('tag-add-note');
const tagAddError = document.getElementById('tag-add-error');
const tagManageSearch = document.getElementById('tag-manage-search');
const tagManageCount = document.getElementById('tag-manage-count');
const tagManageList = document.getElementById('tag-manage-list');
const tagExportBtn = document.getElementById('tag-export-btn');
const tagImportBtn = document.getElementById('tag-import-btn');
const tagImportFile = document.getElementById('tag-import-file');
const tagRestoreBtn = document.getElementById('tag-restore-btn');

let copyResetTimer = null;

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
const TIMESTAMP_RE = /^\d{2}:[0-5]\d\.\d{3}$/;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Format seconds float into MM:SS.mmm timestamp string
function formatTimestamp(totalSeconds) {
  const totalMs = Math.round(totalSeconds * 1000);
  const mins = Math.floor(totalMs / 60000);
  const secs = (totalMs % 60000) / 1000;
  const minsStr = String(mins).padStart(2, '0');
  const secsStr = secs.toFixed(3).padStart(6, '0');
  return `${minsStr}:${secsStr}`;
}

// Parse MM:SS.mmm into total seconds
function parseTimestamp(tsString) {
  try {
    const parts = tsString.trim().split(':');
    if (parts.length === 2) {
      const m = parseFloat(parts[0]) || 0;
      const s = parseFloat(parts[1]) || 0;
      return m * 60 + s;
    }
  } catch (e) {
    console.error('Timestamp parse error', e);
  }
  return 0;
}

function isValidTimestamp(tsString) {
  return TIMESTAMP_RE.test(tsString.trim());
}

// Analyse every shot: output numbering (empty shots are skipped and the
// rest are renumbered) and timestamp errors.
//  - Format is checked for every shot.
//  - Ordering is checked between consecutive exported (non-empty) shots.
function analyzeShots() {
  let outNum = 0;
  let prev = null;
  return state.shots.map(shot => {
    const text = shot.description.trim();
    const ts = shot.timestamp.trim();
    const info = { outNum: null, error: null };

    if (!isValidTimestamp(ts)) {
      info.error = { type: 'invalid' };
    }

    if (text.length === 0) return info;

    outNum += 1;
    info.outNum = outNum;

    if (!info.error) {
      const secs = parseTimestamp(ts);
      if (prev && secs <= prev.secs) {
        info.error = { type: 'order', prevNum: prev.outNum, prevTs: prev.ts };
      }
      prev = { secs, outNum, ts };
    }
    return info;
  });
}

function errorMessage(error) {
  if (!error) return '';
  if (error.type === 'invalid') return t('tsInvalid');
  return t('tsOrder', { prev: `[Shot ${error.prevNum}]`, ts: error.prevTs });
}

// Adjust timestamp in milliseconds
function adjustShotTime(index, deltaMs) {
  const shot = state.shots[index];
  const currentSecs = parseTimestamp(shot.timestamp);
  const newSecs = Math.max(0, currentSecs + deltaMs / 1000);
  shot.timestamp = formatTimestamp(newSecs);
  render();
}

// Reorder Shots
function moveShot(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= state.shots.length) return;
  const temp = state.shots[index];
  state.shots[index] = state.shots[targetIndex];
  state.shots[targetIndex] = temp;
  state.activeShotIndex = targetIndex;
  render();
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
const TS_BOX_BASE = 'ts-box inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs sm:text-sm transition-colors';
const TS_BOX_OK = 'bg-slate-950 border-slate-700/80 focus-within:border-indigo-500';
const TS_BOX_ERR = 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/60';

function adjustButton(index, delta) {
  const positive = delta > 0;
  const color = positive
    ? 'hover:bg-emerald-950/80 text-emerald-300 hover:border-emerald-500/60'
    : 'hover:bg-rose-950/80 text-rose-300 hover:border-rose-500/60';
  const title = positive ? t('adjustPlus', { n: delta }) : t('adjustMinus', { n: Math.abs(delta) });
  const label = `${positive ? '+' : '-'}${Math.abs(delta)}ms`;
  return `<button data-index="${index}" data-delta="${delta}" title="${escapeHtml(title)}" class="time-adjust-btn px-1.5 py-1 text-[11px] sm:text-xs font-mono font-semibold bg-slate-800/80 border border-slate-700/60 ${color} rounded transition-all active:scale-95">${label}</button>`;
}

function render() {
  // 1. Render Shots Cards
  shotsListEl.innerHTML = '';
  state.shots.forEach((shot, index) => {
    const card = document.createElement('div');
    card.dataset.index = index;
    card.className = `shot-card glass-panel rounded-2xl p-5 border transition-all duration-200 ${
      state.activeShotIndex === index
        ? 'border-indigo-500/80 bg-slate-900/90 shadow-md shadow-indigo-500/10'
        : 'border-slate-800 hover:border-slate-700'
    }`;

    card.innerHTML = `
      <div class="pb-3.5 mb-3.5 border-b border-slate-800/80">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <!-- Left: Shot Tag, Timestamp Input, and Fine-tune Buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="drag-handle -ml-2 p-1 text-slate-500 hover:text-indigo-300 cursor-grab active:cursor-grabbing rounded-md transition-colors" title="${escapeHtml(t('dragHandle'))}" aria-label="${escapeHtml(t('dragHandle'))}">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-1.5 7.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-1.5 7.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 16a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/></svg>
            </button>
            <span class="shot-label px-2.5 py-1 rounded-lg border font-mono text-xs sm:text-sm font-bold"></span>

            <label class="${TS_BOX_BASE} ${TS_BOX_OK}">
              <span class="text-slate-500 select-none">At</span>
              <input type="text" data-index="${index}" data-field="timestamp" value="${escapeHtml(shot.timestamp)}"
                size="9" maxlength="9" spellcheck="false" autocomplete="off" inputmode="decimal"
                class="shot-input ts-input bg-transparent p-0 border-0 font-mono text-xs sm:text-sm text-indigo-200 focus:outline-none focus:ring-0">
            </label>

            <!-- Timestamp Fine-tune Buttons (+/- 100ms, +/- 500ms) -->
            <div class="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              ${adjustButton(index, -500)}
              ${adjustButton(index, -100)}
              ${adjustButton(index, 100)}
              ${adjustButton(index, 500)}
            </div>
          </div>

          <!-- Right: Move Up/Down, Duplicate, Delete -->
          <div class="flex items-center gap-0.5">
            <button data-index="${index}" data-dir="-1" class="move-shot-btn p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}" title="${escapeHtml(t('moveUp'))}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
            </button>
            <button data-index="${index}" data-dir="1" class="move-shot-btn p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all ${index === state.shots.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" title="${escapeHtml(t('moveDown'))}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <button data-index="${index}" class="duplicate-shot-btn p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all" title="${escapeHtml(t('duplicate'))}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </button>
            ${state.shots.length > 1 ? `
              <button data-index="${index}" class="delete-shot-btn p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all" title="${escapeHtml(t('delete'))}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Empty shot note -->
        <p class="shot-skip hidden mt-2.5 text-xs sm:text-sm font-medium text-slate-400 flex items-center gap-1.5">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>${escapeHtml(t('skipped'))}</span>
        </p>

        <!-- Timestamp error message -->
        <p class="ts-error hidden mt-2.5 text-xs sm:text-sm font-semibold text-rose-300 flex items-center gap-1.5">
          <svg class="w-4 h-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
          </svg>
          <span class="ts-error-text"></span>
        </p>
      </div>

      <div>
        <textarea data-index="${index}" data-field="description" rows="3" style="min-height: 110px;"
          placeholder="${escapeHtml(t('placeholder'))}"
          class="shot-input w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y font-sans leading-relaxed">${escapeHtml(shot.description)}</textarea>
      </div>
    `;

    shotsListEl.appendChild(card);
  });

  // Update Shot Counter
  shotCountBadgeEl.textContent = state.shots.length;

  // Attach Event Listeners to newly rendered inputs
  attachShotEvents();

  // 2. Labels, validation and live output
  refreshDerived();
}

// Update everything that depends on shot content without rebuilding the
// cards (keeps focus / caret while typing).
function refreshDerived() {
  const analysis = analyzeShots();
  const cards = shotsListEl.querySelectorAll('.shot-card');
  let errorCount = 0;
  let exported = 0;

  cards.forEach((card, index) => {
    const info = analysis[index];
    if (!info) return;

    const label = card.querySelector('.shot-label');
    const skip = card.querySelector('.shot-skip');
    const tsBox = card.querySelector('.ts-box');
    const tsInput = card.querySelector('.ts-input');
    const errEl = card.querySelector('.ts-error');
    const errText = card.querySelector('.ts-error-text');

    if (info.outNum) {
      exported += 1;
      label.textContent = `[Shot ${info.outNum}]`;
      label.className = 'shot-label px-2.5 py-1 rounded-lg border font-mono text-xs sm:text-sm font-bold bg-indigo-500/10 border-indigo-500/30 text-indigo-300';
      skip.classList.add('hidden');
    } else {
      label.textContent = '[Shot –]';
      label.className = 'shot-label px-2.5 py-1 rounded-lg border font-mono text-xs sm:text-sm font-bold bg-slate-800/60 border-slate-700/60 text-slate-400';
      skip.classList.remove('hidden');
    }

    if (info.error) {
      errorCount += 1;
      tsBox.className = `${TS_BOX_BASE} ${TS_BOX_ERR}`;
      tsInput.classList.replace('text-indigo-200', 'text-rose-200');
      tsInput.setAttribute('aria-invalid', 'true');
      errText.textContent = errorMessage(info.error);
      errEl.classList.remove('hidden');
    } else {
      tsBox.className = `${TS_BOX_BASE} ${TS_BOX_OK}`;
      tsInput.classList.replace('text-rose-200', 'text-indigo-200');
      tsInput.removeAttribute('aria-invalid');
      errEl.classList.add('hidden');
    }
  });

  exportedCountEl.textContent = exported === state.shots.length ? '' : t('exportedCount', { n: exported });

  if (errorCount > 0) {
    tsWarningTextEl.textContent = t('tsSummary', { n: errorCount });
    tsWarningEl.classList.remove('hidden');
  } else {
    tsWarningEl.classList.add('hidden');
  }

  const fullPrompt = generateFormattedOutput();
  outputPreviewEl.textContent = fullPrompt;
  charCountEl.textContent = t('chars', { n: fullPrompt.length });
}

// Build Formatted Output String strictly matching requested structure.
// Empty shots are skipped and the remaining shots are renumbered.
function generateFormattedOutput() {
  const parts = [];

  state.shots.forEach(shot => {
    let text = shot.description.trim();
    if (text.length === 0) return;

    // Apply auto-period rule if enabled
    if (state.autoPeriod && !text.endsWith('.')) {
      text += '.';
    }

    // Format: [Shot X] At <timestamp>, <description>
    parts.push(`[Shot ${parts.length + 1}] At ${shot.timestamp.trim()}, ${text}`);
  });

  const descString = parts.join(' ');
  const soundscape = state.overallSoundscape.trim() || 'N/A';
  const music = state.nonDiegeticMusic.trim() || 'N/A';

  return `integrated_multimodal_description: ${descString}\n\noverall_soundscape: ${soundscape}\nnon_diegetic_music: ${music}`;
}

function setActiveShot(index) {
  if (state.activeShotIndex === index) return;
  state.activeShotIndex = index;
  shotsListEl.querySelectorAll('.shot-card').forEach((card, i) => {
    const active = i === index;
    card.classList.toggle('border-indigo-500/80', active);
    card.classList.toggle('bg-slate-900/90', active);
    card.classList.toggle('shadow-md', active);
    card.classList.toggle('shadow-indigo-500/10', active);
    card.classList.toggle('border-slate-800', !active);
    card.classList.toggle('hover:border-slate-700', !active);
  });
}

// Attach Event Listeners to Input Fields inside Dynamic Cards
function attachShotEvents() {
  document.querySelectorAll('.shot-input').forEach(input => {
    input.addEventListener('focus', (e) => {
      setActiveShot(parseInt(e.target.dataset.index));
    });

    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index);
      const field = e.target.dataset.field;
      state.shots[idx][field] = e.target.value;
      refreshDerived();
    });
  });

  // Time Fine-tune Buttons
  document.querySelectorAll('.time-adjust-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      const delta = parseInt(e.currentTarget.dataset.delta);
      adjustShotTime(idx, delta);
    });
  });

  // Move Up / Move Down Buttons
  document.querySelectorAll('.move-shot-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      const dir = parseInt(e.currentTarget.dataset.dir);
      moveShot(idx, dir);
    });
  });

  // Delete Shot Buttons
  document.querySelectorAll('.delete-shot-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      deleteShot(idx);
    });
  });

  // Duplicate Shot Buttons
  document.querySelectorAll('.duplicate-shot-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      duplicateShot(idx);
    });
  });
}

// Add Shot Function
function addShot() {
  let nextTs = '00:00.000';
  if (state.shots.length > 0) {
    const lastTs = state.shots[state.shots.length - 1].timestamp;
    const lastSecs = parseTimestamp(lastTs);
    nextTs = formatTimestamp(lastSecs + state.timeStepSec);
  }

  state.shots.push({
    id: nextShotId++,
    timestamp: nextTs,
    description: ''
  });
  state.activeShotIndex = state.shots.length - 1;
  render();
}

// Delete Shot Function
function deleteShot(index) {
  if (state.shots.length <= 1) return;
  state.shots.splice(index, 1);
  state.activeShotIndex = Math.max(0, index - 1);
  render();
}

// Duplicate Shot Function
function duplicateShot(index) {
  const target = state.shots[index];
  const targetSecs = parseTimestamp(target.timestamp);
  const nextTs = formatTimestamp(targetSecs + state.timeStepSec);

  state.shots.splice(index + 1, 0, {
    id: nextShotId++,
    timestamp: nextTs,
    description: target.description
  });
  state.activeShotIndex = index + 1;
  render();
}

// Copy to Clipboard Handler (async Clipboard API)
async function copyPromptToClipboard() {
  const textToCopy = generateFormattedOutput();

  try {
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error('Clipboard API unavailable');
    }
    await navigator.clipboard.writeText(textToCopy);
  } catch (err) {
    // Fallback: select the preview text so the user can press Ctrl+C / Cmd+C.
    console.warn('Copy failed', err);
    const range = document.createRange();
    range.selectNodeContents(outputPreviewEl);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    showToast(t('toastSelectCopy'));
    return;
  }

  showToast(t('toastCopied'));

  // Visual feedback on button
  copyText.textContent = t('copied');
  copyBtn.classList.remove('from-indigo-600', 'to-purple-600');
  copyBtn.classList.add('bg-emerald-600');

  clearTimeout(copyResetTimer);
  copyResetTimer = setTimeout(() => {
    copyResetTimer = null;
    copyText.textContent = t('copy');
    copyBtn.classList.remove('bg-emerald-600');
    copyBtn.classList.add('from-indigo-600', 'to-purple-600');
  }, 2000);
}

// Toast Notification Display
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  toastMsg.textContent = message;

  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
}

// ---------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------
function renderTimeStepOptions() {
  timeStepSelect.innerHTML = TIME_STEPS.map(step => {
    const selected = step === state.timeStepSec ? ' selected' : '';
    return `<option value="${step}"${selected}>${step.toFixed(1)} ${escapeHtml(t('sec'))} (+${formatTimestamp(step)})</option>`;
  }).join('');
}

function renderChips() {
  const query = tagSearchInput.value;
  const visible = state.tags.filter(tag => tagMatches(tag, query));

  if (visible.length === 0) {
    const msg = state.tags.length === 0 ? t('noTags') : t('noTagsMatch');
    chipsListEl.innerHTML = `<p class="text-xs sm:text-sm text-slate-400 py-1">${escapeHtml(msg)}</p>`;
    return;
  }

  chipsListEl.innerHTML = visible.map(tag => {
    const tip = tagTooltip(tag);
    const titleAttr = tip ? ` title="${escapeHtml(tip)}"` : '';
    return `<button type="button" data-tag-id="${escapeHtml(tag.id)}" class="prompt-chip px-3 py-1.5 text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-slate-200 hover:text-indigo-100 border border-slate-700/60 rounded-lg transition-all"${titleAttr}>${escapeHtml(tag.text)}</button>`;
  }).join('');
}

// ---------------------------------------------------------------------
// Tag manager modal
// ---------------------------------------------------------------------
let editingTagId = null;
let pendingDeleteId = null;

const MODAL_INPUT_CLASS = 'w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const ICON_BTN_CLASS = 'p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-all';

function renderTagManager() {
  const query = tagManageSearch.value;
  const visible = state.tags.filter(tag => tagMatches(tag, query));
  tagManageCount.textContent = t('tagCount', { n: state.tags.length });

  if (visible.length === 0) {
    const msg = state.tags.length === 0 ? t('noTags') : t('noTagsMatch');
    tagManageList.innerHTML = `<li class="text-xs sm:text-sm text-slate-400 py-6 text-center">${escapeHtml(msg)}</li>`;
    return;
  }

  tagManageList.innerHTML = visible.map(tag => {
    const id = escapeHtml(tag.id);
    if (tag.id === editingTagId) {
      return `
        <li data-tag-id="${id}" class="rounded-xl border border-indigo-500/60 bg-slate-950/70 p-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="text" class="tag-edit-text ${MODAL_INPUT_CLASS} font-mono" value="${escapeHtml(tag.text)}" aria-label="${escapeHtml(t('tagTextLabel'))}">
            <input type="text" class="tag-edit-note ${MODAL_INPUT_CLASS}" value="${escapeHtml(tagTooltip(tag))}" placeholder="${escapeHtml(t('tagNotePlaceholder'))}" aria-label="${escapeHtml(t('tagNoteLabel'))}">
          </div>
          <p class="tag-edit-error hidden mt-2 text-xs sm:text-sm font-semibold text-rose-300"></p>
          <div class="mt-2.5 flex justify-end gap-2">
            <button type="button" data-action="cancel" class="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-all">${escapeHtml(t('cancel'))}</button>
            <button type="button" data-action="save" class="px-3 py-1.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all">${escapeHtml(t('save'))}</button>
          </div>
        </li>`;
    }
    const tip = tagTooltip(tag);
    const confirming = tag.id === pendingDeleteId;
    return `
      <li data-tag-id="${id}" class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 px-3 py-2 transition-all">
        <div class="flex-1 min-w-0">
          <p class="font-mono text-xs sm:text-sm text-slate-100 break-words">${escapeHtml(tag.text)}</p>
          ${tip ? `<p class="text-xs sm:text-sm text-slate-400 break-words">${escapeHtml(tip)}</p>` : ''}
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-action="edit" class="${ICON_BTN_CLASS}" title="${escapeHtml(t('edit'))}" aria-label="${escapeHtml(t('edit'))}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          </button>
          ${confirming
            ? `<button type="button" data-action="confirm-delete" class="px-2.5 py-1 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-all">${escapeHtml(t('confirmDelete'))}</button>`
            : `<button type="button" data-action="delete" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all" title="${escapeHtml(t('deleteTag'))}" aria-label="${escapeHtml(t('deleteTag'))}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>`}
        </div>
      </li>`;
  }).join('');

  if (editingTagId) {
    const input = tagManageList.querySelector('.tag-edit-text');
    if (input) input.focus();
  }
}

function refreshTags() {
  saveTags();
  renderChips();
  if (!tagModal.classList.contains('hidden')) renderTagManager();
}

function isDuplicateTag(text, ignoreId = null) {
  const key = tagKey(text);
  return state.tags.some(tag => tag.id !== ignoreId && tagKey(tag.text) === key);
}

function openTagModal() {
  editingTagId = null;
  pendingDeleteId = null;
  tagAddError.classList.add('hidden');
  tagManageSearch.value = '';
  renderTagManager();
  tagModal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  tagAddText.focus();
}

function closeTagModal() {
  tagModal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  editingTagId = null;
  pendingDeleteId = null;
  manageTagsBtn.focus();
}

function showAddError(msg) {
  tagAddError.textContent = msg;
  tagAddError.classList.remove('hidden');
}

tagAddForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = tagAddText.value.trim();
  if (!text) return showAddError(t('tagEmptyError'));
  if (isDuplicateTag(text)) return showAddError(t('tagDuplicateError'));
  state.tags.push({ id: makeTagId(), text, note: tagAddNote.value.trim() });
  tagAddText.value = '';
  tagAddNote.value = '';
  tagAddError.classList.add('hidden');
  refreshTags();
  tagManageList.scrollTop = tagManageList.scrollHeight;
  tagAddText.focus();
  showToast(t('toastTagAdded'));
});

tagAddText.addEventListener('input', () => tagAddError.classList.add('hidden'));

tagManageList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const item = btn.closest('[data-tag-id]');
  const id = item && item.dataset.tagId;
  const tag = state.tags.find(x => x.id === id);
  if (!tag) return;

  switch (btn.dataset.action) {
    case 'edit':
      editingTagId = id;
      pendingDeleteId = null;
      renderTagManager();
      break;
    case 'cancel':
      editingTagId = null;
      renderTagManager();
      break;
    case 'save': {
      const text = item.querySelector('.tag-edit-text').value.trim();
      const note = item.querySelector('.tag-edit-note').value.trim();
      const errEl = item.querySelector('.tag-edit-error');
      const fail = (msg) => { errEl.textContent = msg; errEl.classList.remove('hidden'); };
      if (!text) return fail(t('tagEmptyError'));
      if (isDuplicateTag(text, id)) return fail(t('tagDuplicateError'));
      // Editing the note turns a built-in translated tooltip into the user's own note.
      if (note !== tagTooltip(tag)) {
        tag.note = note;
        delete tag.notes;
      }
      tag.text = text;
      editingTagId = null;
      refreshTags();
      showToast(t('toastTagUpdated'));
      break;
    }
    case 'delete':
      pendingDeleteId = id;
      renderTagManager();
      break;
    case 'confirm-delete':
      state.tags = state.tags.filter(x => x.id !== id);
      pendingDeleteId = null;
      refreshTags();
      showToast(t('toastTagDeleted'));
      break;
  }
});

tagManageList.addEventListener('keydown', (e) => {
  if (!e.target.matches('.tag-edit-text, .tag-edit-note')) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    e.target.closest('li').querySelector('[data-action="save"]').click();
  } else if (e.key === 'Escape') {
    e.stopPropagation();
    editingTagId = null;
    renderTagManager();
  }
});

tagManageSearch.addEventListener('input', () => {
  pendingDeleteId = null;
  renderTagManager();
});

tagSearchInput.addEventListener('input', renderChips);

manageTagsBtn.addEventListener('click', openTagModal);
tagModalClose.addEventListener('click', closeTagModal);
tagModalBackdrop.addEventListener('click', closeTagModal);

// Export: download tags as a JSON backup file
tagExportBtn.addEventListener('click', () => {
  const payload = {
    type: TAGS_EXPORT_TYPE,
    version: 1,
    exportedAt: new Date().toISOString(),
    tags: state.tags.map(({ text, note, notes }) => (notes ? { text, note, notes } : { text, note })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  a.href = url;
  a.download = `minimax-h3-prompt-tags-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(t('toastExported'));
});

// Import: merge tags from a JSON file, skipping duplicates
tagImportBtn.addEventListener('click', () => tagImportFile.click());

tagImportFile.addEventListener('change', async () => {
  const file = tagImportFile.files && tagImportFile.files[0];
  tagImportFile.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.tags) ? data.tags : null);
    if (!list) throw new Error('No tag list found');
    let added = 0;
    let skipped = 0;
    list.forEach(raw => {
      const tag = normalizeTag(raw);
      if (!tag) return;
      if (isDuplicateTag(tag.text)) { skipped += 1; return; }
      state.tags.push(tag);
      added += 1;
    });
    refreshTags();
    showToast(t('toastImported', { added, skipped }));
  } catch (err) {
    console.warn('Import failed', err);
    showToast(t('toastImportFail'));
  }
});

tagRestoreBtn.addEventListener('click', () => {
  if (!window.confirm(t('confirmRestore'))) return;
  state.tags = defaultTags();
  editingTagId = null;
  pendingDeleteId = null;
  refreshTags();
  showToast(t('toastRestored'));
});

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.title = t('docTitle');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  if (!copyResetTimer) copyText.textContent = t('copy');

  document.querySelectorAll('.lang-option').forEach(opt => {
    const active = opt.dataset.lang === currentLang;
    opt.setAttribute('aria-checked', String(active));
    opt.className = `lang-option w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
      active ? 'bg-indigo-600/30 text-indigo-100' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;
  });

  renderTimeStepOptions();
  renderChips();
  if (!tagModal.classList.contains('hidden')) renderTagManager();
  render();
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  saveLang(lang);
  applyLanguage();
}

function toggleLangMenu(open) {
  const show = open ?? langMenu.classList.contains('hidden');
  langMenu.classList.toggle('hidden', !show);
  langBtn.setAttribute('aria-expanded', String(show));
}

langBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleLangMenu();
});

langMenu.addEventListener('click', (e) => {
  const opt = e.target.closest('.lang-option');
  if (!opt) return;
  setLanguage(opt.dataset.lang);
  toggleLangMenu(false);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#lang-wrap')) toggleLangMenu(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  toggleLangMenu(false);
  if (!tagModal.classList.contains('hidden')) closeTagModal();
});

// ---------------------------------------------------------------------
// Global Event Listeners
// ---------------------------------------------------------------------
addShotBtn.addEventListener('click', addShot);
addShotBottomBtn.addEventListener('click', addShot);

resetBtn.addEventListener('click', () => {
  state.shots = JSON.parse(JSON.stringify(initialShots));
  state.overallSoundscape = 'N/A';
  state.nonDiegeticMusic = 'N/A';
  soundscapeInput.value = 'N/A';
  musicInput.value = 'N/A';
  state.activeShotIndex = 0;
  render();
  showToast(t('toastReset'));
});

soundscapeInput.addEventListener('input', (e) => {
  state.overallSoundscape = e.target.value;
  refreshDerived();
});

musicInput.addEventListener('input', (e) => {
  state.nonDiegeticMusic = e.target.value;
  refreshDerived();
});

timeStepSelect.addEventListener('change', (e) => {
  state.timeStepSec = parseFloat(e.target.value);
});

autoPeriodCheck.addEventListener('change', (e) => {
  state.autoPeriod = e.target.checked;
  refreshDerived();
});

copyBtn.addEventListener('click', copyPromptToClipboard);

// Prompt Chips Click Listener (delegated, chips are re-rendered on language change)
chipsListEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.prompt-chip');
  if (!chip) return;
  const textToAppend = chip.textContent.trim();
  const activeShot = state.shots[state.activeShotIndex];

  if (activeShot) {
    if (activeShot.description.length > 0 && !activeShot.description.endsWith(' ')) {
      activeShot.description += ', ';
    }
    activeShot.description += textToAppend;
    render();
    showToast(t('toastChip'));
  }
});

// Drag-and-drop reordering (SortableJS). The up/down buttons keep working
// if the CDN script fails to load.
if (window.Sortable) {
  Sortable.create(shotsListEl, {
    handle: '.drag-handle',
    draggable: '.shot-card',
    animation: 180,
    ghostClass: 'sortable-ghost',
    onEnd: (evt) => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex === newIndex || oldIndex == null || newIndex == null) return;
      const activeId = state.shots[state.activeShotIndex] && state.shots[state.activeShotIndex].id;
      const [moved] = state.shots.splice(oldIndex, 1);
      state.shots.splice(newIndex, 0, moved);
      const activeIdx = state.shots.findIndex(shot => shot.id === activeId);
      state.activeShotIndex = activeIdx >= 0 ? activeIdx : newIndex;
      render();
    },
  });
}

// Initial Launch Render
applyLanguage();
