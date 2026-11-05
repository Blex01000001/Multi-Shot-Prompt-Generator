// =============================================================================
// i18n.js — UI text in English / Traditional Chinese / Japanese
//
// HOW TO ADD OR CHANGE A UI STRING
//   Add one entry to MESSAGES with all three languages side by side:
//     myKey: { en: '...', 'zh-Hant': '...', ja: '...' },
//   Use it with t('myKey') in JS, or data-i18n="myKey" (also data-i18n-title,
//   data-i18n-aria, data-i18n-placeholder) in index.html.
//   `npm test` fails if a language is missing, placeholders like {n} differ
//   between languages, or index.html / js/*.js use a key that does not exist.
//
// Pure data + pure functions; loads in the browser (globals) and in Node
// (module.exports) so it can be unit-tested.
// =============================================================================

const SUPPORTED_LANGS = ['en', 'zh-Hant', 'ja'];
const DEFAULT_LANG = 'en';
const LANG_STORAGE_KEY = 'msp-lang';

const MESSAGES = {
  title: { en: 'MiniMax H3 Multi-Shot Prompt Generator', 'zh-Hant': 'MiniMax H3 多鏡頭提示詞產生器', ja: 'MiniMax H3 マルチショット プロンプトジェネレーター' },
  subtitle: { en: 'Structured AI video prompts & multi-shot storyboard tool', 'zh-Hant': '結構化 AI 影片 Prompt 與多鏡頭分鏡腳本工具', ja: '構造化 AI 動画プロンプト＆マルチショット絵コンテツール' },
  reset: { en: 'Reset', 'zh-Hant': '重置範例', ja: 'リセット' },
  badge: { en: 'MiniMax H3 compatible', 'zh-Hant': '支援 MiniMax H3 規範', ja: 'MiniMax H3 対応' },
  language: { en: 'Language', 'zh-Hant': '語言', ja: '言語' },
  seqTitle: { en: 'Shot Sequence', 'zh-Hant': '鏡頭序列設定', ja: 'ショットシーケンス' },
  seqDesc: { en: 'Manage the shots and the default duration of new shots', 'zh-Hant': '管理多鏡頭與新增鏡頭的預設持續時間', ja: 'ショットと新規ショットのデフォルトの長さを管理' },
  totalShots: { en: 'Total shots', 'zh-Hant': '總鏡頭數', ja: '総ショット数' },
  exportedCount: { en: '({n} in output)', 'zh-Hant': '（輸出 {n} 個）', ja: '（出力 {n} 件）' },
  addShot: { en: 'Add Shot', 'zh-Hant': '新增 Shot', ja: 'ショット追加' },
  timeStepLabel: { en: 'Default duration for new shots', 'zh-Hant': '新增鏡頭預設持續時間', ja: '新規ショットのデフォルトの長さ' },
  sec: { en: 'sec', 'zh-Hant': '秒', ja: '秒' },
  autoFormat: { en: 'Auto formatting', 'zh-Hant': '自動格式優化', ja: '自動フォーマット' },
  autoPeriodLabel: { en: 'Append a period (.) to the end of each shot', 'zh-Hant': '自動在每個 Shot 結尾補上句號 (.)', ja: '各ショットの末尾にピリオド (.) を自動追加' },
  addShotBottom: { en: 'Add the next shot to the sequence', 'zh-Hant': '新增下一個 Shot 到序列', ja: '次のショットをシーケンスに追加' },
  shotsFieldHint: { en: '(shot descriptions)', 'zh-Hant': '(鏡頭描述)', ja: '(ショットの説明)' },
  soundscapePlaceholder: { en: 'e.g. light rain, distant city ambience (N/A if none)', 'zh-Hant': '例如 light rain, distant city ambience（沒有就填 N/A）', ja: '例：light rain, distant city ambience（なければ N/A）' },
  musicPlaceholder: { en: 'e.g. soft piano (N/A if none)', 'zh-Hant': '例如 soft piano（沒有就填 N/A）', ja: '例：soft piano（なければ N/A）' },
  pasteField: { en: 'Paste clipboard text here', 'zh-Hant': '從剪貼簿貼上文字', ja: 'クリップボードのテキストを貼り付け' },
  confirmFieldTitle: { en: 'Replace this text?', 'zh-Hant': '要取代目前的內容嗎？', ja: 'この内容を置き換えますか？' },
  confirmFieldReplace: { en: 'The current text will be replaced by the clipboard text.', 'zh-Hant': '目前的內容將被剪貼簿的文字取代。', ja: '現在の内容は、クリップボードのテキストで置き換えられます。' },
  toastFieldPasted: { en: 'Pasted', 'zh-Hant': '已貼上', ja: '貼り付けました' },
  soundscapeHint: { en: '(ambient sound)', 'zh-Hant': '(環境音效)', ja: '(環境音)' },
  musicHint: { en: '(background music)', 'zh-Hant': '(背景音樂)', ja: '(BGM)' },
  previewTitle: { en: 'Live Output (Preview)', 'zh-Hant': '即時整合輸出 (Preview)', ja: 'リアルタイム出力 (Preview)' },
  copy: { en: 'Copy Prompt', 'zh-Hant': '複製 Prompt', ja: 'プロンプトをコピー' },
  copied: { en: 'Copied!', 'zh-Hant': '已複製！', ja: 'コピーしました！' },
  comfyNote: { en: 'Paste directly into a ComfyUI MiniMax H3 workflow', 'zh-Hant': '可直接貼入 ComfyUI MiniMax H3 工作流', ja: 'ComfyUI の MiniMax H3 ワークフローにそのまま貼り付け可能' },
  tagsTitle: { en: 'Common AI Video Prompt Tags', 'zh-Hant': '常用 AI 影片提示詞標籤', ja: 'よく使う AI 動画プロンプトタグ' },
  tagsHint: { en: 'Click to insert into the current shot', 'zh-Hant': '點擊自動插入至當前 Shot', ja: 'クリックで現在のショットに挿入' },
  toastCopied: { en: 'Full prompt copied to clipboard!', 'zh-Hant': '已複製完整的 Prompt 至剪貼簿！', ja: 'プロンプト全体をクリップボードにコピーしました！' },
  toastReset: { en: 'Reset to the default sample!', 'zh-Hant': '已重置為預設範例！', ja: 'デフォルトのサンプルにリセットしました！' },
  toastChip: { en: 'Tag inserted into the selected shot card', 'zh-Hant': '已插入提示詞至目前選取的 Shot 卡片', ja: '選択中のショットカードにタグを挿入しました' },
  moveUp: { en: 'Move up', 'zh-Hant': '向上移', ja: '上へ移動' },
  moveDown: { en: 'Move down', 'zh-Hant': '向下移', ja: '下へ移動' },
  duplicate: { en: 'Duplicate shot', 'zh-Hant': '複製 Shot', ja: 'ショットを複製' },
  delete: { en: 'Delete shot', 'zh-Hant': '刪除 Shot', ja: 'ショットを削除' },
  adjustMinus: { en: 'Subtract {n} ms', 'zh-Hant': '減少 {n} 毫秒', ja: '{n} ミリ秒減らす' },
  adjustPlus: { en: 'Add {n} ms', 'zh-Hant': '增加 {n} 毫秒', ja: '{n} ミリ秒増やす' },
  placeholder: { en: 'Describe on-screen motion, body movement, camera work or facial expression...', 'zh-Hant': '輸入畫面動態、肢體動作、運鏡或表情描述...', ja: '画面の動き、身体の動作、カメラワーク、表情などを入力...' },
  skipped: { en: 'Empty shot — it will be skipped in the output', 'zh-Hant': '空白鏡頭，輸出時會自動略過', ja: '空欄のショットは出力時にスキップされます' },
  durationLabel: { en: 'Duration of this shot (seconds)', 'zh-Hant': '這個鏡頭的持續時間（秒）', ja: 'このショットの長さ（秒）' },
  startTime: { en: 'Start time in the output (sum of the earlier shots)', 'zh-Hant': '輸出中的開始時間（前面鏡頭持續時間的加總）', ja: '出力での開始時刻（前のショットの長さの合計）' },
  durInvalid: { en: 'Invalid duration — use seconds above 0 (e.g. 1.5)', 'zh-Hant': '持續時間錯誤：請輸入大於 0 的秒數（如 1.5）', ja: '長さが不正です：0 より大きい秒数（例：1.5）' },
  durSummary: { en: '{n} duration issue(s) — check the highlighted shots', 'zh-Hant': '有 {n} 個持續時間問題，請檢查標示紅色的鏡頭', ja: '長さの問題が {n} 件あります。赤く表示されたショットを確認してください' },
  totalDuration: { en: 'Total duration', 'zh-Hant': '總長度', ja: '合計時間' },
  manageTags: { en: 'Manage', 'zh-Hant': '管理', ja: '管理' },
  searchTags: { en: 'Search tags...', 'zh-Hant': '搜尋標籤...', ja: 'タグを検索...' },
  manageTitle: { en: 'Manage Prompt Tags', 'zh-Hant': '管理提示詞標籤', ja: 'プロンプトタグの管理' },
  close: { en: 'Close', 'zh-Hant': '關閉', ja: '閉じる' },
  tagTextLabel: { en: 'Prompt text (English)', 'zh-Hant': '提示詞內容（英文）', ja: 'プロンプト（英語）' },
  tagTextPlaceholder: { en: 'e.g. camera slowly pulls back', 'zh-Hant': '例如：camera slowly pulls back', ja: '例：camera slowly pulls back' },
  tagNoteLabel: { en: 'Note (optional, shown as tooltip)', 'zh-Hant': '說明（選填，滑鼠移上時顯示）', ja: 'メモ（任意・ツールチップに表示）' },
  tagNotePlaceholder: { en: 'e.g. slow dolly out', 'zh-Hant': '例如：鏡頭緩慢拉遠', ja: '例：カメラがゆっくり引く' },
  add: { en: 'Add', 'zh-Hant': '新增', ja: '追加' },
  edit: { en: 'Edit', 'zh-Hant': '編輯', ja: '編集' },
  save: { en: 'Save', 'zh-Hant': '儲存', ja: '保存' },
  cancel: { en: 'Cancel', 'zh-Hant': '取消', ja: 'キャンセル' },
  deleteTag: { en: 'Delete tag', 'zh-Hant': '刪除標籤', ja: 'タグを削除' },
  confirmDelete: { en: 'Delete?', 'zh-Hant': '確定刪除？', ja: '削除しますか？' },
  exportJson: { en: 'Export JSON', 'zh-Hant': '匯出 JSON', ja: 'JSON をエクスポート' },
  importJson: { en: 'Import JSON', 'zh-Hant': '匯入 JSON', ja: 'JSON をインポート' },
  restoreDefaults: { en: 'Restore defaults', 'zh-Hant': '恢復預設標籤', ja: 'デフォルトに戻す' },
  tagCount: { en: '{n} tags', 'zh-Hant': '共 {n} 個', ja: '{n} 件' },
  noTags: { en: 'No tags yet. Click “Manage” to add your own.', 'zh-Hant': '目前沒有標籤，點「管理」新增自己的標籤。', ja: 'タグがありません。「管理」から追加してください。' },
  noTagsMatch: { en: 'No tags match your search.', 'zh-Hant': '找不到符合的標籤。', ja: '一致するタグがありません。' },
  tagEmptyError: { en: 'Prompt text cannot be empty.', 'zh-Hant': '提示詞內容不能空白。', ja: 'プロンプトを入力してください。' },
  tagDuplicateError: { en: 'This tag already exists.', 'zh-Hant': '這個標籤已經存在。', ja: 'このタグは既に存在します。' },
  toastTagAdded: { en: 'Tag added', 'zh-Hant': '已新增標籤', ja: 'タグを追加しました' },
  toastTagUpdated: { en: 'Tag updated', 'zh-Hant': '已更新標籤', ja: 'タグを更新しました' },
  toastTagDeleted: { en: 'Tag deleted', 'zh-Hant': '已刪除標籤', ja: 'タグを削除しました' },
  toastExported: { en: 'Tags exported as JSON', 'zh-Hant': '已匯出標籤 JSON 檔', ja: 'タグを JSON でエクスポートしました' },
  toastImported: { en: 'Imported {added} tag(s), skipped {skipped} duplicate(s)', 'zh-Hant': '已匯入 {added} 個標籤，略過 {skipped} 個重複', ja: '{added} 件をインポート、重複 {skipped} 件をスキップしました' },
  toastImportFail: { en: 'Import failed: not a valid tag JSON file', 'zh-Hant': '匯入失敗：不是有效的標籤 JSON 檔', ja: 'インポート失敗：有効なタグ JSON ファイルではありません' },
  confirmRestoreTitle: { en: 'Restore default tags?', 'zh-Hant': '要恢復預設標籤嗎？', ja: 'デフォルトのタグに戻しますか？' },
  restore: { en: 'Restore', 'zh-Hant': '恢復', ja: '戻す' },
  confirmRestore: { en: 'Replace all your tags with the default set? Export a backup first if you want to keep them.', 'zh-Hant': '要用預設標籤取代目前所有標籤嗎？如果想保留，請先匯出備份。', ja: 'すべてのタグをデフォルトに置き換えますか？残したい場合は先にエクスポートしてください。' },
  toastRestored: { en: 'Default tags restored', 'zh-Hant': '已恢復預設標籤', ja: 'デフォルトのタグに戻しました' },
  dragHandle: { en: 'Drag to reorder', 'zh-Hant': '拖曳以調整順序', ja: 'ドラッグで並べ替え' },
  toastSelectCopy: { en: 'The browser blocked copying. The prompt is selected — press Ctrl+C (⌘C on Mac).', 'zh-Hant': '瀏覽器阻擋了複製，已幫你選取 Prompt，請按 Ctrl+C（Mac 為 ⌘C）。', ja: 'ブラウザがコピーをブロックしました。プロンプトを選択したので Ctrl+C（Mac は ⌘C）を押してください。' },
  pasteBtn: { en: 'Paste prompt from clipboard', 'zh-Hant': '從剪貼簿貼上 Prompt', ja: 'クリップボードからプロンプトを貼り付け' },
  pasteTitle: { en: 'Paste prompt', 'zh-Hant': '貼上 Prompt', ja: 'プロンプトを貼り付け' },
  pasteHint: { en: 'The browser did not allow reading the clipboard. Paste the prompt below (Ctrl+V / ⌘V), then press Import.', 'zh-Hant': '瀏覽器不允許直接讀取剪貼簿。請把 Prompt 貼到下方（Ctrl+V／⌘V），再按「匯入」。', ja: 'ブラウザがクリップボードの読み取りを許可しませんでした。下にプロンプトを貼り付けて（Ctrl+V／⌘V）、「読み込む」を押してください。' },
  pasteImport: { en: 'Import', 'zh-Hant': '匯入', ja: '読み込む' },
  pasteNone: { en: 'No "[Shot N] At MM:SS.mmm" found. Nothing was changed.', 'zh-Hant': '找不到「[Shot N] At MM:SS.mmm」，卡片沒有變更。', ja: '「[Shot N] At MM:SS.mmm」が見つかりません。変更はありません。' },
  storyboardLabel: { en: 'Storyboard (auto-saved in this browser)', 'zh-Hant': '分鏡（自動保存在此瀏覽器）', ja: 'ストーリーボード（このブラウザに自動保存）' },
  toastStoryboardExported: { en: 'Storyboard exported as JSON', 'zh-Hant': '已匯出分鏡 JSON 檔', ja: 'ストーリーボードを JSON でエクスポートしました' },
  toastStoryboardImported: { en: 'Loaded {n} shot(s) from the file', 'zh-Hant': '已從檔案載入 {n} 個鏡頭', ja: 'ファイルから {n} 件のショットを読み込みました' },
  toastStoryboardImportFail: { en: 'Import failed: not a valid storyboard JSON file', 'zh-Hant': '匯入失敗：不是有效的分鏡 JSON 檔', ja: 'インポート失敗：有効なストーリーボード JSON ファイルではありません' },
  confirmReplaceStoryboard: { en: 'The current shots, soundscape and music will be replaced by the imported file.', 'zh-Hant': '目前的鏡頭、環境音效與背景音樂將被匯入的檔案取代。', ja: '現在のショット、環境音、BGM はインポートしたファイルで置き換えられます。' },
  toastPasted: { en: 'Imported {n} shot(s)', 'zh-Hant': '已匯入 {n} 個鏡頭', ja: '{n} 件のショットを読み込みました' },
  pasteShot: { en: 'Paste clipboard text into this shot', 'zh-Hant': '從剪貼簿貼上文字到這個鏡頭', ja: 'クリップボードのテキストをこのショットに貼り付け' },
  pasteShotEmpty: { en: 'The clipboard has no text. Nothing was changed.', 'zh-Hant': '剪貼簿沒有文字，鏡頭沒有變更。', ja: 'クリップボードにテキストがありません。変更はありません。' },
  pasteShotBlocked: { en: 'The browser blocked clipboard access — press Ctrl+V / ⌘V in the text box', 'zh-Hant': '瀏覽器不允許讀取剪貼簿，請在文字框內按 Ctrl+V／⌘V 貼上', ja: 'ブラウザがクリップボードへのアクセスを拒否しました。テキスト欄で Ctrl+V／⌘V を押してください' },
  toastShotPasted: { en: 'Pasted into the shot', 'zh-Hant': '已貼上到鏡頭', ja: 'ショットに貼り付けました' },
  confirmShotTitle: { en: 'Replace this shot\'s text?', 'zh-Hant': '要取代這個鏡頭的描述嗎？', ja: 'このショットの説明を置き換えますか？' },
  confirmShotReplace: { en: 'The current description of this shot will be replaced by the clipboard text.', 'zh-Hant': '這個鏡頭目前的描述將被剪貼簿的文字取代。', ja: 'このショットの現在の説明は、クリップボードのテキストで置き換えられます。' },
  confirmTitle: { en: 'Replace current shots?', 'zh-Hant': '要取代目前的鏡頭嗎？', ja: '現在のショットを置き換えますか？' },
  confirmReplace: { en: 'The current shots, soundscape and music will be replaced by the pasted prompt.', 'zh-Hant': '目前的鏡頭、環境音效與背景音樂將被貼上的 Prompt 取代。', ja: '現在のショット、環境音、BGM は貼り付けたプロンプトで置き換えられます。' },
  pastePlaceholder: { en: 'integrated_multimodal_description: [Shot 1] At 00:00.000, ...', 'zh-Hant': 'integrated_multimodal_description: [Shot 1] At 00:00.000, ...', ja: 'integrated_multimodal_description: [Shot 1] At 00:00.000, ...' },
  replace: { en: 'Replace', 'zh-Hant': '取代', ja: '置き換える' },
};

let currentLang = DEFAULT_LANG;

// Translate `key` into the current language and fill {placeholders} from `vars`.
function t(key, vars = {}) {
  const entry = MESSAGES[key];
  let str = entry ? (entry[currentLang] ?? entry[DEFAULT_LANG]) : key;
  Object.keys(vars).forEach(k => {
    str = str.replaceAll(`{${k}}`, vars[k]);
  });
  return str;
}

function loadLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(saved)) return saved;
  } catch (e) { /* storage unavailable */ }
  return DEFAULT_LANG;
}

function saveLang(lang) {
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) { /* ignore */ }
}

if (typeof module === 'object' && module.exports) {
  module.exports = {
    SUPPORTED_LANGS,
    DEFAULT_LANG,
    MESSAGES,
    t,
    setCurrentLang: (lang) => { currentLang = lang; },
  };
}
