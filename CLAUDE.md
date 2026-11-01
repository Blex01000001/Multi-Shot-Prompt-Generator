# CLAUDE.md

本檔案提供 Claude Code 在此專案中工作時所需的背景與規範。

## 專案概述

**MiniMax H3 多鏡頭圖生影片提示詞產生器**：一個純前端靜態網頁應用程式，用來把多個鏡頭（Shot）的時間戳記與描述，組合成 MiniMax H3 圖生影片（Image-to-Video）模型可使用的結構化 Prompt。

- 單一檔案：`index.html`（HTML + CSS + JavaScript 全部內嵌）
- 無建置流程、無後端、無套件管理器，直接用瀏覽器開啟即可執行
- 可直接部署到 GitHub Pages（主檔必須維持命名為 `index.html`）

## 技術堆疊

- **Tailwind CSS**：透過 CDN（`https://cdn.tailwindcss.com`）載入，設定寫在 `<head>` 內的 `tailwind.config`（`darkMode: 'class'`、自訂 `brand` 色票）
- **字體**：Google Fonts，`Inter`（介面文字）與 `JetBrains Mono`（時間戳記、Prompt 輸出等等寬內容）
- **JavaScript**：原生 Vanilla JS，無框架；以單一 `state` 物件 + `render()` 重繪的方式管理畫面

## 設計規範（修改 UI 時務必遵守）

1. **現代化科技感**：深色主題（slate-900/950 背景）、玻璃擬態面板（`.glass-panel`，半透明 + `backdrop-filter: blur`）、indigo／purple 漸層與光暈（`.glow-purple`）、圓角（`rounded-xl`）、細邊框（`border-slate-700/60` 等）。
2. **字體適度放大，維持絕佳閱讀性**：
   - 一般文字採用響應式尺寸，例如 `text-xs sm:text-sm`、標題 `text-base sm:text-lg`；新增元件時請比照，不要再縮得更小。
   - 盡量避免 `text-[11px]` 以下的字級；次要文字至少用 `text-slate-400`，維持足夠對比。
   - 行高保持寬鬆（如 `leading-relaxed`）。
3. **介面語言**：介面文字使用**繁體中文**；Prompt 的欄位名稱與提示詞片語（prompt chips）維持**英文**，因為是要送給模型的內容。
4. 須同時支援手機與桌機（使用 `sm:` / `lg:` 斷點）。

## 輸出格式（核心邏輯，請勿任意更動）

`generateFormattedOutput()` 產生的字串格式：

```
integrated_multimodal_description: [Shot 1] At 00:00.000, <描述>.[Shot 2] At 00:01.000, <描述>.

overall_soundscape: <環境音效，預設 N/A>
non_diegetic_music: <背景音樂，預設 N/A>
```

- 時間戳記格式為 `MM:SS.mmm`，由 `formatTimestamp()` / `parseTimestamp()` 互相轉換。
- 「自動格式優化」開啟時（`state.autoPeriod`），描述結尾若無句點會自動補上 `.`。
- 修改此格式前，應先與使用者確認，因為它對應 MiniMax H3 的 Prompt 結構。

## 程式結構（`index.html` 內的 `<script>`）

| 區塊 | 說明 |
| --- | --- |
| `initialShots` / `state` | 預設鏡頭與全域狀態（`shots`、`overallSoundscape`、`nonDiegeticMusic`、`timeStepSec`、`autoPeriod`、`activeShotIndex`） |
| `render()` | 依 `state` 重建鏡頭卡片列表並更新預覽、字元數、鏡頭數 |
| `attachShotEvents()` | 每次 render 後重新綁定卡片內的輸入、時間微調、移動、複製、刪除事件 |
| `addShot()` / `duplicateShot()` / `deleteShot()` / `moveShot()` | 鏡頭增刪、複製、排序 |
| `adjustShotTime()` | ±100ms / ±500ms 時間微調 |
| `copyPromptToClipboard()` | 複製完整 Prompt，並顯示 toast 提示 |
| `.prompt-chip` 點擊事件 | 把常用提示詞片語附加到目前聚焦（`activeShotIndex`）的鏡頭 |

目前狀態**不會**儲存到 `localStorage`，重新整理頁面會回到預設值。

## 開發與測試

- 直接以瀏覽器開啟 `index.html`，或啟動本機伺服器：`python3 -m http.server 8000`，再前往 `http://localhost:8000`。
- 沒有自動化測試；修改後請手動確認：新增／刪除／複製／排序鏡頭、時間微調、prompt chip 插入、預覽輸出格式與複製功能皆正常。
- 保持單一檔案架構，除非使用者要求，不要引入建置工具或拆分檔案。
