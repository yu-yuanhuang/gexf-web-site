# 社會網絡圖互動展示（GitHub Pages）

## 部署（GitHub Pages）
1. 建立一個 GitHub repository（例如 `my-network-site`）。
2. 將本資料夾內的檔案上傳到 repo 根目錄（`index.html` 必須在根目錄）。
3. 進入 repo 的 **Settings** → **Pages**：
   - **Build and deployment** → **Source**：選 `Deploy from a branch`
   - **Branch**：選 `main`（或 `master`）＋ `/ (root)`
   - Save 後稍等片刻，GitHub 會提供網站網址。

## 使用方式
- 右側圖面：滾輪縮放、拖曳平移、hover 顯示節點資訊。
- 左側控制：
  - 節點清單可逐一切換【顯示／不顯示】
  - 四個門檻可依 **weight／degree／weighted degree／betweenness** 過濾
  - 「顯示孤立節點」可控制門檻後是否保留無邊節點

## 已做的效能優化（資料端優先）
- 布局（x/y）與四項指標（degree、weighted degree、betweenness、edge weight 範圍）已於資料端預先計算。
- 前端不再執行 ForceAtlas2 等重計算，僅依門檻做可視化過濾與渲染。
- 初始化過程提供載入進度條（分階段進度）。

## 關於「避免前端取得原始數據」
- 本包 **不包含原始 GEXF**，也不提供可直接對照的原始 JSON 檔。
- 展示資料以「最小必要欄位 + 內嵌（Base64）」方式放在 `app.js` 內，降低一般使用者直接取得原始資料的便利性。

> 重要限制：GitHub Pages 是純靜態站，任何用於渲染的資料最終仍可被具備技術能力者抽取。
> 若需要**真正的資料保護**（例如權限、登入、不可被下載的核心數據），必須改成「後端 API + 驗證/授權」或在受控環境中提供。
