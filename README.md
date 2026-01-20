# GEXF社會網絡圖互動網站（可部署）

此資料夾是一個純前端（Static）網站：左側為節點與指標控制，右側為可縮放/平移的互動網絡圖，游標停在節點上可顯示節點詳細資料。

## 1) 立即在本機啟動

由於瀏覽器安全限制，請用本機HTTP伺服器開啟（不要直接用檔案總管雙擊 index.html）。

### Windows / macOS / Linux

```bash
cd gexf_web_site
python -m http.server 8000
```

然後在瀏覽器開啟：

- http://localhost:8000

## 2) 上線部署

這是一個純靜態網站，可直接部署到任一靜態主機：

- GitHub Pages
- Netlify / Vercel
- 自己的Nginx/Apache

只要把整個資料夾上傳即可。

## 3) 更新你的GEXF（重新生成 graph.json）

網站實際載入的是 `graph.json`（由 `graph.gexf` 轉換而來）。如果要換一份GEXF：

1. 用你的新檔案取代 `graph.gexf`
2. 重新產生 `graph.json`

```bash
python convert_gexf_to_json.py graph.gexf graph.json
```

## 4) 指標與介面（繁體中文）

左側四個門檻控制已繁中化：

- 邊權重門檻（weight）
- 邊數門檻（degree）
- 加權邊數門檻（weighted degree）
- 中介中心性門檻（betweenness）

備註：
- `betweenness` 會優先讀取你原始GEXF節點屬性中的 `betweeness` / `betweenness` 欄位（若不存在則視為0）。
- `degree` 與 `weighted degree` 由網站依據邊與邊權重自動計算。
