# CLAUDE.md

**MiniMax H3 多鏡頭圖生影片提示詞產生器**：純前端靜態網頁，把多個鏡頭的持續時間與描述組成結構化 Prompt。無後端、**無建置流程**，直接開 `index.html`（含 `file://`）或 GitHub Pages。

## 省 token 的工作方式

- 先用下方檔案地圖選檔，再用 Grep 找函式、Read 只讀需要的行段；不要整檔讀 `index.html`、`core.js`、`tests/e2e/app.test.js`。
- 每個 `js/*.js` 開頭的註解說明職責；細節以程式碼為準，這裡不重複。
- 需要時才讀：`docs/TODO.md`（開始新工作或 commit 前）、`docs/FORMAT.md`（動到輸出格式、解析、localStorage、匯出匯入時）。
- 測試預設只印點與失敗細節；不要用 `test:verbose`，除非要查測試名稱。

## 檔案地圖

| 檔案 | 負責 |
| --- | --- |
| `index.html` | 靜態結構、彈出視窗、音效卡片（`data-audio`）、`<script>` 載入順序 |
| `css/style.css`、`js/tailwind-config.js` | 少量自訂樣式；Tailwind CDN 設定 |
| `js/core.js` | **純邏輯**：時間與持續時間、鏡頭增刪複製移動、`buildPrompt()`／`parsePrompt()`、`analyzeShots()`、標籤與分鏡資料處理 |
| `js/i18n.js` | 介面文字 `MESSAGES`（每鍵三語並列）、`t()` |
| `js/state.js` | `state`、DOM 參照、localStorage 讀寫、`downloadJson()`／`showToast()`／`showConfirm()`、`ICONS`／`icon()` |
| `js/shots.js` | 鏡頭卡片 HTML、`render()`／`refreshDerived()`、卡片操作、拖曳排序 |
| `js/tags.js` | 標籤列表、標籤管理視窗 |
| `js/paste.js` | 貼上 Prompt、卡片與音效卡片的貼上按鈕 |
| `js/projects.js` | 多份分鏡切換／新增／改名／刪除、單份分鏡 JSON 匯出匯入 |
| `js/app.js` | 語言切換、複製、全域控制、啟動流程（最後載入） |
| `tests/unit/` | Node 單元測試：`core`、`i18n` 一致性、`scripts`（全域名稱不重複、`core.js` 純度） |
| `tests/e2e/` | `app.test.js` 瀏覽器測試、`screenshots.js` 截圖、`helpers.js` 伺服器與本機 CDN 路由 |

## 驗證（每次修改都要做）

```bash
npm test              # 單元測試，約 0.1 秒；任何修改都跑
npm run test:e2e      # 約 10 秒；改到 UI 或行為時跑
npm run screenshots   # 改到外觀時跑，再 Read test-results/screenshots/*.png
```

- 只跑部分：`npm run test:e2e -- --test-name-pattern=tag`、`npm run screenshots -- zh`。
- 全部通過才 commit；不可跳過或刪除測試。改 `core.js` 補單元測試，新 UI 功能補 e2e，新畫面狀態加截圖。
- README 截圖：`npm run screenshots -- readme` 會改 `docs/screenshot.png`，畫面沒變不要 commit。

## 怎麼改

- **介面文字**：`MESSAGES` 加 `key: { en, 'zh-Hant', ja }`；HTML 用 `data-i18n="key"`（另有 `-title`／`-aria`／`-placeholder`），JS 用 `t('key')`。
- **邏輯**：不碰 DOM 的寫進 `core.js`，UI 檔只呼叫與顯示。
- **卡片按鈕**：`render()` 樣板加 `data-action`，`handleShotClick()` 加 `case`（事件只綁在清單上，卡片用 `data-index`）。
- **全域名稱**：所有 `js/*.js` 共用全域範圍，**名稱不可重複**。DOM 參照放 `state.js`；事件綁定寫在各檔 `init…()`，由 `app.js` 呼叫，載入時不可有副作用。
- **外部函式庫**：jsDelivr／cdnjs 固定版本，載入失敗要能退回（參考 `initShotSorting()`）；加進 devDependencies 並在 `tests/e2e/helpers.js` 加本機路由。

## 架構決策（不要改回去）

- 一般 `<script src>`，不用 `type="module"`（`file://` 會被擋）；`core.js`／`i18n.js` 結尾用 `module.exports` 給 Node 測試。
- `core.js` 不可存取 `document`、`window`、`localStorage`、`navigator`。
- 打字時只呼叫 `refreshDerived()`（不重建卡片，避免失焦）；結構改變才 `render()`。
- 分鏡在 `refreshDerived()` 結尾自動存檔。

## 設計規範

1. 深色科技感：slate-900/950、`.glass-panel`、indigo／purple 漸層與 `.glow-purple`、`rounded-xl`、`border-slate-700/60`。
2. 字體：一般 `text-xs sm:text-sm`、標題 `text-base sm:text-lg`；不小於此，次要文字至少 `text-slate-400`。
3. 三語（English 預設／繁體中文／日本語）。Prompt 欄位名、`[Shot N]`、標籤文字一律**英文**，只有說明文字跟著語言。
4. 手機 390px 不可水平捲動（e2e 會檢查）；用 `sm:`／`lg:` 支援桌機。
5. 頂部橫條桌機 `sm:h-16` 且 `sm:sticky`，右側欄 `lg:top-20` 依此計算；手機不固定。

## 先問再做

輸出格式（`buildPrompt()`）、引入建置工具、改架構。

## 雲端 session

- 連不到 Tailwind CDN、jsDelivr、Google Fonts、`github.io`；`npm install` 後測試自動改用 node_modules（SessionStart hook 會自動安裝）。
- Playwright 固定 `1.63.0`；**不要執行 `playwright install`**。
- 測試內建伺服器；不要用 `pkill -f "http.server"` 這類會比對到自己的指令。
- 寫入 `.claude/settings.json` 會被擋，不要繞過，請使用者手動新增。

## 工作習慣與 Git

- 回覆用繁體中文；commit 訊息用英文（第一行簡述，需要時空一行補原因）。
- 訊息常分「待處理事項」（直接改）與「待討論事項」（只分析、給建議，不改程式）。
- 每完成一個獨立修改就 commit；歷史用 `git log` 查。
- 開發分支 `claude/trusting-hopper-wk15uy`；它的 PR 合併後，新工作先 `git fetch origin main && git checkout -B claude/trusting-hopper-wk15uy origin/main`（推送用 `--force-with-lease`）。
- 使用者說「合併到 main」：用 GitHub MCP 工具建 PR 再 merge（`expectedHeadSha` 用完整 40 字元 SHA）。

## TODO 與回報

- 每次 commit 同步更新 `docs/TODO.md`：做完的刪掉、新發現的加進去；只記現況，每項一行。
- 待辦標【直接做】／【先討論】／【使用者】；「做待辦 N」以該檔編號為準。
- 每次 commit 並 push 後，回覆列三段（內容與 TODO 一致）：**已改善項目／問題**、**尚待改善項目與已知問題**、**建議改善方向或功能**。
