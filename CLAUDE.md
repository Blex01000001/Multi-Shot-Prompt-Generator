# CLAUDE.md

**MiniMax H3 多鏡頭圖生影片提示詞產生器**：純前端靜態網頁，把多個鏡頭（Shot）的時間戳記與描述組合成 MiniMax H3 圖生影片模型使用的結構化 Prompt。無後端、**無建置流程**，直接開 `index.html`（含 `file://`）或部署到 GitHub Pages 即可使用。

## 檔案地圖（先看這裡決定要讀哪個檔案）

| 檔案 | 負責 | 常見修改 |
| --- | --- | --- |
| `index.html` | 靜態畫面結構、彈出視窗、`<script>` 載入順序 | 新增區塊／按鈕／輸入欄 |
| `css/style.css` | Tailwind 以外的少量自訂樣式 | 捲軸、玻璃效果、拖曳狀態 |
| `js/tailwind-config.js` | Tailwind CDN 設定（字體、色票） | 主題色、字體 |
| `js/core.js` | **純邏輯**：時間戳記、輸出格式 `buildPrompt()`、驗證 `analyzeShots()`、標籤資料處理、`DEFAULT_TAGS` | 輸出格式、驗證規則、標籤匯入匯出 |
| `js/i18n.js` | 介面文字 `MESSAGES`（每個鍵三語並列）、`t()` | 新增或修改任何介面文字 |
| `js/state.js` | `state`、DOM 元素參照、localStorage 讀寫、`showToast()` | 新增狀態欄位或 DOM 參照 |
| `js/shots.js` | 鏡頭卡片 HTML、`render()` / `refreshDerived()`、增刪複製移動、拖曳排序 | 卡片外觀與操作 |
| `js/tags.js` | 標籤列表、標籤管理視窗 | 標籤 UI |
| `js/app.js` | 語言切換、複製、全域控制、啟動流程 | 頂部按鈕、全域設定 |
| `tests/unit/*.test.js` | Node 單元測試（`core.js`、`i18n.js` 一致性） | 改 `core.js` 時同步補測試 |
| `tests/e2e/app.test.js` | Playwright 瀏覽器測試 | 新增 UI 功能時補測試 |
| `tests/e2e/screenshots.js` | 主要畫面截圖 | 新增畫面狀態時加一筆 |
| `.claude/hooks/session-start.sh` | 雲端 session 啟動時自動 `npm install`（沒變就略過） | 新增測試用套件時通常不用改 |
| `README.md`、`docs/screenshot.png` | 給使用者看的英文介紹、工具連結、截圖 | 功能或輸出格式改變時同步更新 |

每個 `js/*.js` 開頭都有註解說明職責；函式細節以程式碼與註解為準，不在此重複。

## 修改後的驗證（每次都要做）

```bash
npm test              # 單元測試，約 0.1 秒；任何修改都要跑
npm run test:e2e      # 瀏覽器測試，約 10 秒；改到 UI 或行為時跑
npm run screenshots   # 產生 test-results/screenshots/*.png；改到外觀時用 Read 看圖確認
```

- 第一次使用先 `npm install`（只裝測試工具：playwright、tailwindcss、sortablejs；雲端 session 由 SessionStart hook 自動執行）。裝好後測試會用本機的 Tailwind／SortableJS，**不需要連 CDN**（雲端環境連不到 `cdn.tailwindcss.com` 時也能測）。
- 只跑部分測試：`npm run test:e2e -- --test-name-pattern=tag`；只截部分圖：`npm run screenshots -- zh`。
- 測試必須全部通過才 commit；不可為了通過而跳過或刪除測試。

## 常見任務怎麼改

- **新增介面文字**：在 `js/i18n.js` 的 `MESSAGES` 加一筆 `key: { en, 'zh-Hant', ja }`，HTML 用 `data-i18n="key"`（另有 `-title`／`-aria`／`-placeholder`），JS 用 `t('key')`。`npm test` 會檢查三語齊全、`{n}` 參數一致、沒有不存在或未使用的鍵。
- **新增邏輯**：能不碰 DOM 的就寫進 `core.js` 並在 `tests/unit/core.test.js` 加測試，UI 檔只負責呼叫與顯示。
- **新增全域名稱**：所有 `js/*.js` 是共用全域範圍的一般 script，**名稱不可重複**（重複會讓整頁壞掉）。新 DOM 參照放 `state.js`；事件綁定寫在各檔的 `init…()` 函式，由 `app.js` 呼叫，檔案載入時不要有副作用。
- **新增外部函式庫**：從 jsDelivr／cdnjs 載入並固定版本（不可 `@latest`），失敗時要能退回（參考 `initShotSorting()` 的 `window.Sortable` 檢查）；同時加進 devDependencies 並在 `tests/e2e/helpers.js` 加本機路由。

## 架構決策（不要改回去）

- **一般 `<script src>`，不用 `type="module"`**：模組在 `file://` 會被瀏覽器擋下。為了能在 Node 測試，`core.js`／`i18n.js` 結尾用 `if (typeof module === 'object') module.exports = …` 匯出。
- **i18n 以「鍵」為單位、三語並列**：新增文字只改一處，不會漏語言。
- **純邏輯與 DOM 分離**：`core.js` 不可存取 `document`、`window`、`localStorage`。
- **打字時不重建卡片**：輸入事件只呼叫 `refreshDerived()`（避免失去焦點）；結構改變（增刪、排序、語言切換）才呼叫 `render()`。

## 設計規範（修改 UI 時務必遵守）

1. **現代化科技感**：深色（slate-900/950）、玻璃面板 `.glass-panel`、indigo／purple 漸層與 `.glow-purple`、`rounded-xl`、細邊框（`border-slate-700/60`）。
2. **字體適度放大**：一般文字 `text-xs sm:text-sm`、標題 `text-base sm:text-lg`，不要更小；避免 `text-[11px]` 以下；次要文字至少 `text-slate-400`；行高寬鬆。
3. **多語系**：English（預設）／繁體中文／日本語，右上角地球圖示切換，存在 `localStorage` 的 `msp-lang`。Prompt 欄位名、`[Shot N]` 與標籤文字一律**英文**（要送給模型），只有說明文字（tooltip）跟著語言。
4. **手機與桌機都要支援**（`sm:`／`lg:`），手機寬度 390px 不可水平捲動（e2e 測試會檢查）。
5. **頂部橫條**：桌機高 64px（`sm:h-16`）且 `sm:sticky`；右側欄 `lg:top-20` 依此計算。手機上不固定、高度自動。
6. 外部資源：Tailwind Play CDN、Google Fonts（Inter／JetBrains Mono）、SortableJS `1.15.6`（jsDelivr）；Favicon 是 `<head>` 內嵌的 SVG data URI。

## 輸出格式（核心邏輯，修改前須先與使用者確認）

`buildPrompt()`（`core.js`）產生：

```
integrated_multimodal_description: [Shot 1] At 00:00.000, <描述>. [Shot 2] At 00:01.000, <描述>.

overall_soundscape: <環境音效，預設 N/A>
non_diegetic_music: <背景音樂，預設 N/A>
```

- 時間戳記 `MM:SS.mmm`；鏡頭之間一個半形空格；「自動格式優化」開啟時描述結尾補 `.`。
- **描述空白的鏡頭不輸出**，其餘依序重新編號；卡片標籤顯示輸出編號，空白卡片顯示 `[Shot –]`。
- **時間戳記檢查**（`analyzeShots()`）：每張卡片檢查格式；只在「會輸出的」相鄰鏡頭間檢查順序，後者必須**大於**前者（相同也算錯）。

## 資料保存

- `localStorage`：`msp-lang`（語言）、`msp-tags`（標籤陣列）。讀寫都包 `try/catch`，不能用時退回預設值。鏡頭內容目前不保存。
- 標籤匯出格式：`{ "type": "minimax-h3-prompt-tags", "version": 1, "exportedAt": "…", "tags": [{ "text", "note", "notes"? }] }`；匯入也接受純陣列，採合併、重複（不分大小寫）略過。

## 每次 commit 後的回報規則

每次 commit（並 push）之後，回覆使用者時必須列出以下三個段落：

1. **已改善項目／問題**：這次 commit 完成了什麼。
2. **尚待改善項目／問題、已知問題**：還沒做完的、發現但未處理的問題、已知限制。
3. **建議改善方向或功能**：之後可以考慮的改進或新功能。

## Git 規則
1. 每完成一個獨立的修改就 commit
2. commit 訊息用英文，第一行簡述改了什麼，
  需要時空一行補充原因
3. 需要了解過去的修改時，用 git log 查詢
