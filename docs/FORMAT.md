# 輸出格式與資料保存

改 `buildPrompt()`／`parsePrompt()`／`analyzeShots()` 或 localStorage、匯出匯入格式前先讀這份。**輸出格式修改前須先與使用者確認。**

## 輸出格式

`buildPrompt()`（`core.js`）產生：

```
integrated_multimodal_description: [Shot 1] At 00:00.000, <描述>. [Shot 2] At 00:01.000, <描述>.

overall_soundscape: <環境音效，預設 N/A>
non_diegetic_music: <背景音樂，預設 N/A>
```

- 時間戳記 `MM:SS.mmm`；鏡頭之間一個半形空格；「自動格式優化」開啟時描述結尾補 `.`。
- **描述空白的鏡頭不輸出**，其餘依序重新編號；卡片標籤顯示輸出編號，空白卡片顯示 `[Shot –]`。
- **鏡頭存的是持續時間**（`shot.duration`，秒數字串如 `"1.5"`），`At` 時間由 `analyzeShots()` 算出：第一個輸出的鏡頭從 `00:00.000` 開始，之後每個鏡頭的開始時間是前面「會輸出的」鏡頭持續時間加總。空白鏡頭不計入時間軸（卡片顯示 `At –`）。PREVIEW 顯示總長度 `totalDuration()`（只加總會輸出的鏡頭）。
- **持續時間檢查**（`analyzeShots()`）：每張卡片都檢查，必須是大於 0 的秒數（最多 3 位小數，接受 `1,5`、`1.5s`）；錯誤的持續時間在時間軸上算 0。微調按鈕最小到 0.1 秒。
- **貼上 Prompt**（`parsePrompt(text, lastDurationSec)`）：持續時間取相鄰 `At` 的差；最後一個鏡頭用「新增鏡頭預設持續時間」；差值 ≤ 0 或時間讀不懂時留下錯誤值讓卡片顯示錯誤。

## 資料保存

- `localStorage`：`msp-lang`（語言）、`msp-tags`（標籤陣列）、`msp-projects`（所有分鏡與目前開啟的那份）。舊版的 `msp-shots`（單份分鏡）會在載入時自動搬進第一份分鏡並移除。讀寫都包 `try/catch`，不能用時退回預設值。
- `msp-projects` 格式：`{ "type": "minimax-h3-prompt-projects", "version": 1, "activeId", "projects": [{ "id": "p1", "name", "shots": [{ "duration", "description" }], "overallSoundscape", "nonDiegeticMusic" }] }`。`state.shots`／音效／音樂是目前這份的即時內容，存檔時（`saveStoryboard()` → `syncActiveProject()`）才寫回；至少保留一份，刪除要確認。
- 分鏡在 `refreshDerived()` 結尾自動存檔（輸入與結構改變都會經過）；重新整理後還原，Reset 只清空目前這份。「預設持續時間」與「自動格式優化」目前不保存。
- 單份分鏡匯出格式：`{ "type": "minimax-h3-prompt-storyboard", "version": 1, "exportedAt": "…", "name"?, "shots": [{ "duration", "description" }], "overallSoundscape", "nonDiegeticMusic" }`；匯入會新增一份分鏡並切過去（原本的不動）。
- 標籤匯出格式：`{ "type": "minimax-h3-prompt-tags", "version": 1, "exportedAt": "…", "tags": [{ "text", "note", "notes"? }] }`；匯入也接受純陣列，採合併、重複（不分大小寫）略過。
