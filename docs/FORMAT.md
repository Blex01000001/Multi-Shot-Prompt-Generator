# 輸出格式與資料保存

改 `buildPrompt()`／`parsePrompt()`／`analyzeShots()` 或 localStorage、匯出匯入格式前先讀這份。**輸出格式修改前須先與使用者確認。**

## 輸出格式

`buildPrompt()`（`core.js`）產生：

```
For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.

integrated_multimodal_description: [Shot 1] At 00:00.000, <描述>. [Shot 2] At 00:01.000, <描述>.

overall_soundscape: <環境音效，預設 N/A>
non_diegetic_music: <背景音樂，預設 N/A>
```

- 「Prompt 模式」（`state.mode`，`buildPrompt()` 的 `mode`，預設 `i2va`）：`i2va` 第一行是官方 I2VA 關鍵幀對齊句（`KEYFRAME_ALIGNMENT`，視為一張圖當首幀），後面空一行再接欄位；`t2va` 沒有這一行，直接從 `integrated_multimodal_description` 開始。`ref2va` 見下一節。`parsePrompt()` 都能讀，並回傳 `mode`（文字含對齊句為 `i2va`，否則 `t2va`）；貼上 Prompt 時模式跟著切換。模式存在每份分鏡裡（`project.mode`：`i2va`／`t2va`／`ref2va`）。`i2va`／`t2va` 共用分鏡頂層的 `shots`／音效，`ref2va` 的鏡頭、音效與參考欄位各自放在 `project.ref`，切換格式時互不影響。
- 時間戳記 `MM:SS.mmm`；鏡頭之間一個半形空格；「自動格式優化」開啟時描述結尾補 `.`。
- **描述空白的鏡頭不輸出**，其餘依序重新編號；卡片標籤顯示輸出編號，空白卡片顯示 `[Shot –]`。
- **鏡頭存的是持續時間**（`shot.duration`，秒數字串如 `"1.5"`），`At` 時間由 `analyzeShots()` 算出：第一個輸出的鏡頭從 `00:00.000` 開始，之後每個鏡頭的開始時間是前面「會輸出的」鏡頭持續時間加總。空白鏡頭不計入時間軸（卡片顯示 `At –`）。PREVIEW 顯示總長度 `totalDuration()`（只加總會輸出的鏡頭）。
- **持續時間檢查**（`analyzeShots()`）：每張卡片都檢查，必須是大於 0 的秒數（最多 3 位小數，接受 `1,5`、`1.5s`）；錯誤的持續時間在時間軸上算 0。微調按鈕最小到 0.1 秒。
- **貼上 Prompt**（`parsePrompt(text, lastDurationSec)`）：持續時間取相鄰 `At` 的差；最後一個鏡頭用「新增鏡頭預設持續時間」；差值 ≤ 0 或時間讀不懂時留下錯誤值讓卡片顯示錯誤。

### 多模態參考格式（`ref2va`）

官方規格見 `docs/MULTIMODAL-SPEC.md`。`buildRefPrompt()` 依序輸出 `subject_definitions`、`summary`、`retention_analysis`、`detailed_description`、`overall_soundscape`、`non_diegetic_music`，欄位名後換行接內容，欄位之間空一行；沒有內容的欄位只輸出欄位名。

- 參考清單 `ref.refs`：`{ type, definition, marker, scope, note }`，`type` ∈ `REF_TYPES`（Subject／Picture／Video／Audio），標籤依各類型順序自動編號（`<Subject 1>`、`<Picture 1>`…）。`definition` 接在標籤後面（以 `:` 開頭則不加空格）。
- `retention_analysis`（`retentionMode: 'list'`）每個參考一行：`<標籤> (括號): marker - note`。Subject 的括號是自動算出的 `appears in [Shot …]`（掃描鏡頭描述有沒有出現該標籤；沒出現就省略括號）；Picture／Video 用 `scope` 欄位；Audio 沒有括號。`retentionMode: 'free'` 則原樣輸出 `retentionFree`。
- 保留標記放在 `core.js` 的 `RETENTION_MARKERS`（visual／audio 各一組，第一個是預設）；要新增值就加在這裡。`summary` 的任務類型是 `SUMMARY_TYPES`，以 ` + ` 串接。
- `detailed_description`：先放 `ref.style`（一行），再每個鏡頭一行；第一個輸出的鏡頭只寫 `[Shot 1]`（不寫 `At`），之後 `[Shot N] At MM:SS.mmm, …`。持續時間與 `analyzeShots()` 規則同上。
- 貼上：`parsePrompt()` 偵測到 `subject_definitions`／`retention_analysis`／`detailed_description` 欄位就走 `parseRefPrompt()`；`retention_analysis` 若不是「已定義標籤 + marker」的逐行格式（例如社群的整段文字）就存成自由文字模式。

## 資料保存

- `localStorage`：`msp-lang`（語言）、`msp-theme`（`light`／`dark`，預設 `dark`）、`msp-tags`（標籤陣列）、`msp-projects`（所有分鏡與目前開啟的那份）。舊版的 `msp-shots`（單份分鏡）會在載入時自動搬進第一份分鏡並移除。讀寫都包 `try/catch`，不能用時退回預設值。
- `msp-projects` 格式：`{ "type": "minimax-h3-prompt-projects", "version": 1, "activeId", "settings": { "timeStepSec", "autoPeriod" }, "projects": [{ "id": "p1", "name", "mode", "shots": [{ "duration", "description" }], "overallSoundscape", "nonDiegeticMusic", "ref": { "style", "summaryTypes", "summary", "refs", "retentionMode", "retentionFree", "shots", "overallSoundscape", "nonDiegeticMusic" } }] }`。`state.shots`／音效／音樂是目前這份的即時內容，存檔時（`saveStoryboard()` → `syncActiveProject()`）才寫回；至少保留一份，刪除要確認。
- 分鏡在 `refreshDerived()` 結尾自動存檔（輸入與結構改變都會經過）；重新整理後還原，Reset 只清空目前這份。「預設持續時間」`timeStepSec` 與「自動格式優化」`autoPeriod` 存在 `msp-projects.settings`（所有分鏡共用，變更時存檔）；缺少時用預設值 1 秒／開啟。
- 單份分鏡匯出格式：`{ "type": "minimax-h3-prompt-storyboard", "version": 1, "exportedAt": "…", "name"?, "mode"?, "shots": [{ "duration", "description" }], "overallSoundscape", "nonDiegeticMusic" }`；匯入會新增一份分鏡並切過去（原本的不動）。
- 標籤匯出格式：`{ "type": "minimax-h3-prompt-tags", "version": 1, "exportedAt": "…", "tags": [{ "text", "note", "notes"? }] }`；匯入也接受純陣列，採合併、重複（不分大小寫）略過。
