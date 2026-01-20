/*
  GEXF社會網絡圖互動網站
  - 左側：節點顯示/不顯示＋四項指標門檻
  - 右側：Sigma互動圖（縮放/平移）＋hover節點詳情

  本網站直接載入 graph.json（由 convert_gexf_to_json.py 轉換而來）。
*/

(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    stats: $("stats"),
    container: $("graph-container"),
    loading: $("loading"),
    tooltip: $("tooltip"),

    toggleIsolates: $("toggle-isolates"),

    edgeWeight: $("edge-weight"),
    edgeWeightVal: $("edge-weight-val"),
    edgeWeightHint: $("edge-weight-hint"),

    degree: $("degree"),
    degreeVal: $("degree-val"),
    degreeHint: $("degree-hint"),

    wdegree: $("wdegree"),
    wdegreeVal: $("wdegree-val"),
    wdegreeHint: $("wdegree-hint"),

    betweenness: $("betweenness"),
    betweennessVal: $("betweenness-val"),
    betweennessHint: $("betweenness-hint"),

    nodeSearch: $("node-search"),
    nodeList: $("node-list"),
    btnAll: $("btn-all"),
    btnNone: $("btn-none"),
    btnInvert: $("btn-invert"),

    zoomIn: $("zoom-in"),
    zoomOut: $("zoom-out"),
    reset: $("reset"),
  };

  const fmt = {
    int: (n) => Number.isFinite(n) ? String(Math.round(n)) : "-",
    num: (n, digits = 4) => Number.isFinite(n) ? Number(n).toFixed(digits).replace(/0+$/,"...
  };

  function clamp(x, lo, hi) {
    return Math.max(lo, Math.min(hi, x));
  }

  function safeNumber(x, fallback = 0) {
    const n = typeof x === "number" ? x : Number(x);
    return Number.isFinite(n) ? n : fallback;
  }

  // 指標欄位繁中對照（tooltip用）
  const attrNameZH = {
    "degree": "邊數（degree）",
    "weightedDegree": "加權邊數（weighted degree）",
    "betweenness": "中介中心性（betweenness）",
    "weight": "節點權重（weight）",
    "in-degree": "入度（in-degree）",
    "out-degree": "出度（out-degree）",
    "betweeness": "中介中心性（betweeness）",
    "cluster_label": "聚類標籤（cluster label）",
    "cluster_index": "聚類編號（cluster index）",
    "cluster_universal_index": "聚類通用編號",
    "period": "期間（period）",
    "category": "類別（category）",
    "level": "層級（level）",
    "community_orphan": "孤立標記（community_orphan）",
  };

  // 簡單且穩定的配色：依聚類索引做哈希
  function colorFromCluster(clusterKey) {
    const s = String(clusterKey ?? "");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    // HSL -> RGB
    const hue = h % 360;
    const sat = 60;
    const lig = 55;
    return `hsl(${hue}, ${sat}%, ${lig}%)`;
  }

  async function loadJSON() {
    const res = await fetch("graph.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`無法載入 graph.json（HTTP ${res.status}）`);
    return await res.json();
  }

  function buildGraph(payload) {
    const Graph = graphology.Graph;
    const isUndirected = String(payload?.meta?.defaultEdgeType || "undirected").toLowerCase() !== "directed";
    const graph = new Graph({ type: isUndirected ? "undirected" : "directed" });

    // 先加節點
    for (const n of payload.nodes) {
      const id = String(n.id);
      const label = n.label ?? id;
      const gexfAttrs = n.attributes || {};

      // 用聚類索引/通用索引做配色，如果缺就用label
      const clusterKey = gexfAttrs.cluster_universal_index ?? gexfAttrs.cluster_index ?? gexfAttrs.cluster_label ?? label;

      graph.addNode(id, {
        label,
        gexf: gexfAttrs,
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
        size: 1,
        color: colorFromCluster(clusterKey),
      });
    }

    // 再加邊
    for (const e of payload.edges) {
      const id = String(e.id ?? `${e.source}__${e.target}`);
      const source = String(e.source);
      const target = String(e.target);
      if (!graph.hasNode(source) || !graph.hasNode(target)) continue;

      const w = safeNumber(e.weight, 1);
      const gexfAttrs = e.attributes || {};

      // 避免重複key
      const key = graph.hasEdge(id) ? `${id}_${Math.random().toString(16).slice(2)}` : id;

      // graphology在undirected graph仍可 addEdgeWithKey
      graph.addEdgeWithKey(key, source, target, {
        weight: w,
        gexf: gexfAttrs,
        size: 1,
        color: "rgba(255,255,255,0.15)",
      });
    }

    // 計算：degree & weighted degree & betweenness
    let maxDegree = 0;
    let maxWDegree = 0;
    let maxBetweenness = 0;
    let minEdgeW = Infinity;
    let maxEdgeW = -Infinity;

    // edge weight range
    graph.forEachEdge((edge, attr) => {
      const w = safeNumber(attr.weight, 1);
      if (w < minEdgeW) minEdgeW = w;
      if (w > maxEdgeW) maxEdgeW = w;
    });
    if (!Number.isFinite(minEdgeW)) minEdgeW = 0;
    if (!Number.isFinite(maxEdgeW)) maxEdgeW = 1;

    graph.forEachNode((node, attr) => {
      const degree = graph.degree(node);
      let wdegree = 0;
      graph.forEachEdge(node, (edge, eattr) => {
        wdegree += safeNumber(eattr.weight, 1);
      });

      // GEXF中 betweenness 欄位為 betweeness（拼字），也可能有人改成 betweenness
      const g = attr.gexf || {};
      const b = safeNumber(g.betweenness ?? g.betweeness ?? g.betweeness, 0);

      graph.setNodeAttribute(node, "degree", degree);
      graph.setNodeAttribute(node, "weightedDegree", wdegree);
      graph.setNodeAttribute(node, "betweenness", b);

      if (degree > maxDegree) maxDegree = degree;
      if (wdegree > maxWDegree) maxWDegree = wdegree;
      if (b > maxBetweenness) maxBetweenness = b;
    });

    // node size scaling: weightedDegree
    const minSize = 3;
    const maxSize = 12;
    graph.forEachNode((node, attr) => {
      const wd = safeNumber(attr.weightedDegree, 0);
      const t = maxWDegree > 0 ? wd / maxWDegree : 0;
      const size = minSize + t * (maxSize - minSize);
      graph.setNodeAttribute(node, "size", size);
    });

    return {
      graph,
      ranges: {
        edgeWeight: { min: minEdgeW, max: maxEdgeW },
        degree: { min: 0, max: maxDegree },
        weightedDegree: { min: 0, max: maxWDegree },
        betweenness: { min: 0, max: maxBetweenness },
      },
    };
  }

  function setupUI(graph, ranges) {
    // 初始化四個滑桿與提示
    els.edgeWeight.min = String(ranges.edgeWeight.min);
    els.edgeWeight.max = String(ranges.edgeWeight.max);
    els.edgeWeight.step = String(Math.max((ranges.edgeWeight.max - ranges.edgeWeight.min) / 200, 1e-6));
    els.edgeWeight.value = String(ranges.edgeWeight.min);
    els.edgeWeightHint.textContent = `範圍：${fmt.num(ranges.edgeWeight.min)}～${fmt.num(ranges.edgeWeight.max)}（低於門檻之邊會隱藏）`;

    els.degree.min = String(ranges.degree.min);
    els.degree.max = String(ranges.degree.max);
    els.degree.step = "1";
    els.degree.value = "0";
    els.degreeHint.textContent = `範圍：0～${ranges.degree.max}（以整體圖譜計算之degree）`;

    els.wdegree.min = String(ranges.weightedDegree.min);
    els.wdegree.max = String(ranges.weightedDegree.max);
    els.wdegree.step = String(Math.max(ranges.weightedDegree.max / 200, 1e-6));
    els.wdegree.value = "0";
    els.wdegreeHint.textContent = `範圍：0～${fmt.num(ranges.weightedDegree.max)}（以整體圖譜計算之weighted degree）`;

    els.betweenness.min = String(ranges.betweenness.min);
    els.betweenness.max = String(ranges.betweenness.max);
    els.betweenness.step = String(Math.max(ranges.betweenness.max / 200, 1e-6));
    els.betweenness.value = "0";
    els.betweennessHint.textContent = `範圍：0～${fmt.num(ranges.betweenness.max)}（使用GEXF內的betweeness欄位）`;

    // Node list
    const nodes = [];
    graph.forEachNode((node, attr) => {
      nodes.push({ id: node, label: attr.label ?? node });
    });
    nodes.sort((a, b) => (a.label || "").localeCompare(b.label || "", "zh-Hant"));

    els.nodeList.innerHTML = "";

    for (const n of nodes) {
      const row = document.createElement("label");
      row.className = "node-item";
      row.dataset.nodeId = n.id;

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = true;
      cb.dataset.nodeId = n.id;

      const span = document.createElement("span");
      span.className = "node-label";
      span.textContent = n.label;
      span.title = n.label;

      row.appendChild(cb);
      row.appendChild(span);
      els.nodeList.appendChild(row);
    }
  }

  function setupInteractions(state, graph, renderer) {
    // 追蹤滑鼠位置（tooltip定位）
    let lastMouse = { x: 0, y: 0 };
    const main = document.getElementById("main");

    main.addEventListener("mousemove", (e) => {
      const rect = main.getBoundingClientRect();
      lastMouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (state.tooltipVisible) {
        positionTooltip(lastMouse.x, lastMouse.y);
      }
    });

    function positionTooltip(x, y) {
      const pad = 12;
      const tw = els.tooltip.offsetWidth || 300;
      const th = els.tooltip.offsetHeight || 120;
      const rect = main.getBoundingClientRect();
      const maxX = rect.width - tw - pad;
      const maxY = rect.height - th - pad;
      const left = clamp(x + pad, pad, Math.max(pad, maxX));
      const top = clamp(y + pad, pad, Math.max(pad, maxY));
      els.tooltip.style.left = `${left}px`;
      els.tooltip.style.top = `${top}px`;
    }

    // Hover tooltip
    renderer.on("enterNode", ({ node }) => {
      state.hoveredNode = node;
      state.tooltipVisible = true;
      renderTooltip(node);
      els.tooltip.style.display = "block";
      positionTooltip(lastMouse.x, lastMouse.y);
      renderer.refresh();
    });

    renderer.on("leaveNode", () => {
      state.hoveredNode = null;
      state.tooltipVisible = false;
      els.tooltip.style.display = "none";
      renderer.refresh();
    });

    function renderTooltip(node) {
      const attr = graph.getNodeAttributes(node);
      const g = attr.gexf || {};

      const rows = [];
      const push = (k, v) => {
        if (v === undefined || v === null || v === "") return;
        rows.push(
          `<div class="row"><div class="k">${k}</div><div class="v">${String(v)}</div></div>`
        );
      };

      // 标题
      const title = String(attr.label ?? node);

      push("節點ID", node);
      push("邊數（degree）", fmt.int(attr.degree));
      push("加權邊數（weighted degree）", fmt.num(attr.weightedDegree, 3));
      push("中介中心性（betweenness）", fmt.num(attr.betweenness, 6));

      // 常用GEXF屬性
      for (const k of [
        "cluster_label",
        "cluster_index",
        "cluster_universal_index",
        "period",
        "category",
        "level",
        "community_orphan",
        "weight",
        "in-degree",
        "out-degree",
        "betweeness",
      ]) {
        if (k in g) {
          const zh = attrNameZH[k] || k;
          const v = g[k];
          push(zh, Number.isFinite(v) ? fmt.num(v, 6) : v);
        }
      }

      // 其餘屬性（若有）
      const known = new Set([
        "cluster_label",
        "cluster_index",
        "cluster_universal_index",
        "period",
        "category",
        "level",
        "community_orphan",
        "weight",
        "in-degree",
        "out-degree",
        "betweeness",
      ]);
      const rest = Object.keys(g).filter((k) => !known.has(k)).sort();
      for (const k of rest) {
        const zh = attrNameZH[k] || k;
        const v = g[k];
        push(zh, Number.isFinite(v) ? fmt.num(v, 6) : v);
      }

      els.tooltip.innerHTML = `<div class="t-title">${title}</div>${rows.join("")}`;
    }

    // Toolbar: zoom & reset
    const camera = renderer.getCamera();
    const initialState = camera.getState();

    els.zoomIn.addEventListener("click", () => {
      const s = camera.getState();
      camera.setState({ ratio: s.ratio * 0.8 });
    });

    els.zoomOut.addEventListener("click", () => {
      const s = camera.getState();
      camera.setState({ ratio: s.ratio / 0.8 });
    });

    els.reset.addEventListener("click", () => {
      camera.setState({ x: initialState.x, y: initialState.y, ratio: initialState.ratio });
    });
  }

  function makeApp(graph, ranges) {
    // 狀態
    const state = {
      showIsolates: true,
      edgeWeightThreshold: ranges.edgeWeight.min,
      degreeThreshold: 0,
      wdegreeThreshold: 0,
      betweennessThreshold: 0,
      manualVisible: {},
      hoveredNode: null,
      tooltipVisible: false,

      visibleNodes: new Set(),
      visibleEdges: new Set(),
      degreeVisible: {},
    };

    // manualVisible init
    graph.forEachNode((node) => (state.manualVisible[node] = true));

    // 計算可視集合
    function recomputeVisibility() {
      const baseVisible = new Set();
      graph.forEachNode((node, attr) => {
        if (!state.manualVisible[node]) return;
        if (attr.degree < state.degreeThreshold) return;
        if (attr.weightedDegree < state.wdegreeThreshold) return;
        if (attr.betweenness < state.betweennessThreshold) return;
        baseVisible.add(node);
      });

      const hasEdge = {};
      baseVisible.forEach((n) => (hasEdge[n] = false));

      const visibleEdges = new Set();

      graph.forEachEdge((edge, attr, source, target) => {
        const w = safeNumber(attr.weight, 1);
        if (w < state.edgeWeightThreshold) return;
        if (!baseVisible.has(source) || !baseVisible.has(target)) return;
        visibleEdges.add(edge);
        hasEdge[source] = true;
        hasEdge[target] = true;
      });

      const visibleNodes = new Set();
      baseVisible.forEach((n) => {
        if (state.showIsolates) visibleNodes.add(n);
        else if (hasEdge[n]) visibleNodes.add(n);
      });

      // 顯示用的「可視邊數」（依門檻後）
      const degreeVisible = {};
      visibleNodes.forEach((n) => (degreeVisible[n] = 0));
      visibleEdges.forEach((edge) => {
        const s = graph.source(edge);
        const t = graph.target(edge);
        if (visibleNodes.has(s)) degreeVisible[s] += 1;
        if (visibleNodes.has(t)) degreeVisible[t] += 1;
      });

      state.visibleNodes = visibleNodes;
      state.visibleEdges = visibleEdges;
      state.degreeVisible = degreeVisible;

      const shownN = visibleNodes.size;
      const shownE = visibleEdges.size;
      els.stats.textContent = `顯示節點：${shownN}／${payloadStats.nodes}｜顯示邊：${shownE}／${payloadStats.edges}`;
    }

    // Sigma reducers
    const renderer = new Sigma(graph, els.container, {
      zIndex: true,
      renderLabels: true,
      labelDensity: 0.07,
      labelGridCellSize: 60,
      labelRenderedSizeThreshold: 10,
      labelFont: "system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC, Microsoft JhengHei, Arial",
      labelColor: { color: "#e9eef5" },

      nodeReducer: (node, data) => {
        const visible = state.visibleNodes.has(node);
        if (!visible) return { ...data, hidden: true };

        // hover時稍微淡化非hover節點（提升可讀性）
        if (state.hoveredNode && node !== state.hoveredNode) {
          return {
            ...data,
            color: data.color,
            size: Math.max(1, data.size * 0.75),
            label: "", // 只顯示hover節點標籤
          };
        }

        return { ...data };
      },

      edgeReducer: (edge, data) => {
        const visible = state.visibleEdges.has(edge);
        if (!visible) return { ...data, hidden: true };

        if (state.hoveredNode) {
          const s = graph.source(edge);
          const t = graph.target(edge);
          if (s !== state.hoveredNode && t !== state.hoveredNode) {
            return { ...data, hidden: false, color: "rgba(255,255,255,0.07)", size: 0.5 };
          }
          return { ...data, hidden: false, color: "rgba(255,255,255,0.25)", size: 1.2 };
        }

        return { ...data };
      },
    });

    // 初次可視集合
    const payloadStats = {
      nodes: graph.order,
      edges: graph.size,
    };

    // 先跑布局（ForceAtlas2）
    try {
      const FA2 = graphologyLibrary?.layoutForceAtlas2;
      if (FA2 && FA2.assign) {
        const settings = FA2.inferSettings ? FA2.inferSettings(graph) : {};
        FA2.assign(graph, { iterations: 250, settings });
      }
    } catch (e) {
      console.warn("ForceAtlas2 layout failed:", e);
    }

    recomputeVisibility();
    renderer.refresh();

    // UI events
    function syncUI() {
      els.edgeWeightVal.textContent = fmt.num(state.edgeWeightThreshold, 4);
      els.degreeVal.textContent = fmt.int(state.degreeThreshold);
      els.wdegreeVal.textContent = fmt.num(state.wdegreeThreshold, 3);
      els.betweennessVal.textContent = fmt.num(state.betweennessThreshold, 6);
    }

    function refresh() {
      recomputeVisibility();
      syncUI();
      renderer.refresh();
    }

    els.toggleIsolates.addEventListener("change", () => {
      state.showIsolates = !!els.toggleIsolates.checked;
      refresh();
    });

    els.edgeWeight.addEventListener("input", () => {
      state.edgeWeightThreshold = safeNumber(els.edgeWeight.value, ranges.edgeWeight.min);
      refresh();
    });

    els.degree.addEventListener("input", () => {
      state.degreeThreshold = safeNumber(els.degree.value, 0);
      refresh();
    });

    els.wdegree.addEventListener("input", () => {
      state.wdegreeThreshold = safeNumber(els.wdegree.value, 0);
      refresh();
    });

    els.betweenness.addEventListener("input", () => {
      state.betweennessThreshold = safeNumber(els.betweenness.value, 0);
      refresh();
    });

    // Node checkbox list handling (event delegation)
    els.nodeList.addEventListener("change", (e) => {
      const t = e.target;
      if (t && t.tagName === "INPUT" && t.type === "checkbox") {
        const id = t.dataset.nodeId;
        state.manualVisible[id] = !!t.checked;
        refresh();
      }
    });

    // Search
    els.nodeSearch.addEventListener("input", () => {
      const q = (els.nodeSearch.value || "").toLowerCase().trim();
      const rows = els.nodeList.querySelectorAll(".node-item");
      rows.forEach((row) => {
        const id = row.dataset.nodeId;
        const label = graph.getNodeAttribute(id, "label") || id;
        const show = !q || String(label).toLowerCase().includes(q) || id.toLowerCase().includes(q);
        row.style.display = show ? "flex" : "none";
      });
    });

    // Buttons
    els.btnAll.addEventListener("click", () => {
      els.nodeList.querySelectorAll("input[type='checkbox']").forEach((cb) => {
        cb.checked = true;
        state.manualVisible[cb.dataset.nodeId] = true;
      });
      refresh();
    });

    els.btnNone.addEventListener("click", () => {
      els.nodeList.querySelectorAll("input[type='checkbox']").forEach((cb) => {
        cb.checked = false;
        state.manualVisible[cb.dataset.nodeId] = false;
      });
      refresh();
    });

    els.btnInvert.addEventListener("click", () => {
      els.nodeList.querySelectorAll("input[type='checkbox']").forEach((cb) => {
        cb.checked = !cb.checked;
        state.manualVisible[cb.dataset.nodeId] = !!cb.checked;
      });
      refresh();
    });

    // Graph interactions (hover, zoom buttons)
    setupInteractions(state, graph, renderer);

    // Init display
    state.showIsolates = !!els.toggleIsolates.checked;
    state.edgeWeightThreshold = safeNumber(els.edgeWeight.value, ranges.edgeWeight.min);
    syncUI();
    els.loading.style.display = "none";
  }

  let payloadStats = { nodes: 0, edges: 0 };

  async function init() {
    try {
      const payload = await loadJSON();
      payloadStats = payload?.stats || { nodes: 0, edges: 0 };

      const { graph, ranges } = buildGraph(payload);
      setupUI(graph, ranges);

      makeApp(graph, ranges);
    } catch (err) {
      console.error(err);
      els.loading.textContent = "載入失敗：" + (err?.message || String(err));
    }
  }

  init();
})();
