# TODO：待辦、已知問題、想法

這份檔案記錄**目前狀態**，不記歷史（歷史看 `git log`）。規則見 CLAUDE.md「TODO 維護規則」：
做完就刪、新發現就加、每項一行為主、保持精簡。

標記：【直接做】使用者點名即可動手；【先討論】要先和使用者確認方向；【使用者】需要使用者自己操作。

## 待辦

1. 【使用者】新增 `.claude/settings.json`：註冊 SessionStart hook（`$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh`，腳本已在 repo，但尚未註冊所以不會執行），並加權限白名單（`npm test`、`npm run test:*`、`npm run screenshots`、`git status`、`git log`、`git diff`、`git show`）。Claude 寫入此檔會被自動模式擋下，不要繞過。
2. 【直接做】保存分鏡內容：鏡頭（`duration`、`description`）、音效、音樂存到 `localStorage` 的 `msp-shots`（讀寫包 try/catch），並提供整份分鏡 JSON 匯出／匯入。可沿用 `createInitialShots`、`DEFAULT_AUDIO`、`showConfirm`，參考 `buildTagExport`／`mergeImportedTags`；建議順便把 `state.activeShotIndex` 改成記錄鏡頭 `id`。
5. 【直接做】GitHub Actions 自動測試：新增 `.github/workflows/test.yml`，PR 時跑 `npm ci && npx playwright install --with-deps chromium && npm run test:all`。Claude 可能沒權限推 workflow 檔，失敗時請使用者手動新增。
7. 【直接做】（可選）手機上英文標題換成三行：可縮短手機版標題或調整字級；不能動到桌機的標題、副標與圖示。
8. 【先討論】Tailwind Play CDN 的 console 警告與載入時短暫無樣式：根治要改用預先產生的 CSS，等於引入建置步驟。
9. 【使用者】GitHub Pages：Settings → Pages 選 `main` / `(root)`，網址 `https://blex01000001.github.io/Multi-Shot-Prompt-Generator/`；建議在 repo About 的 ⚙️ 勾選 Use your GitHub Pages website。目前不確定是否已開啟。

## 已知問題／限制

- 鏡頭、音效、音樂的內容都不保存，重新整理就清空（見待辦 2）。
- 手機上鏡頭卡片的持續時間框和微調按鈕分成兩列（外框讓寬度少了幾 px），卡片較高。
- 桌機卡片右上已有 6 個按鈕（上、下、貼上、複製、刪除、拖曳），標題列幾乎沒有空間再加按鈕；要加的話考慮「更多」選單。
- 描述框下方固定保留一行給提示訊息，沒有訊息的卡片也會多約 20px；訊息太長會截斷成「…」（滑鼠移上去看完整文字）。
- 持續時間框寬 `w-[4ch]`，`12.25` 這類較長的值在框內看不完整。
- 貼上的 Prompt 若第一個鏡頭不是 `00:00.000`，開頭那段時間會被捨棄（沒有地方記錄起始偏移）。
- 直接在文字框按 Ctrl+V 不會整理換行與空白，只有卡片上的貼上按鈕會。
- 音效卡片的 HTML（含貼上按鈕）寫在 `index.html`，鏡頭卡片由 `shots.js` 產生，兩邊樣式要分開維護。
- 中文／日文介面的部分按鈕用等寬字體，中日文字看起來稍寬。

## 想法（尚未決定要不要做）

- PREVIEW 加「目標總長度」（例如 6 秒），超過時總長度標籤變黃／紅提醒。
- 「平均分配」：輸入總長度，平均分給所有會輸出的鏡頭；或一鍵把所有持續時間設為預設值。
- 音效卡片加「設為 N/A」按鈕，或提供常用環境音效／音樂標籤。
- 在文字框按 Ctrl+V 時也套用 `cleanShotText()` 整理（或做成設定）。
- 卡片貼上的內容若其實是完整 Prompt（含 `[Shot N] At`），提示改用上方的「從剪貼簿貼上 Prompt」。
- 手機上把持續時間與微調按鈕排回同一列（例如縮小微調按鈕或外框內距）。
