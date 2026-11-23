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
  themeToLight: { en: 'Switch to light theme', 'zh-Hant': '切換為亮色主題', ja: 'ライトテーマに切り替え' },
  themeToDark: { en: 'Switch to dark theme', 'zh-Hant': '切換為暗色主題', ja: 'ダークテーマに切り替え' },
  modeLabel: { en: 'Prompt mode', 'zh-Hant': 'Prompt 模式', ja: 'プロンプトモード' },
  modeI2va: { en: 'Image to video (I2VA)', 'zh-Hant': '圖生影片 (I2VA)', ja: '画像から動画 (I2VA)' },
  modeT2va: { en: 'Text to video (T2VA)', 'zh-Hant': '文生影片 (T2VA)', ja: 'テキストから動画 (T2VA)' },
  modeRef2va: { en: 'Multimodal reference (Ref2VA)', 'zh-Hant': '多模態參考 (Ref2VA)', ja: 'マルチモーダル参照 (Ref2VA)' },
  modeHint: {
    en: 'I2VA adds the keyframe sentence for the input image; T2VA leaves it out; Ref2VA uses image / video / audio references in six sections. Each format keeps its own shots.',
    'zh-Hant': 'I2VA 會加上輸入圖片的關鍵幀句；T2VA 不加；Ref2VA 用圖片／影片／音訊參考，分六段輸出。每種格式各自保留自己的鏡頭。',
    ja: 'I2VA は入力画像のキーフレーム文を追加し、T2VA は追加しません。Ref2VA は画像・動画・音声の参照を 6 セクションで出力します。形式ごとにショットを別々に保持します。',
  },
  refCardHint: {
    en: '(reference labels and how each one is kept; "appears in" is filled in from the shots)',
    'zh-Hant': '（參考素材標籤與各自的保留方式；「appears in」會依鏡頭內容自動填入）',
    ja: '（参照ラベルとそれぞれの保持方法。「appears in」はショットの内容から自動入力されます）',
  },
  refAddLabel: { en: 'Add:', 'zh-Hant': '新增：', ja: '追加：' },
  refEmpty: { en: 'No references yet. Add one below.', 'zh-Hant': '還沒有參考素材，請從下方新增。', ja: '参照がありません。下から追加してください。' },
  refType: { en: 'Reference type', 'zh-Hant': '參考類型', ja: '参照の種類' },
  refMarker: { en: 'Retention marker', 'zh-Hant': '保留標記', ja: '保持マーカー' },
  refInsert: { en: 'Insert this label into the current shot', 'zh-Hant': '把這個標籤插入目前的鏡頭', ja: 'このラベルを現在のショットに挿入' },
  refDelete: { en: 'Delete this reference', 'zh-Hant': '刪除這個參考素材', ja: 'この参照を削除' },
  refDefPlaceholder: {
    en: 'e.g. is the young woman in <Picture 1>, with auburn hair and a grey knit sweater',
    'zh-Hant': '例如：is the young woman in <Picture 1>, with auburn hair and a grey knit sweater（接在標籤後面，英文）',
    ja: '例：is the young woman in <Picture 1>, with auburn hair and a grey knit sweater（ラベルの後ろに続く英文）',
  },
  refNotePlaceholder: { en: 'How it is kept (after " - ")', 'zh-Hant': '保留方式說明（接在「 - 」後面）', ja: '保持の説明（「 - 」の後ろ）' },
  refScopePlaceholder: { en: 'Where it applies, e.g. [Shot 1] first frame', 'zh-Hant': '用在哪裡，例如 [Shot 1] first frame', ja: '使う場所（例：[Shot 1] first frame）' },
  refRetentionFree: { en: 'Write retention_analysis as free text', 'zh-Hant': 'retention_analysis 改用自由文字', ja: 'retention_analysis を自由記述にする' },
  refRetentionFreePlaceholder: { en: 'Retain the face from <Picture 1>. …', 'zh-Hant': '例如：Retain the face from <Picture 1>. …', ja: '例：Retain the face from <Picture 1>. …' },
  summaryHint: { en: '(task types in brackets, then one short paragraph)', 'zh-Hant': '（方括號內選任務類型，後面接一小段英文摘要）', ja: '（角括弧でタスクの種類を選び、短い段落を続けます）' },
  summaryPlaceholder: { en: '<Subject 1> takes a book from the shelf …', 'zh-Hant': '例如：<Subject 1> takes a book from the shelf …', ja: '例：<Subject 1> takes a book from the shelf …' },
  styleLabel: {
    en: 'Overall style (1–2 sentences, written before [Shot 1])',
    'zh-Hant': '整體風格（1–2 句，寫在 [Shot 1] 之前）',
    ja: '全体のスタイル（1〜2 文、[Shot 1] の前に書きます）',
  },
  stylePlaceholder: {
    en: 'The target video is in a warm, realistic style with soft practical lighting.',
    'zh-Hant': '例如：The target video is in a warm, realistic style with soft practical lighting.',
    ja: '例：The target video is in a warm, realistic style with soft practical lighting.',
  },
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
  storyboardLabel: { en: 'Storyboards (auto-saved in this browser)', 'zh-Hant': '分鏡（自動保存在此瀏覽器）', ja: 'ストーリーボード（このブラウザに自動保存）' },
  toastStoryboardExported: { en: 'Storyboard exported as JSON', 'zh-Hant': '已匯出分鏡 JSON 檔', ja: 'ストーリーボードを JSON でエクスポートしました' },
  toastStoryboardImported: { en: 'Imported "{name}" ({n} shot(s))', 'zh-Hant': '已匯入「{name}」（{n} 個鏡頭）', ja: '「{name}」をインポートしました（{n} 件のショット）' },
  toastStoryboardImportFail: { en: 'Import failed: not a valid storyboard JSON file', 'zh-Hant': '匯入失敗：不是有效的分鏡 JSON 檔', ja: 'インポート失敗：有効なストーリーボード JSON ファイルではありません' },
  projectSelectLabel: { en: 'Switch storyboard', 'zh-Hant': '切換分鏡', ja: 'ストーリーボードを切り替え' },
  projectNameLabel: { en: 'Storyboard name', 'zh-Hant': '分鏡名稱', ja: 'ストーリーボード名' },
  newProject: { en: 'New', 'zh-Hant': '新增', ja: '新規' },
  deleteProject: { en: 'Delete', 'zh-Hant': '刪除', ja: '削除' },
  confirmDeleteProjectTitle: { en: 'Delete this storyboard?', 'zh-Hant': '要刪除這份分鏡嗎？', ja: 'このストーリーボードを削除しますか？' },
  confirmDeleteProject: { en: '"{name}" and all its shots will be deleted. Export it first if you want to keep a copy.', 'zh-Hant': '「{name}」與其中所有鏡頭將被刪除。想保留請先匯出。', ja: '「{name}」とすべてのショットが削除されます。残したい場合は先にエクスポートしてください。' },
  toastProjectCreated: { en: 'Created "{name}"', 'zh-Hant': '已新增「{name}」', ja: '「{name}」を作成しました' },
  toastProjectDeleted: { en: 'Deleted "{name}"', 'zh-Hant': '已刪除「{name}」', ja: '「{name}」を削除しました' },
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
