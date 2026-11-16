# 多模態參考格式（Ref2VA）官方規格摘要

實作第二種 Prompt 格式前先讀這份。來源已逐字核對官方原文：`MiniMax-AI/MiniMax-H3` 的 `skills/h3-prompt-writing/references/ref-en.txt`（Ref2VA）、`base-en.txt`（共用的鏡頭／對白／音訊規則）、`SKILL.md`。原文可用 `curl https://raw.githubusercontent.com/MiniMax-AI/MiniMax-H3/main/skills/h3-prompt-writing/references/ref-en.txt` 取得（沙盒連得到 raw.githubusercontent.com，連不到 huggingface.co）。

## 結構

六個欄位，名稱與順序固定，欄位名後加 `:`，內容寫在下一行，欄位之間空一行；全部英文（對白／歌詞在 `<d>` 內、畫面文字除外）：
`subject_definitions` → `summary` → `retention_analysis` → `detailed_description` → `overall_soundscape` → `non_diegetic_music`。
沒有音樂寫 `N/A`；`overall_soundscape` 只有完全靜音才寫 `N/A`。

## 參考標籤（各類獨立編號，從 1 起，全文意義不變）

| 標籤 | 用途 |
| --- | --- |
| `<Subject N>` | 可重複使用的可見內容（人、物、場景、服裝、風格、動作…）；可由多個素材組成，一個素材也可提供多個 Subject |
| `<Picture N>` | **只**在圖片本身當作某鏡頭的首幀／關鍵幀／尾幀／構圖或分鏡參考時單獨定義；只用來定義角色、場景、服裝的圖，寫進 `<Subject N>` 的定義（`… in <Picture 1>`），不單獨列 |
| `<Video N>` | 整支影片關係：編輯來源、續寫起點、運鏡／剪輯／節奏結構；影片裡的人物、物件仍歸 `<Subject N>` |
| `<Audio N>` | 被複製或參考的音訊（獨立音檔，或參考影片的同步音軌）；對應說話者時寫 `<Subject N> (Sx)` |

`subject_definitions` 每項一行，寫標籤指什麼、參考角色、要跟隨的主要特徵。

## summary

一段英文，開頭方括號任務類型，多個用 ` + ` 串接且不可重複：
`keyframe completion`、`reference generation`、`video editing`、`video continuation`、`audio reuse`、`audio reference`（共 6 個）。
- 圖片當具體畫面錨點 → `keyframe completion`；圖／影片／音訊只提供生成指引 → `reference generation`。
- 只有直接編輯／續寫來源影片才用 `video editing`／`video continuation`；編輯且保留原音要加 `audio reuse`。
- 不可在 summary 引入新標籤；編輯任務在前綴後以 `The target video is an edited version of <Video 1>.` 開頭。

## retention_analysis

每個標籤一行，標記為固定英文值，格式 `標籤 (括號說明): marker - 說明`：
- 視覺（Subject／Picture／Video）：`fully_preserved`、`partially_preserved`、`attribute_transfer`、`weak_reference`
  - `<Subject 1> (appears in [Shot 1], [Shot 3]): fully_preserved - …`
  - `<Picture 2> ([Shot 1] first frame): fully_preserved - …`
  - `<Video 1> (cut and pacing structure): weak_reference - …`
- 音訊（Audio，無括號）：`fully_copy`、`partially_copy`、`reference`、`weak_reference` → `<Audio 1>: fully_copy - …`
- 標記只在 `subject_definitions` 已定義的角色範圍內選；目標影片新增的動作、背景不算保真度損失；`retention_analysis` 內不寫 `(Sx)`。
- `partially_preserved` 是「定義的特徵被改動或只部分保留」，不是「這個鏡頭只拍到一部分」。
- 官方沒有「不適用」寫法。

## detailed_description

- 先 1–2 句整體風格（獨立一行，在 `[Shot 1]` **之前**），例：`The target video is in a warm, realistic style with soft practical lighting and a shallow depth of field.`
- `[Shot 1] …`（無時間戳記）；之後 `[Shot N] At MM:SS.mmm, …`，時間嚴格遞增且在影片總長內。每個鏡頭各佔一行（官方範例單換行）。
- 說話者 `(S1)`、`(S2)`…依目標影片中實際發聲順序編號；參考主體說話寫 `<Subject N> (Sx)`。對白／歌詞 `<d>[Language] …</d>`，`</d>` 前以 `.?!` 結尾；聽不清楚寫 `[unclear]`。
- 跨切鏡對白用 `<scenetrans>`、被影片結尾截斷用 `<cutoff>`；旁白用 `says in an off-screen voiceover`；畫面文字用英文雙引號逐字。
- 生成任務通常 350–500 英文字；影片總長 4–15 秒（`SKILL.md`）。
- 禁止重複波浪號、emoji、項目符號、裝飾性標點。

## overall_soundscape／non_diegetic_music

- `overall_soundscape`：1–4 句，環境音、物理動作音、非語言人聲；不重複對白與音樂。
- `non_diegetic_music`：1–3 句，只有觀眾聽得到的配樂；寫樂器、速度、節奏、動態，不用抽象情緒詞。
- 使用參考音訊時，複製／參考關係只寫在對應音層的欄位（環境音在 `overall_soundscape`、配樂在 `non_diegetic_music`）。

## 與現有 image-to-video 格式的差異（`base-en.txt`）

- Base 模式欄位是 `integrated_multimodal_description`／`overall_soundscape`／`non_diegetic_music`，風格寫在 `[Shot 1]` **之後**。
- I2VA／FL2VA／L2VA 的完整輸出最前面還有一行關鍵幀對齊句＋一個空行，例如 I2VA：`For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.` 現有 `buildPrompt()` 已補上 I2VA 這一行（單一圖片當首幀）。
