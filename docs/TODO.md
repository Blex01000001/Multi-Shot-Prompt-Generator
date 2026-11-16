# TODO：待辦、已知問題、想法

這份檔案記錄**目前狀態**，不記歷史（歷史看 `git log`）。規則見 CLAUDE.md「TODO 與回報」：
做完就刪、新發現就加、每項一行為主、保持精簡。

標記：【直接做】使用者點名即可動手；【先討論】要先和使用者確認方向；【使用者】需要使用者自己操作。

## 待辦

1. 【使用者】新增 `.claude/settings.json`：註冊 SessionStart hook（`$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh`，腳本已在 repo，但尚未註冊所以不會執行），並加權限白名單（`npm test`、`npm run test:*`、`npm run screenshots`、`git status`、`git log`、`git diff`、`git show`）。Claude 寫入此檔會被自動模式擋下，不要繞過。
2. 【先討論】Tailwind Play CDN 的 console 警告與載入時短暫無樣式：根治要改用預先產生的 CSS，等於引入建置步驟。
3. 【先討論】新增第二種 Prompt 格式（官方多模態格式：`subject_definitions`／`summary`／`retention_analysis`／`detailed_description`＋`overall_soundscape`／`non_diegetic_music`）。已定：同一頁、每份分鏡各存 `format`，切換時新格式欄位保留；照官方範例輸出，第一個鏡頭只寫 `[Shot 1]`（不寫 `At`），其後 `[Shot N] At MM:SS.mmm,`；`detailed_description` 開頭一行整體風格；現有格式輸出不變。待定：官方文件與完整規格（動手前要使用者給）。
   - 參考清單：每筆含類型（`<Subject N>`／`<Picture N>`／`<Video N>`／`<Audio N>`，Subject 可指向 Picture）、定義、保留標記（下拉）、保留說明；同時產生 `subject_definitions` 與 `retention_analysis`，`appears in [Shot …]` 由掃描鏡頭描述自動算出。
   - 保留標記資料放在容易增加的地方：視覺類 `fully_preserved`／`partially_preserved`／`attribute_transfer`／`weak_reference`；音訊類 `fully_copy`／`partially_copy`／`reference`／`weak_reference`。
   - `summary` 前綴 `[…]` 多選、以 ` + ` 串接，預設 `reference generation`；基礎值 `reference generation`／`video editing`／`video continuation`／`audio reference`／`audio reuse`。
   - 社群寫法（`retention_analysis` 整段自由文字）以「自由文字模式」備案；插入按鈕含 `<d>…</d>` 對白標籤；`parsePrompt()` 要能辨識兩種格式。

## 已知問題／限制

- 「預設持續時間」與「自動格式優化」不會保存，重新整理後回到預設。
- 分鏡名稱可重複；沒有分鏡數量上限（全存在 localStorage，約 5MB 上限）。
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
- 保存「預設持續時間」與「自動格式優化」（併入 `msp-projects` 或另存設定）。
- `state.activeShotIndex` 改成記錄鏡頭 `id`（目前每次載入都會重發 id，用索引仍可運作）。
- 「複製整份分鏡（專案）」按鈕（目前要複製只能匯出再匯入；單一鏡頭的複製按鈕已存在）、分鏡專案排序，或 undo／redo。
