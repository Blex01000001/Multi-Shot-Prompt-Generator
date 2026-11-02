# CLAUDE.md

本檔案提供 Claude Code 在此專案中工作時所需的背景與規範。

## 專案概述

**MiniMax H3 多鏡頭圖生影片提示詞產生器**：一個純前端靜態網頁應用程式，用來把多個鏡頭（Shot）的時間戳記與描述，組合成 MiniMax H3 圖生影片（Image-to-Video）模型可使用的結構化 Prompt。

- 檔案：`index.html`（畫面結構）、`css/style.css`（自訂樣式）、`js/tailwind-config.js`、`js/app.js`（全部程式邏輯）
- 無建置流程、無後端、無套件管理器，直接用瀏覽器開啟即可執行
- 可直接部署到 GitHub Pages（主檔必須維持命名為 `index.html`）

## 技術堆疊

- **Tailwind CSS**：透過 CDN（`https://cdn.tailwindcss.com`）載入，設定寫在 `<head>` 內的 `tailwind.config`（`darkMode: 'class'`、自訂 `brand` 色票）
- **字體**：Google Fonts，`Inter`（介面文字）與 `JetBrains Mono`（時間戳記、Prompt 輸出等等寬內容）
- **SortableJS**：`1.15.6`，從 jsDelivr CDN 載入（`https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js`），用於鏡頭卡片拖曳排序；版本請固定，不要用 `@latest`。若 CDN 載入失敗，`window.Sortable` 不存在時會略過，上下移按鈕仍可使用。
- **JavaScript**：原生 Vanilla JS，無框架；以單一 `state` 物件 + `render()` 重繪的方式管理畫面
- **Favicon**：直接以 data URI 內嵌在 `<head>` 的 SVG（與頂部橫條相同的漸層攝影機圖示），不需要額外檔案。

## 設計規範（修改 UI 時務必遵守）

1. **現代化科技感**：深色主題（slate-900/950 背景）、玻璃擬態面板（`.glass-panel`，半透明 + `backdrop-filter: blur`）、indigo／purple 漸層與光暈（`.glow-purple`）、圓角（`rounded-xl`）、細邊框（`border-slate-700/60` 等）。
2. **字體適度放大，維持絕佳閱讀性**：
   - 一般文字採用響應式尺寸，例如 `text-xs sm:text-sm`、標題 `text-base sm:text-lg`；新增元件時請比照，不要再縮得更小。
   - 盡量避免 `text-[11px]` 以下的字級；次要文字至少用 `text-slate-400`，維持足夠對比。
   - 行高保持寬鬆（如 `leading-relaxed`）。
3. **介面語言（多語系）**：支援 English／繁體中文／日本語，**預設英文**，右上角地球圖示切換，選擇會存在 `localStorage`（key：`msp-lang`）。
   - 所有介面文字都放在 `<script>` 內的 `I18N` 字典（`en`、`zh-Hant`、`ja`），靜態元素用 `data-i18n`／`data-i18n-title`／`data-i18n-aria` 標記，動態內容用 `t(key, vars)` 取得。
   - **新增或修改任何介面文字時，三種語言都必須一起補齊。**
   - Prompt 的欄位名稱、`[Shot N]` 標籤與提示詞片語（prompt chips）維持**英文**，因為是要送給模型的內容；chip 的 tooltip 才依語言顯示說明。
4. 須同時支援手機與桌機（使用 `sm:` / `lg:` 斷點）。
5. **頂部橫條**：桌機（`sm` 以上）高度 64px（`sm:h-16`）並固定在頂端（`sm:sticky`）；右側欄 `lg:top-20` 依此計算，改橫條高度時要一起調整。手機上標題會換行，橫條高度自動、不固定在頂端。

## 輸出格式（核心邏輯，請勿任意更動）

`generateFormattedOutput()` 產生的字串格式：

```
integrated_multimodal_description: [Shot 1] At 00:00.000, <描述>. [Shot 2] At 00:01.000, <描述>.

overall_soundscape: <環境音效，預設 N/A>
non_diegetic_music: <背景音樂，預設 N/A>
```

- 時間戳記格式為 `MM:SS.mmm`，由 `formatTimestamp()` / `parseTimestamp()` 互相轉換。
- 「自動格式優化」開啟時（`state.autoPeriod`），描述結尾若無句點會自動補上 `.`。
- 各鏡頭之間以一個半形空格分隔。
- **描述為空白的鏡頭不輸出**，其餘鏡頭依序重新編號（例：卡片 1、3 有內容、卡片 2 空白 → 輸出 `[Shot 1]`、`[Shot 2]`）。卡片上的標籤顯示的是輸出編號，空白卡片顯示 `[Shot –]`。
- 修改此格式前，應先與使用者確認，因為它對應 MiniMax H3 的 Prompt 結構。

## 時間戳記檢查

`analyzeShots()` 會即時檢查並以紅色醒目提示（卡片內錯誤訊息 + 預覽區上方摘要）：

- **格式**：每張卡片都檢查，必須完全符合 `MM:SS.mmm`（`TIMESTAMP_RE`）。
- **順序**：只比較「會輸出的」相鄰鏡頭，後一個時間必須**大於**前一個（相同也算錯誤）。

## 程式結構（`index.html` 內的 `<script>`）

| 區塊 | 說明 |
| --- | --- |
| `initialShots` / `state` | 預設鏡頭與全域狀態（`shots`、`overallSoundscape`、`nonDiegeticMusic`、`timeStepSec`、`autoPeriod`、`activeShotIndex`） |
| `I18N` / `t()` / `applyLanguage()` / `setLanguage()` | 多語系字典與切換；切換語言會重繪整個畫面 |
| `render()` | 依 `state` 重建鏡頭卡片列表，最後呼叫 `refreshDerived()` |
| `refreshDerived()` | 不重建卡片的情況下更新輸出編號、空白提示、時間戳記錯誤、預覽與字元數（打字時呼叫，避免失去焦點） |
| `analyzeShots()` | 計算每張卡片的輸出編號與時間戳記錯誤 |
| `attachShotEvents()` | 每次 render 後重新綁定卡片內的輸入、時間微調、移動、複製、刪除事件 |
| `addShot()` / `duplicateShot()` / `deleteShot()` / `moveShot()` | 鏡頭增刪、複製、排序 |
| `adjustShotTime()` | ±100ms / ±500ms 時間微調 |
| `copyPromptToClipboard()` | 以 `navigator.clipboard.writeText()` 複製完整 Prompt；失敗時（例如非安全連線）改為自動選取預覽文字並提示使用者按 Ctrl+C。不要再使用 `document.execCommand('copy')` |
| `Sortable.create(shotsListEl, …)` | 拖曳排序（只能從卡片左上角的把手 `.drag-handle` 拖曳），`onEnd` 時同步調整 `state.shots` 順序再 `render()` |
| `DEFAULT_TAGS` / `loadTags()` / `saveTags()` / `normalizeTag()` | 使用者自訂的提示詞標籤：`{ id, text, note, notes? }`。`text` 是送給模型的英文；`note` 是使用者自己的說明；內建標籤另有 `notes`（各語言翻譯），使用者編輯說明後會改用 `note` |
| `renderChips()` / `#tag-search` | 右側標籤列表與搜尋；點擊標籤（事件委派在 `#chips-list`）附加到目前聚焦（`activeShotIndex`）的鏡頭 |
| `renderTagManager()` 與 `#tag-modal` | 標籤管理視窗：新增、編輯、刪除（按兩下確認）、搜尋、匯出／匯入 JSON、恢復預設 |

### localStorage

| Key | 內容 |
| --- | --- |
| `msp-lang` | 介面語言（`en` / `zh-Hant` / `ja`） |
| `msp-tags` | 使用者的提示詞標籤陣列 |

所有讀寫都包在 `try/catch`，無法使用 storage 時要能正常運作（回到預設值）。鏡頭內容目前**不會**儲存，重新整理頁面會回到預設值。

### 標籤匯出／匯入格式

```json
{ "type": "minimax-h3-prompt-tags", "version": 1, "exportedAt": "…", "tags": [{ "text": "dolly zoom", "note": "滑動變焦" }] }
```

匯入時也接受純陣列（字串或 `{ text, note }` 物件）。匯入採**合併**，文字相同（不分大小寫）的標籤會略過。

## 開發與測試

- 直接以瀏覽器開啟 `index.html`，或啟動本機伺服器：`python3 -m http.server 8000`，再前往 `http://localhost:8000`。
- 沒有自動化測試；修改後請手動確認：新增／刪除／複製鏡頭、上下移與拖曳排序、時間微調、時間戳記錯誤提示、空白鏡頭略過與重新編號、標籤插入／搜尋／新增／編輯／刪除／匯出／匯入、三種語言切換、預覽輸出格式與複製功能皆正常，並檢查手機寬度（約 390px）不會出現水平捲動。
- 剪貼簿 API 需要安全環境：`https://`、`http://localhost` 或直接開啟檔案（`file://`）都可以。
- 不要引入建置工具；JS 一律用一般 `<script src>` 載入（不要用 `type="module"`，否則直接雙擊開啟 `file://` 會失效）。

## 每次 commit 後的回報規則

每次 commit（並 push）之後，回覆使用者時必須列出以下三個段落：

1. **已改善項目／問題**：這次 commit 完成了什麼。
2. **尚待改善項目／問題、已知問題**：還沒做完的、發現但未處理的問題、已知限制。
3. **建議改善方向或功能**：之後可以考慮的改進或新功能。

## Git 規則
1. 每完成一個獨立的修改就 commit
2. commit 訊息用繁體中文，第一行簡述改了什麼，
  需要時空一行補充原因
3. 需要了解過去的修改時，用 git log 查詢
