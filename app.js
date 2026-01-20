(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    stats: $("stats"),
    container: $("graph-container"),
    tooltip: $("tooltip"),
    overlay: $("load-overlay"),
    bar: $("load-bar-inner"),
    loadText: $("load-text"),

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
    num: (n, digits = 4) => Number.isFinite(n) ? Number(n).toFixed(digits).replace(/0+$/,"...").replace(/\.$/,"") : "-",
  };

  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const safeNumber = (x, fallback = 0) => {
    const n = (typeof x === "number") ? x : Number(x);
    return Number.isFinite(n) ? n : fallback;
  };

  function setProgress(p, text) {
    const pct = Math.max(0, Math.min(1, p));
    if (els.bar) els.bar.style.width = `${Math.max(6, Math.round(pct * 100))}%`;
    if (els.loadText) els.loadText.textContent = text || "";
  }

  function finishLoading() {
    if (els.overlay) els.overlay.style.display = "none";
  }

  // --- Data decoding (simple obfuscation: base64-encoded minimized JSON) ---
  const DATA_B64 = "eyJuIjpbWzAsImVyZ21zIiwtNy44MTQxOCwwLjEwNTQyLDcuNDM4LCJoc2woMjA0LCA2MCUsIDU1JSkiLDYsMy45MTUzMSwwLjAseyJjdWkiOjIuMCwiY2wiOiJjYXNlIHN0dWR5ICYgbWl4ZWQgbWV0aG9kcyIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjAuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjozLjAsIm91dCI6MS43OTA3Mzc2NTgxOCwibHYiOiJsb3ciLCJpbiI6Mi4xMjQ1NzQ5Njk4NCwibnciOjQuMH1dLFsxLCJzY2hvb2wgdHVybmFyb3VuZCIsLTYuMDE4NDgsMC4yMTA4MSw4LjExOCwiaHNsKDIwNCwgNjAlLCA1NSUpIiw3LDQuNTE1MjYsMC4wLHsiY3VpIjoyLjAsImNsIjoiY2FzZSBzdHVkeSAmIG1peGVkIG1ldGhvZHMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjowLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6My4wLCJvdXQiOjEuOTAwMzY2MzI5NTIsImx2IjoibG93IiwiaW4iOjIuNjE0ODk2MjUyLCJudyI6Ni4wfV0sWzIsImNvbW11bml0aWVzIG9mIHByYWN0aWNlIiw4LjEyMzYyLC01Ljg5NjQxLDUuODUyLCJoc2woMzI2LCA2MCUsIDU1JSkiLDQsMi41MTYzMiwwLjAseyJjdWkiOjQuMCwiY2wiOiJjb21tdW5pdGllcyBvZiBwcmFjdGljZSAmIHRlYWNoZXIgcHJvZmVzc2lvbmFsIGRldmVsb3BtZW50IiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6Mi4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjEuMCwib3V0IjowLjg2ODQ2MzIxNjExNiwibHYiOiJsb3ciLCJpbiI6MS42NDc4NTUwOTE0OSwibnciOjIuMH1dLFszLCJwcm9mZXNzaW9uYWwgbGVhcm5pbmcgY29tbXVuaXR5Iiw4LjQ5NjkxLC01LjY2MTQ5LDUuNTgzLCJoc2woMzI2LCA2MCUsIDU1JSkiLDQsMi4yNzg5NiwwLjAseyJjdWkiOjQuMCwiY2wiOiJjb21tdW5pdGllcyBvZiBwcmFjdGljZSAmIHRlYWNoZXIgcHJvZmVzc2lvbmFsIGRldmVsb3BtZW50IiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6Mi4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjEuMCwib3V0IjoxLjI0NzAyMDA3NzIsImx2IjoibG93IiwiaW4iOjEuMDMxOTQ0MTEzODEsIm53Ijo0LjB9XSxbNCwic29jaWFsIGNhcGl0YWwiLDEuNDk3OTMsMC40NzgzNSw5LjgzNCwiaHNsKDg1LCA2MCUsIDU1JSkiLDE0LDYuMDI5MDksMC4wNDA5OTI2OSx7ImN1aSI6My4wLCJjbCI6ImNvbGxhYm9yYXRpb24gJiBuZXR3b3JrcyIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjEuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjoyLjAsIm91dCI6Mi45NjI4NTA3NTkxNCwibHYiOiJsb3ciLCJpbiI6My4wNjYyMzkwNTI5OCwibnciOjE1LjB9XSxbNSwidGVhY2hlciBsZWFkZXJzaGlwIiwyLjU3OTEsLTMuMDkyNjYsOC4yMywiaHNsKDIwNywgNjAlLCA1NSUpIiw5LDQuNjEzOTcsMC4wNjg2MDkzMSx7ImN1aSI6NS4wLCJjbCI6InRlYWNoZXIgbmV0d29ya3MgJiB0ZWFjaGVyIGxlYWRlcnNoaXAiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjozLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6Ni4wLCJvdXQiOjIuNTExNDgxNzExNDUsImx2IjoibG93IiwiaW4iOjIuMTAyNDkwNDY0MDQsIm53Ijo2LjB9XSxbNiwibWF0aGVtYXRpY3MgdGVhY2hpbmciLDIuMjU1ODcsLTIuNjg2ODUsNy42NDcsImhzbCgyMDcsIDYwJSwgNTUlKSIsNyw0LjA5OTksMC4wMDM4NTQ0Nix7ImN1aSI6NS4wLCJjbCI6InRlYWNoZXIgbmV0d29ya3MgJiB0ZWFjaGVyIGxlYWRlcnNoaXAiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjozLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6Ni4wLCJvdXQiOjEuNjQ5NjU5OTU3NDYsImx2IjoibG93IiwiaW4iOjIuNDUwMjQ0NDI3NjQsIm53Ijo0LjB9XSxbNywiaW5zcGVjdGlvbnMiLC00Ljc3Mzk3LC0xLjIzOTI2LDUuNjIxLCJoc2woMjA0LCA2MCUsIDU1JSkiLDQsMi4zMTI3MiwwLjAwMDIzMTI3LHsiY3VpIjoyLjAsImNsIjoiY2FzZSBzdHVkeSAmIG1peGVkIG1ldGhvZHMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjowLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6My4wLCJvdXQiOjAuMzIxNjgxOTUzNTY1LCJsdiI6ImxvdyIsImluIjoxLjk5MTA0MDUwNzA4LCJudyI6NS4wfV0sWzgsImltcHJvdmVtZW50IiwtMC4wNjkyNywwLjQ1NzEsNS4yNTcsImhzbCg4NSwgNjAlLCA1NSUpIiw1LDEuOTkxNDUsMC4wLHsiY3VpIjozLjAsImNsIjoiY29sbGFib3JhdGlvbiAmIG5ldHdvcmtzIiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6MS4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjIuMCwib3V0IjowLjY0NjczMjEwMzgxMSwibHYiOiJsb3ciLCJpbiI6MS4zNDQ3MjIyMDYwNiwibnciOjQuMH1dLFs5LCJuZXR3b3JrcyIsMC45OTQwNiwxLjAyNDgyLDEyLjAsImhzbCg4NSwgNjAlLCA1NSUpIiwyMCw3Ljk0MDA3LDAuMTY3MDIzNDgseyJjdWkiOjMuMCwiY2wiOiJjb2xsYWJvcmF0aW9uICYgbmV0d29ya3MiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjoxLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6Mi4wLCJvdXQiOjQuMTUyNjEwMTY3NSwibHYiOiJsb3ciLCJpbiI6My43ODc0NTYxNzg0OSwibnciOjI1LjB9XSxbMTAsIm1peGVkIG1ldGhvZHMiLC02LjgzNzkyLDAuMzEyMTgsMTAuMzA1LCJoc2woMjA0LCA2MCUsIDU1JSkiLDEzLDYuNDQ0ODMsMC4wNzAzMDUyNyx7ImN1aSI6Mi4wLCJjbCI6ImNhc2Ugc3R1ZHkgJiBtaXhlZCBtZXRob2RzIiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6MC4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjMuMCwib3V0IjozLjczMDk2ODQwMjY5LCJsdiI6ImxvdyIsImluIjoyLjcxMzg2MzM2MTA4LCJudyI6OC4wfV0sWzExLCJ0ZWFjaGVyIGNvbGxhYm9yYXRpb24iLDUuMjc2NTYsLTMuMjAxNTgsNC43OTksImhzbCgzMjYsIDYwJSwgNTUlKSIsNCwxLjU4NzQ4LDAuMDE4NTAxMzkseyJjdWkiOjQuMCwiY2wiOiJjb21tdW5pdGllcyBvZiBwcmFjdGljZSAmIHRlYWNoZXIgcHJvZmVzc2lvbmFsIGRldmVsb3BtZW50IiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6Mi4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjEuMCwib3V0IjowLjQ2MTM2OTcxMDg5MywibHYiOiJsb3ciLCJpbiI6MS4xMjYxMDUzMjIwNCwibnciOjcuMH1dLFsxMiwic2Nob29sIHJlZm9ybSIsMC4zNTQ5Miw1LjIxNDk5LDYuNzA4LCJoc2woODIsIDYwJSwgNTUlKSIsNywzLjI3MTQsMC4wMzMzMDI1LHsiY3VpIjowLjAsImNsIjoiaW1wcm92ZW1lbnQgc2NpZW5jZSAmIG5ldHdvcmtlZCBpbXByb3ZlbWVudCBjb21tdW5pdGllcyIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjQuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjo0LjAsIm91dCI6My4wMDkyNDU5NTUzLCJsdiI6ImxvdyIsImluIjowLjI2MjE1NDE3MDY1OSwibnciOjE2LjB9XSxbMTMsIm5ldHdvcmtpbmciLDEuOTA2MDMsMC43OTU0OSw4LjcyLCJoc2woODUsIDYwJSwgNTUlKSIsMTQsNS4wNDU5NCwwLjA1ODI3OTM3LHsiY3VpIjozLjAsImNsIjoiY29sbGFib3JhdGlvbiAmIG5ldHdvcmtzIiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6MS4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjIuMCwib3V0IjoyLjUxODA5NjEwOTMzLCJsdiI6ImxvdyIsImluIjoyLjUyNzg0MzQ2OTQ4LCJudyI6OC4wfV0sWzE0LCJzY2hvb2wgbmV0d29ya3MiLC01LjI4MTEzLC0xLjcwNTgyLDUuMDE5LCJoc2woMjA0LCA2MCUsIDU1JSkiLDQsMS43ODE1MywwLjAxOTg4ODk5LHsiY3VpIjoyLjAsImNsIjoiY2FzZSBzdHVkeSAmIG1peGVkIG1ldGhvZHMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjowLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6My4wLCJvdXQiOjEuMDk5NjY3MTYyODEsImx2IjoibG93IiwiaW4iOjAuNjgxODU5NzQxMDU5LCJudyI6MTAuMH1dLFsxNSwicmVmb3JtIiwyLjMzMzc3LC01Ljg2MTk0LDUuODAzLCJoc2woMjA3LCA2MCUsIDU1JSkiLDMsMi40NzI0OCwwLjAseyJjdWkiOjUuMCwiY2wiOiJ0ZWFjaGVyIG5ldHdvcmtzICYgdGVhY2hlciBsZWFkZXJzaGlwIiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6My4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjYuMCwib3V0IjoxLjAsImx2IjoibG93IiwiaW4iOjEuNDcyNDc5NjA4NjYsIm53IjoyLjB9XSxbMTYsImltcHJvdmVtZW50IHNjaWVuY2UiLDAuNzI3NzQsNC4wMzA5NCw5Ljc4NCwiaHNsKDgyLCA2MCUsIDU1JSkiLDksNS45ODUxNCwwLjAwNjE5Nzk2LHsiY3VpIjowLjAsImNsIjoiaW1wcm92ZW1lbnQgc2NpZW5jZSAmIG5ldHdvcmtlZCBpbXByb3ZlbWVudCBjb21tdW5pdGllcyIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjQuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjo0LjAsIm91dCI6Mi44NDQwNjM1Mzg2NSwibHYiOiJsb3ciLCJpbiI6My4xNDEwNzgyODkyMywibnciOjcuMH1dLFsxNywiYnJva2VyYWdlIiwyLjcxMTc4LDIuMzE4MzQsNy4wMTUsImhzbCgzMjMsIDYwJSwgNTUlKSIsNiwzLjU0MjQ5LDAuMCx7ImN1aSI6MS4wLCJjbCI6Imtub3dsZWRnZSBtb2JpbGl6YXRpb24gJiBicm9rZXJhZ2UiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjo1LjAsInAiOjIwMDEyMDI2LjAsImlzbyI6NS4wLCJvdXQiOjEuNzM0MDA5ODg2ODIsImx2IjoibG93IiwiaW4iOjEuODA4NDc5OTQ0ODUsIm53Ijo1LjB9XSxbMTgsImNoYXJ0ZXIgc2Nob29scyIsMi43NDE0MSwtNS44ODM0Niw1LjgwMywiaHNsKDIwNywgNjAlLCA1NSUpIiwzLDIuNDcyNDgsMC4wLHsiY3VpIjo1LjAsImNsIjoidGVhY2hlciBuZXR3b3JrcyAmIHRlYWNoZXIgbGVhZGVyc2hpcCIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjMuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjo2LjAsIm91dCI6MS4wLCJsdiI6ImxvdyIsImluIjoxLjQ3MjQ3OTYwODY2LCJudyI6Mi4wfV0sWzE5LCJhY2NvdW50YWJpbGl0eSIsLTQuODk2MTUsLTAuNjQzNzEsNi42NjQsImhzbCgyMDQsIDYwJSwgNTUlKSIsOCwzLjIzMjM1LDAuMDQ0NjM0Nix7ImN1aSI6Mi4wLCJjbCI6ImNhc2Ugc3R1ZHkgJiBtaXhlZCBtZXRob2RzIiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6MC4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjMuMCwib3V0IjoyLjI0NzYzODA3OTQ2LCJsdiI6ImxvdyIsImluIjowLjk4NDcwOTkyNTE4NywibnciOjEzLjB9XSxbMjAsImNhc2Ugc3R1ZHkiLC01LjUxNTgzLDAuMTY4MTUsOS4xNzksImhzbCgyMDQsIDYwJSwgNTUlKSIsMTIsNS40NTExNiwwLjEyNzQyODMxLHsiY3VpIjoyLjAsImNsIjoiY2FzZSBzdHVkeSAmIG1peGVkIG1ldGhvZHMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjowLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6My4wLCJvdXQiOjIuODY2MzEyMDg1MDYsImx2IjoibG93IiwiaW4iOjIuNTg0ODUyODMwMDQsIm53Ijo3LjB9XSxbMjEsInNvY2lhbCBuZXR3b3JrcyIsLTguMjg4MywwLjMyNzQzLDcuMTk1LCJoc2woMjA0LCA2MCUsIDU1JSkiLDcsMy43MDEyOCwwLjAwNTA4Nzg4LHsiY3VpIjoyLjAsImNsIjoiY2FzZSBzdHVkeSAmIG1peGVkIG1ldGhvZHMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjowLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6My4wLCJvdXQiOjIuMTk0NjA5OTQzOTIsImx2IjoibG93IiwiaW4iOjEuNTA2NjY1Mzc1OTgsIm53Ijo3LjB9XSxbMjIsImlubm92YXRpb24iLC0xMC4wLDAuMzMyNDEsMy40MjIsImhzbCgyMDQsIDYwJSwgNTUlKSIsMSwwLjM3MjA4LDAuMCx7ImN1aSI6Mi4wLCJjbCI6ImNhc2Ugc3R1ZHkgJiBtaXhlZCBtZXRob2RzIiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6MC4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjMuMCwib3V0IjowLjAsImx2IjoibG93IiwiaW4iOjAuMzcyMDgxMzQ5NjM3LCJudyI6NC4wfV0sWzIzLCJlZHVjYXRpb25hbCBjaGFuZ2UiLDIuMTcyMzIsMi42ODU1Myw3LjI2MiwiaHNsKDMyMywgNjAlLCA1NSUpIiw4LDMuNzYwMjUsMC4wMTQ4NzgyLHsiY3VpIjoxLjAsImNsIjoia25vd2xlZGdlIG1vYmlsaXphdGlvbiAmIGJyb2tlcmFnZSIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjUuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjo1LjAsIm91dCI6MS45ODAyNzI2NDY0NiwibHYiOiJsb3ciLCJpbiI6MS43Nzk5ODAyMDAyMywibnciOjcuMH1dLFsyNCwicHJvZmVzc2lvbmFsIGRldmVsb3BtZW50IiwyLjIwNzkxLC0xLjE4ODU3LDguMDgyLCJoc2woMjA3LCA2MCUsIDU1JSkiLDEzLDQuNDgzNDEsMC4xNzc2MTMzMix7ImN1aSI6NS4wLCJjbCI6InRlYWNoZXIgbmV0d29ya3MgJiB0ZWFjaGVyIGxlYWRlcnNoaXAiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjozLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6Ni4wLCJvdXQiOjIuNjY3OTc4OTYyNDMsImx2IjoibG93IiwiaW4iOjEuODE1NDMxODM0OTUsIm53IjoxNS4wfV0sWzI1LCJzY2hvb2wgY2hhbmdlIiwtNC44OTU0LDAuMDkzOTksNS4wNzgsImhzbCgyMDQsIDYwJSwgNTUlKSIsNCwxLjgzMjg1LDAuMCx7ImN1aSI6Mi4wLCJjbCI6ImNhc2Ugc3R1ZHkgJiBtaXhlZCBtZXRob2RzIiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6MC4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjMuMCwib3V0IjowLjI5NTUzNzQwNzM0NCwibHYiOiJsb3ciLCJpbiI6MS41MzczMTY4OTg3MiwibnciOjQuMH1dLFsyNiwidGVhY2hlciBuZXR3b3JrcyIsMi42MTE3OSwtMi42MDE0NSw3LjgyMiwiaHNsKDIwNywgNjAlLCA1NSUpIiw3LDQuMjU0MiwwLjAwMzg1NDQ2LHsiY3VpIjo1LjAsImNsIjoidGVhY2hlciBuZXR3b3JrcyAmIHRlYWNoZXIgbGVhZGVyc2hpcCIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjMuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjo2LjAsIm91dCI6MS44NjYzNzg2NzA1OSwibHYiOiJsb3ciLCJpbiI6Mi4zODc4MjU1OTc2MSwibnciOjYuMH1dLFsyNywicHJvZmVzc2lvbmFsIGxlYXJuaW5nIG5ldHdvcmtzIiw2LjE3MjA2LC0zLjU1NzQ3LDQuMTU2LCJoc2woMzI2LCA2MCUsIDU1JSkiLDIsMS4wMjAyLDAuMCx7ImN1aSI6NC4wLCJjbCI6ImNvbW11bml0aWVzIG9mIHByYWN0aWNlICYgdGVhY2hlciBwcm9mZXNzaW9uYWwgZGV2ZWxvcG1lbnQiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjoyLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6MS4wLCJvdXQiOjAuNTU4ODI3NzIwMjIzLCJsdiI6ImxvdyIsImluIjowLjQ2MTM2OTcxMDg5MywibnciOjcuMH1dLFsyOCwicHJvZmVzc2lvbmFsIGNhcGl0YWwiLDAuMzcwMjUsMC44NzUzLDguNjQ5LCJoc2woODUsIDYwJSwgNTUlKSIsMTMsNC45ODM0MywwLjEyNDAxNzY2LHsiY3VpIjozLjAsImNsIjoiY29sbGFib3JhdGlvbiAmIG5ldHdvcmtzIiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6MS4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjIuMCwib3V0IjoyLjEzMjg2NzU1MjM3LCJsdiI6ImxvdyIsImluIjoyLjg1MDU2NzIzNDI3LCJudyI6MTMuMH1dLFsyOSwiZWR1Y2F0aW9uYWwgaW1wcm92ZW1lbnQiLDAuOTMwMzEsMi44NDI4NCw4LjMyMywiaHNsKDgyLCA2MCUsIDU1JSkiLDEyLDQuNjk1ODIsMC4xMjEzODIzMix7ImN1aSI6MC4wLCJjbCI6ImltcHJvdmVtZW50IHNjaWVuY2UgJiBuZXR3b3JrZWQgaW1wcm92ZW1lbnQgY29tbXVuaXRpZXMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjo0LjAsInAiOjIwMDEyMDI2LjAsImlzbyI6NC4wLCJvdXQiOjIuMzAyMDU1MDkzMTksImx2IjoibG93IiwiaW4iOjIuMzkzNzYxNDA0NDQsIm53Ijo4LjB9XSxbMzAsInNvY2lhbCBuZXR3b3JrIGFuYWx5c2lzIiwyLjUzNzA5LC00LjM0NzUyLDYuMDEyLCJoc2woMjA3LCA2MCUsIDU1JSkiLDcsMi42NTcyLDAuMDMzMzAyNSx7ImN1aSI6NS4wLCJjbCI6InRlYWNoZXIgbmV0d29ya3MgJiB0ZWFjaGVyIGxlYWRlcnNoaXAiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjozLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6Ni4wLCJvdXQiOjIuMzk5MDI3MTU4MDIsImx2IjoibG93IiwiaW4iOjAuMjU4MTY5NDA3MjE1LCJudyI6MjMuMH1dLFszMSwiY29sbGFib3JhdGlvbiIsMC44Nzc5MywwLjU5ODQyLDEwLjczMywiaHNsKDg1LCA2MCUsIDU1JSkiLDE3LDYuODIyNjksMC4wNjk3MDI4OCx7ImN1aSI6My4wLCJjbCI6ImNvbGxhYm9yYXRpb24gJiBuZXR3b3JrcyIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjEuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjoyLjAsIm91dCI6My4zMTg0Nzg5Nzc3NywibHYiOiJsb3ciLCJpbiI6My41MDQyMTAwMTg4OSwibnciOjI5LjB9XSxbMzIsIm5ldHdvcmtlZCBpbXByb3ZlbWVudCBjb21tdW5pdGllcyIsMC40MTA3OSwzLjk1NDYsOS43ODQsImhzbCg4MiwgNjAlLCA1NSUpIiw5LDUuOTg1MTQsMC4wMDYxOTc5Nix7ImN1aSI6MC4wLCJjbCI6ImltcHJvdmVtZW50IHNjaWVuY2UgJiBuZXR3b3JrZWQgaW1wcm92ZW1lbnQgY29tbXVuaXRpZXMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjo0LjAsInAiOjIwMDEyMDI2LjAsImlzbyI6NC4wLCJvdXQiOjIuODQ0MDYzNTM4NjUsImx2IjoibG93IiwiaW4iOjMuMTQxMDc4Mjg5MjMsIm53Ijo3LjB9XSxbMzMsImxlYWRlcnNoaXAiLDEuMTM4NTUsMS4zNzY5NSw4LjIwOCwiaHNsKDg1LCA2MCUsIDU1JSkiLDEyLDQuNTk0OTEsMC4wMzAzOTI5Myx7ImN1aSI6My4wLCJjbCI6ImNvbGxhYm9yYXRpb24gJiBuZXR3b3JrcyIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjEuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjoyLjAsIm91dCI6Mi40OTM3OTExMDM4MSwibHYiOiJsb3ciLCJpbiI6Mi4xMDExMjI0MzgzNywibnciOjIxLjB9XSxbMzQsImtub3dsZWRnZSBtb2JpbGl6YXRpb24iLDEuOTMzODQsMS43ODcyOCw5LjQ4MiwiaHNsKDMyMywgNjAlLCA1NSUpIiwxMiw1LjcxOTA1LDAuMDU5NDg0MTYseyJjdWkiOjEuMCwiY2wiOiJrbm93bGVkZ2UgbW9iaWxpemF0aW9uICYgYnJva2VyYWdlIiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6NS4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjUuMCwib3V0IjoyLjk1ODk3NzQyMjM0LCJsdiI6ImxvdyIsImluIjoyLjc2MDA3NDk5ODYzLCJudyI6Ny4wfV0sWzM1LCJjaGFuZ2UiLDMuMzc5MDQsMC44NTEyMyw0LjU5NCwiaHNsKDg1LCA2MCUsIDU1JSkiLDQsMS40MDYwMSwwLjAseyJjdWkiOjMuMCwiY2wiOiJjb2xsYWJvcmF0aW9uICYgbmV0d29ya3MiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjoxLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6Mi4wLCJvdXQiOjAuNzE2MDM3OTU5NDExLCJsdiI6ImxvdyIsImluIjowLjY4OTk2ODQ5MTg3MSwibnciOjMuMH1dLFszNiwicHJvZmVzc2lvbmFsIGxlYXJuaW5nIGNvbW11bml0aWVzIiwtNy44MTA0NCwwLjUzMTQzLDcuNTU4LCJoc2woMjA0LCA2MCUsIDU1JSkiLDYsNC4wMjA5MywwLjAseyJjdWkiOjIuMCwiY2wiOiJjYXNlIHN0dWR5ICYgbWl4ZWQgbWV0aG9kcyIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjAuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjozLjAsIm91dCI6MS42NTExMjUxNDUwOCwibHYiOiJsb3ciLCJpbiI6Mi4zNjk4MDgyOTM3OSwibnciOjQuMH1dLFszNywibmV0d29yayBhbmFseXNpcyIsMC40ODExOSw2LjU0MzAxLDUuNDY0LCJoc2woODIsIDYwJSwgNTUlKSIsMywyLjE3MzQ4LDAuMCx7ImN1aSI6MC4wLCJjbCI6ImltcHJvdmVtZW50IHNjaWVuY2UgJiBuZXR3b3JrZWQgaW1wcm92ZW1lbnQgY29tbXVuaXRpZXMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjo0LjAsInAiOjIwMDEyMDI2LjAsImlzbyI6NC4wLCJvdXQiOjAuNTUyNTk3MjQ4OTA1LCJsdiI6ImxvdyIsImluIjoxLjYyMDg3ODg4Mzg3LCJudyI6My4wfV0sWzM4LCJkaWZmZXJlbmNlLWluLWRpZmZlcmVuY2VzIiwtNS45NDQxLDAuNTc0Nyw4LjExOCwiaHNsKDIwNCwgNjAlLCA1NSUpIiw3LDQuNTE1MjYsMC4wLHsiY3VpIjoyLjAsImNsIjoiY2FzZSBzdHVkeSAmIG1peGVkIG1ldGhvZHMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjowLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6My4wLCJvdXQiOjEuOTAwMzY2MzI5NTIsImx2IjoibG93IiwiaW4iOjIuNjE0ODk2MjUyLCJudyI6Ni4wfV0sWzM5LCJlZHVjYXRpb25hbCByZWZvcm0iLDIuOTg1MjksMC41Mjc3Nyw0LjkzOSwiaHNsKDg1LCA2MCUsIDU1JSkiLDQsMS43MTA1MywwLjAseyJjdWkiOjMuMCwiY2wiOiJjb2xsYWJvcmF0aW9uICYgbmV0d29ya3MiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjoxLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6Mi4wLCJvdXQiOjAuODE0NzkwOTg3NzIzLCJsdiI6ImxvdyIsImluIjowLjg5NTczOTc2MjAzNSwibnciOjQuMH1dLFs0MCwiY2FwYWNpdHkgYnVpbGRpbmciLDIuNzQ5NzEsMi42OTE4Myw2Ljc0NCwiaHNsKDMyMywgNjAlLCA1NSUpIiw2LDMuMzAyOTUsMC4wLHsiY3VpIjoxLjAsImNsIjoia25vd2xlZGdlIG1vYmlsaXphdGlvbiAmIGJyb2tlcmFnZSIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjUuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjo1LjAsIm91dCI6MS41NTA4MTY2MzYxNiwibHYiOiJsb3ciLCJpbiI6MS43NTIxMzgwODE0MSwibnciOjUuMH1dLFs0MSwic2Nob29sIGltcHJvdmVtZW50IiwtNC4wMTA2LDAuMjE1MzQsNy4zNTMsImhzbCgyMDQsIDYwJSwgNTUlKSIsMTEsMy44NDAzMSwwLjE2OTUxODk2LHsiY3VpIjoyLjAsImNsIjoiY2FzZSBzdHVkeSAmIG1peGVkIG1ldGhvZHMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjowLjAsInAiOjIwMDEyMDI2LjAsImlzbyI6My4wLCJvdXQiOjMuMjIxODg2NDY0NzgsImx2IjoibG93IiwiaW4iOjAuNjE4NDI3MDE5OTgyLCJudyI6MjguMH1dLFs0MiwicHJvZmVzc2lvbmFsaXNtIiwtMC41MDQ5NywxLjA0MzYsNi4zNjEsImhzbCg4NSwgNjAlLCA1NSUpIiw4LDIuOTY1MiwwLjA1MDc0MTE2LHsiY3VpIjozLjAsImNsIjoiY29sbGFib3JhdGlvbiAmIG5ldHdvcmtzIiwiY2F0IjoiY2F0ZWdvcnkiLCJjaSI6MS4wLCJwIjoyMDAxMjAyNi4wLCJpc28iOjIuMCwib3V0IjoxLjE5NTg5Mjc0NDk4LCJsdiI6ImxvdyIsImluIjoxLjc2OTMwODEyMTQ4LCJudyI6OS4wfV0sWzQzLCJlZHVjYXRpb25hbCBsZWFkZXJzaGlwIiwwLjQyODE0LDMuMzE2OCw5LjY3NiwiaHNsKDgyLCA2MCUsIDU1JSkiLDEzLDUuODg5NDUsMC4wODY1MDk0LHsiY3VpIjowLjAsImNsIjoiaW1wcm92ZW1lbnQgc2NpZW5jZSAmIG5ldHdvcmtlZCBpbXByb3ZlbWVudCBjb21tdW5pdGllcyIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjQuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjo0LjAsIm91dCI6My40ODI2NDQ4NzYzOCwibHYiOiJsb3ciLCJpbiI6Mi40MDY4MDQxMDE0OSwibnciOjExLjB9XSxbNDQsInRlYWNoZXIgcHJvZmVzc2lvbmFsIGRldmVsb3BtZW50Iiw3LjU4NjA2LC01LjE3NjM4LDUuNzU0LCJoc2woMzI2LCA2MCUsIDU1JSkiLDUsMi40MjkzMSwwLjAwMTg1MDE0LHsiY3VpIjo0LjAsImNsIjoiY29tbXVuaXRpZXMgb2YgcHJhY3RpY2UgJiB0ZWFjaGVyIHByb2Zlc3Npb25hbCBkZXZlbG9wbWVudCIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjIuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjoxLjAsIm91dCI6MS42Mjk1NTcxODcwMSwibHYiOiJsb3ciLCJpbiI6MC43OTk3NDkxMzM2NDYsIm53Ijo0LjB9XSxbNDUsImVkdWNhdGlvbmFsIGVxdWl0eSIsMC4zMjYyNCw0LjQxNjY3LDcuOTU4LCJoc2woODIsIDYwJSwgNTUlKSIsNyw0LjM3NDIxLDAuMCx7ImN1aSI6MC4wLCJjbCI6ImltcHJvdmVtZW50IHNjaWVuY2UgJiBuZXR3b3JrZWQgaW1wcm92ZW1lbnQgY29tbXVuaXRpZXMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjo0LjAsInAiOjIwMDEyMDI2LjAsImlzbyI6NC4wLCJvdXQiOjEuNjcxOTYwMzQyNjIsImx2IjoibG93IiwiaW4iOjIuNzAyMjQ5MzYwOTUsIm53Ijo0LjB9XSxbNDYsImhvbmcga29uZyIsMy4zMDc3NiwtNC41ODU4NiwzLjcxOSwiaHNsKDIwNywgNjAlLCA1NSUpIiwyLDAuNjM0MTUsMC4wLHsiY3VpIjo1LjAsImNsIjoidGVhY2hlciBuZXR3b3JrcyAmIHRlYWNoZXIgbGVhZGVyc2hpcCIsImNhdCI6ImNhdGVnb3J5IiwiY2kiOjMuMCwicCI6MjAwMTIwMjYuMCwiaXNvIjo2LjAsIm91dCI6MC4wLCJsdiI6ImxvdyIsImluIjowLjYzNDE0NzEyNDc1MywibnciOjQuMH1dLFs0NywibmVvbGliZXJhbGlzbSIsMC4wNTQ3OCw2LjYyNjcxLDUuMzU3LCJoc2woODIsIDYwJSwgNTUlKSIsMywyLjA3OTY1LDAuMCx7ImN1aSI6MC4wLCJjbCI6ImltcHJvdmVtZW50IHNjaWVuY2UgJiBuZXR3b3JrZWQgaW1wcm92ZW1lbnQgY29tbXVuaXRpZXMiLCJjYXQiOiJjYXRlZ29yeSIsImNpIjo0LjAsInAiOjIwMDEyMDI2LjAsImlzbyI6NC4wLCJvdXQiOjAuODk4NjM1ODAwMzY4LCJsdiI6ImxvdyIsImluIjoxLjE4MTAxMzg2NDMxLCJudyI6NC4wfV1dLCJlIjpbWzAsMjEsMC42NDE0XSxbMCwxMCwwLjcwNTI2XSxbMCwzNiwwLjc3NzkxXSxbMSwzOCwxLjBdLFsxLDQxLDAuMzI1MjhdLFsxLDEwLDAuNjExNzhdLFsxLDIwLDAuNjc3ODNdLFsyLDMsMC44MjM5M10sWzIsNDQsMC44MjM5M10sWzMsMiwwLjQ5MTgxXSxbMyw0NCwwLjU0MDE0XSxbNCwxMywwLjM2MDQ0XSxbNCwyOCwwLjQ1NzY1XSxbNCwzMSwwLjM4NzA4XSxbNCwzMywwLjQ0NzgxXSxbNCwzNCwwLjUwMTUxXSxbNCw5LDAuNDQ0NzJdLFs0LDI0LDAuNDY3MDNdLFs1LDMwLDAuNDYyMzZdLFs1LDI2LDAuNjU3MjldLFs1LDI0LDAuMzQ3NjFdLFs1LDYsMC42MzUyM10sWzYsMzAsMC4yODY2M10sWzYsMjYsMC44NzAzNF0sWzYsNSwwLjg3MDM0XSxbNiwyNCwwLjQyMjk0XSxbNyw0MSwwLjQyOTg3XSxbNywxNCwwLjgwNzk2XSxbNywxOSwwLjc1MzIxXSxbOCw0MiwwLjQ4NzUyXSxbOCwzMSwwLjQzOTYxXSxbOCw5LDAuNDE3NTldLFs5LDQsMC40MjExOF0sWzksMTMsMC4yODYwMV0sWzksMjgsMC4zNjcyM10sWzksMjksMC4zMjIwNV0sWzksNDMsMC4yNzY1Nl0sWzksMzEsMC43MDg4MV0sWzksNDIsMC4zNjA2NF0sWzksMzMsMC40MTExNV0sWzksMzQsMC4zMTU2NF0sWzksMjQsMC4zMTgxN10sWzEwLDAsMC40MzE4OV0sWzEwLDEsMC4zNzg0Nl0sWzEwLDM4LDAuMzc4NDZdLFsxMCwzNiwwLjM5NzQzXSxbMTAsMjAsMC4zODYwMl0sWzEwLDIxLDAuNDYwNTFdLFsxMCw0MSwwLjI4MTA5XSxbMTEsMjcsMC41NTg4M10sWzExLDQ0LDAuMjY1NDldLFsxMSwyNCwwLjMwMTc5XSxbMTIsNDMsMC4yNjIxNV0sWzEzLDQsMC4zNzIwOF0sWzEzLDM5LDAuNDUzNjddLFsxMywyOCwwLjMyMzU0XSxbMTMsMzEsMC4zMTcyN10sWzEzLDMzLDAuNDI4NzJdLFsxMyw5LDAuMzExMTVdLFsxMywzNSwwLjMyMTQyXSxbMTQsNywwLjMyMTY4XSxbMTQsMTksMC4zNjAxOF0sWzE1LDMwLDAuNDcyNDhdLFsxNSwxOCwxLjBdLFsxNiwxMiwwLjM5MjU5XSxbMTYsNDUsMC42NDIyXSxbMTYsMzIsMS4wXSxbMTYsNDMsMC42NDA2OV0sWzE2LDI5LDAuNDY1NTldLFsxNywzNCwwLjY4NzEyXSxbMTcsNDAsMC41OTE2MV0sWzE3LDIzLDAuNTI5NzRdLFsxOCwzMCwwLjQ3MjQ4XSxbMTgsMTUsMS4wXSxbMTksMjAsMC4yNTgyNl0sWzE5LDQxLDAuNDM0NzRdLFsxOSwxNCwwLjI5MTddLFsyMCwzOCwwLjUyMTldLFsyMCwxLDAuNTIxOV0sWzIwLDI1LDAuMjk1NTRdLFsyMCwxOSwwLjMwNzg1XSxbMjAsNDEsMC40NTY3NV0sWzIwLDEwLDAuNDgwOTFdLFsyMSwwLDAuNDc1NzhdLFsyMSwxMCwwLjU1NTFdLFsyMSwzNiwwLjQ3NTc4XSxbMjIsMjEsMC4zNzIwOF0sWzIzLDE3LDAuNDY3NzVdLFsyMyw0MCwwLjQ2Nzc1XSxbMjMsMjksMC4yNzUxMV0sWzIzLDM0LDAuNTY5MzhdLFsyNCw0LDAuMzgxM10sWzI0LDMxLDAuMjcwMjNdLFsyNCwyNiwwLjMzODc0XSxbMjQsNSwwLjI4ODQxXSxbMjQsNiwwLjI2MzM1XSxbMjQsOSwwLjI3MzRdLFsyNSwyMCwwLjU3NzFdLFsyNSw0MSwwLjQ2Mjk3XSxbMjUsMTksMC40OTcyNV0sWzI2LDMwLDAuMzgzMzddLFsyNiw1LDAuNzgyMTJdLFsyNiwyNCwwLjQ3MTI1XSxbMjYsNiwwLjc1MTA4XSxbMjcsMTEsMC40NjEzN10sWzI4LDQsMC41NDA2MV0sWzI4LDEzLDAuMzY5NjFdLFsyOCwzMSwwLjQyNTgyXSxbMjgsMzMsMC40ODE3MV0sWzI4LDM0LDAuMzIzNjZdLFsyOCw0MSwwLjI1NDkxXSxbMjgsOSwwLjQ1NDI0XSxbMjksNDMsMC41NTg3N10sWzI5LDE2LDAuNDU2M10sWzI5LDMyLDAuNDU2M10sWzI5LDMzLDAuMzA5NDVdLFsyOSwyMywwLjI5MTYzXSxbMjksOSwwLjMyMTMzXSxbMzAsNSwwLjI1ODE3XSxbMzEsNCwwLjM5NjQ2XSxbMzEsMTMsMC4zMTUzOF0sWzMxLDI4LDAuMzcxNDJdLFszMSw0MywwLjI2NjE0XSxbMzEsOCwwLjI4MzQzXSxbMzEsNDIsMC4zNDc3M10sWzMxLDMzLDAuNDE0OTZdLFszMSw5LDAuNzY5NDldLFszMSwyNCwwLjMzOTJdLFszMiw0MywwLjY0MDY5XSxbMzIsMTYsMS4wXSxbMzIsMTIsMC4zOTI1OV0sWzMyLDI5LDAuNDY1NTldLFszMiw0NSwwLjY0MjJdLFszMyw0LDAuMzgzODRdLFszMywxMywwLjM1NjY4XSxbMzMsMjgsMC4zNTgyOF0sWzMzLDI5LDAuMjgxMTJdLFszMywzMSwwLjM0ODQyXSxbMzMsOSwwLjM3Mjc5XSxbMzQsNCwwLjQ2NzM5XSxbMzQsNDAsMC40OTE0Nl0sWzM0LDIzLDAuNTk3MjNdLFszNCwxNywwLjYzNzQ2XSxbMzQsOSwwLjMxMTc4XSxbMzQsMjgsMC4yNTQ3Nl0sWzM1LDEzLDAuMzI4ODVdLFszNSwzOSwwLjM2MTEyXSxbMzYsMCwwLjg4MzA2XSxbMzYsMjEsMC43MjA2Ml0sWzM2LDEwLDAuNzY2MTNdLFszNywxMiwwLjcyMjI0XSxbMzcsNDcsMC44OTg2NF0sWzM4LDIwLDAuNjc3ODNdLFszOCw0MSwwLjMyNTI4XSxbMzgsMSwxLjBdLFszOCwxMCwwLjYxMTc4XSxbMzksMTMsMC41MDExMl0sWzM5LDM1LDAuMzk0NjJdLFs0MCwzNCwwLjU2MTY3XSxbNDAsMTcsMC42Mjg4XSxbNDAsMjMsMC41NjE2N10sWzQxLDIwLDAuMjg5MjddLFs0MSwxOSwwLjMyOTE2XSxbNDIsNDMsMC4yNTc2Nl0sWzQyLDMxLDAuNDIxMjNdLFs0Miw5LDAuNDc2MTJdLFs0Miw0MSwwLjI1MDk5XSxbNDIsOCwwLjM2MzNdLFs0MywxMiwwLjQyMDY0XSxbNDMsNDUsMC4zODc1Nl0sWzQzLDMyLDAuNTUzMDFdLFs0MywyOSwwLjQ5MjU4XSxbNDMsMTYsMC41NTMwMV0sWzQ0LDMsMC40MjMwOV0sWzQ0LDIsMC4zNzY2Nl0sWzQ1LDEyLDAuNDUyNzddLFs0NSwxNiwwLjgzNDc2XSxbNDUsMzIsMC44MzQ3Nl0sWzQ1LDQzLDAuNTc5OTddLFs0NiwzMCwwLjMyMTcxXSxbNDYsNSwwLjMxMjQ0XSxbNDcsMTIsMC42Mjg0Ml0sWzQ3LDM3LDAuNTUyNl1dLCJyIjp7InciOlswLjI1MDk5LDEuMF0sImRlZyI6WzAsMjBdLCJ3ZCI6WzAuMCw3Ljk0MDA3XSwiYnQiOlswLjAsMC4xNzc2MTMzMl19LCJtIjp7InQiOiJ1bmRpcmVjdGVkIiwidiI6MX19";
  function decodeData() {
    const jsonText = atob(DATA_B64);
    return JSON.parse(jsonText);
  }

  // Short-key attribute map -> Traditional Chinese labels
  const attrNameZH = {
    cl: "聚類標籤（cluster label）",
    ci: "聚類編號（cluster index）",
    cui: "聚類通用編號（cluster universal index）",
    p: "期間（period）",
    cat: "類別（category）",
    lv: "層級（level）",
    iso: "孤立標記（community_orphan）",
    nw: "節點權重（weight）",
    indeg: "入度（in-degree）",
    outdeg: "出度（out-degree）",
    b0: "中介中心性（betweeness）",
  };

  function buildGraph(bundle) {
    const Graph = graphology.Graph;
    const g = new Graph({ type: "undirected" });

    // nodes: [idx, label, x, y, size, color, degree, wdegree, betweenness, attrs]
    for (const n of bundle.n) {
      const id = String(n[0]);
      g.addNode(id, {
        label: n[1],
        x: safeNumber(n[2], 0),
        y: safeNumber(n[3], 0),
        size: safeNumber(n[4], 4),
        color: n[5] || "#94a3b8",
        degree: safeNumber(n[6], 0),
        weightedDegree: safeNumber(n[7], 0),
        betweenness: safeNumber(n[8], 0),
        a: n[9] || {},
      });
    }

    // edges: [sourceIdx, targetIdx, weight]
    let i = 0;
    for (const e of bundle.e) {
      const s = String(e[0]);
      const t = String(e[1]);
      if (!g.hasNode(s) || !g.hasNode(t)) continue;
      const w = safeNumber(e[2], 1);
      g.addEdgeWithKey(`e${i++}`, s, t, {
        weight: w,
        size: 1,
        color: "rgba(255,255,255,0.14)",
      });
    }

    return g;
  }

  function setupUI(graph, ranges) {
    // slider bounds
    els.edgeWeight.min = String(ranges.wMin);
    els.edgeWeight.max = String(ranges.wMax);
    els.edgeWeight.step = String(Math.max((ranges.wMax - ranges.wMin) / 200, 1e-6));
    els.edgeWeight.value = String(ranges.wMin);
    els.edgeWeightHint.textContent = `範圍：${fmt.num(ranges.wMin)}～${fmt.num(ranges.wMax)}（低於門檻之邊會隱藏）`;

    els.degree.min = "0";
    els.degree.max = String(ranges.dMax);
    els.degree.step = "1";
    els.degree.value = "0";
    els.degreeHint.textContent = `範圍：0～${ranges.dMax}（以資料端預先計算之degree）`;

    els.wdegree.min = "0";
    els.wdegree.max = String(ranges.wdMax);
    els.wdegree.step = String(Math.max(ranges.wdMax / 200, 1e-6));
    els.wdegree.value = "0";
    els.wdegreeHint.textContent = `範圍：0～${fmt.num(ranges.wdMax)}（以資料端預先計算之weighted degree）`;

    els.betweenness.min = "0";
    els.betweenness.max = String(ranges.bMax);
    els.betweenness.step = String(Math.max(ranges.bMax / 200, 1e-6));
    els.betweenness.value = "0";
    els.betweennessHint.textContent = `範圍：0～${fmt.num(ranges.bMax, 6)}（以資料端預先提供之betweenness）`;

    // node list
    const list = [];
    graph.forEachNode((node, attr) => {
      list.push({ id: node, label: attr.label || node });
    });
    list.sort((a, b) => (a.label || "").localeCompare(b.label || "", "zh-Hant"));

    els.nodeList.innerHTML = "";
    for (const n of list) {
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

  function makeTooltipHTML(nodeId, graph) {
    const attr = graph.getNodeAttributes(nodeId);
    const a = attr.a || {};

    const rows = [];
    const push = (k, v) => {
      if (v === undefined || v === null || v === "") return;
      rows.push(`<div class="row"><div class="k">${k}</div><div class="v">${String(v)}</div></div>`);
    };

    const title = String(attr.label || nodeId);
    push("節點ID", nodeId);
    push("邊數（degree）", fmt.int(attr.degree));
    push("加權邊數（weighted degree）", fmt.num(attr.weightedDegree, 3));
    push("中介中心性（betweenness）", fmt.num(attr.betweenness, 6));

    const order = ["cl","ci","cui","p","cat","lv","iso","nw","indeg","outdeg","b0"];
    for (const k of order) {
      if (k in a) {
        const zh = attrNameZH[k] || k;
        const v = a[k];
        push(zh, Number.isFinite(v) ? fmt.num(v, 6) : v);
      }
    }

    // any remaining attrs
    const rest = Object.keys(a).filter((k) => !order.includes(k)).sort();
    for (const k of rest) {
      const zh = attrNameZH[k] || k;
      const v = a[k];
      push(zh, Number.isFinite(v) ? fmt.num(v, 6) : v);
    }

    return `<div class="t-title">${title}</div>${rows.join("")}`;
  }

  function main() {
    setProgress(0.10, "讀取展示資料");
    const bundle = decodeData();

    setProgress(0.35, "建立圖結構");
    const graph = buildGraph(bundle);

    const ranges = bundle.r;

    setProgress(0.55, "初始化控制面板");
    setupUI(graph, ranges);

    // --- State ---
    const state = {
      showIsolates: true,
      edgeWeightThreshold: ranges.wMin,
      degreeThreshold: 0,
      wdegreeThreshold: 0,
      betweennessThreshold: 0,
      manualVisible: {},
      hoveredNode: null,
      tooltipVisible: false,
      visibleNodes: new Set(),
      visibleEdges: new Set(),
    };
    graph.forEachNode((n) => (state.manualVisible[n] = true));

    function recomputeVisibility() {
      const baseVisible = new Set();
      graph.forEachNode((node, attr) => {
        if (!state.manualVisible[node]) return;
        if (attr.degree < state.degreeThreshold) return;
        if (attr.weightedDegree < state.wdegreeThreshold) return;
        if (attr.betweenness < state.betweennessThreshold) return;
        baseVisible.add(node);
      });

      const hasEdge = Object.create(null);
      baseVisible.forEach((n) => (hasEdge[n] = false));

      const vEdges = new Set();
      graph.forEachEdge((edge, attr, s, t) => {
        const w = safeNumber(attr.weight, 1);
        if (w < state.edgeWeightThreshold) return;
        if (!baseVisible.has(s) || !baseVisible.has(t)) return;
        vEdges.add(edge);
        hasEdge[s] = true;
        hasEdge[t] = true;
      });

      const vNodes = new Set();
      baseVisible.forEach((n) => {
        if (state.showIsolates) vNodes.add(n);
        else if (hasEdge[n]) vNodes.add(n);
      });

      state.visibleNodes = vNodes;
      state.visibleEdges = vEdges;

      els.stats.textContent = `顯示節點：${vNodes.size}／${bundle.s.n}｜顯示邊：${vEdges.size}／${bundle.s.e}`;
    }

    // --- Renderer ---
    setProgress(0.75, "初始化渲染器");
    const renderer = new Sigma(graph, els.container, {
      zIndex: true,
      renderLabels: true,
      labelDensity: 0.07,
      labelGridCellSize: 60,
      labelRenderedSizeThreshold: 12,
      labelFont: "system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC, Microsoft JhengHei, Arial",
      labelColor: { color: "#e9eef5" },

      nodeReducer: (node, data) => {
        if (!state.visibleNodes.has(node)) return { ...data, hidden: true };
        if (state.hoveredNode && node !== state.hoveredNode) {
          return { ...data, size: Math.max(1, data.size * 0.75), label: "" };
        }
        return data;
      },

      edgeReducer: (edge, data) => {
        if (!state.visibleEdges.has(edge)) return { ...data, hidden: true };
        if (state.hoveredNode) {
          const s = graph.source(edge);
          const t = graph.target(edge);
          if (s !== state.hoveredNode && t !== state.hoveredNode) {
            return { ...data, color: "rgba(255,255,255,0.07)", size: 0.5 };
          }
          return { ...data, color: "rgba(255,255,255,0.25)", size: 1.2 };
        }
        return data;
      },
    });

    recomputeVisibility();
    renderer.refresh();

    // --- Tooltip positioning ---
    const mainEl = document.getElementById("main");
    let lastMouse = { x: 0, y: 0 };

    function positionTooltip(x, y) {
      const pad = 12;
      const tw = els.tooltip.offsetWidth || 320;
      const th = els.tooltip.offsetHeight || 140;
      const rect = mainEl.getBoundingClientRect();
      const maxX = rect.width - tw - pad;
      const maxY = rect.height - th - pad;
      const left = clamp(x + pad, pad, Math.max(pad, maxX));
      const top = clamp(y + pad, pad, Math.max(pad, maxY));
      els.tooltip.style.left = `${left}px`;
      els.tooltip.style.top = `${top}px`;
    }

    mainEl.addEventListener("mousemove", (e) => {
      const rect = mainEl.getBoundingClientRect();
      lastMouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (state.tooltipVisible) positionTooltip(lastMouse.x, lastMouse.y);
    });

    renderer.on("enterNode", ({ node }) => {
      state.hoveredNode = node;
      state.tooltipVisible = true;
      els.tooltip.innerHTML = makeTooltipHTML(node, graph);
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

    // --- Toolbar ---
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

    // --- UI wiring (update labels on input; apply filters on change) ---
    function syncNumbers() {
      els.edgeWeightVal.textContent = fmt.num(state.edgeWeightThreshold, 4);
      els.degreeVal.textContent = fmt.int(state.degreeThreshold);
      els.wdegreeVal.textContent = fmt.num(state.wdegreeThreshold, 3);
      els.betweennessVal.textContent = fmt.num(state.betweennessThreshold, 6);
    }

    function applyFromControls() {
      state.showIsolates = !!els.toggleIsolates.checked;
      state.edgeWeightThreshold = safeNumber(els.edgeWeight.value, ranges.wMin);
      state.degreeThreshold = safeNumber(els.degree.value, 0);
      state.wdegreeThreshold = safeNumber(els.wdegree.value, 0);
      state.betweennessThreshold = safeNumber(els.betweenness.value, 0);
      syncNumbers();
      recomputeVisibility();
      renderer.refresh();
    }

    // init displayed numbers
    applyFromControls();

    els.toggleIsolates.addEventListener("change", applyFromControls);

    // sliders: input just previews number; change applies (better performance)
    const bindSlider = (el, setter) => {
      el.addEventListener("input", () => {
        setter();
        syncNumbers();
      });
      el.addEventListener("change", applyFromControls);
    };

    bindSlider(els.edgeWeight, () => (state.edgeWeightThreshold = safeNumber(els.edgeWeight.value, ranges.wMin)));
    bindSlider(els.degree, () => (state.degreeThreshold = safeNumber(els.degree.value, 0)));
    bindSlider(els.wdegree, () => (state.wdegreeThreshold = safeNumber(els.wdegree.value, 0)));
    bindSlider(els.betweenness, () => (state.betweennessThreshold = safeNumber(els.betweenness.value, 0)));

    // node list toggles
    els.nodeList.addEventListener("change", (e) => {
      const t = e.target;
      if (!t || t.tagName !== "INPUT") return;
      const node = t.dataset.nodeId;
      if (!node) return;
      state.manualVisible[node] = !!t.checked;
      recomputeVisibility();
      renderer.refresh();
    });

    // bulk buttons
    els.btnAll.addEventListener("click", () => {
      els.nodeList.querySelectorAll("input[type=checkbox]").forEach((cb) => {
        cb.checked = true;
        state.manualVisible[cb.dataset.nodeId] = true;
      });
      recomputeVisibility();
      renderer.refresh();
    });

    els.btnNone.addEventListener("click", () => {
      els.nodeList.querySelectorAll("input[type=checkbox]").forEach((cb) => {
        cb.checked = false;
        state.manualVisible[cb.dataset.nodeId] = false;
      });
      recomputeVisibility();
      renderer.refresh();
    });

    els.btnInvert.addEventListener("click", () => {
      els.nodeList.querySelectorAll("input[type=checkbox]").forEach((cb) => {
        cb.checked = !cb.checked;
        state.manualVisible[cb.dataset.nodeId] = cb.checked;
      });
      recomputeVisibility();
      renderer.refresh();
    });

    // search filter
    els.nodeSearch.addEventListener("input", () => {
      const q = (els.nodeSearch.value || "").trim().toLowerCase();
      els.nodeList.querySelectorAll(".node-item").forEach((row) => {
        const label = (row.querySelector(".node-label")?.textContent || "").toLowerCase();
        row.style.display = (!q || label.includes(q)) ? "flex" : "none";
      });
    });

    setProgress(1.0, "完成");
    finishLoading();
  }

  // Boot
  try {
    setProgress(0.05, "準備中");
    // Ensure libs exist
    if (typeof Sigma === "undefined" || typeof graphology === "undefined") {
      setProgress(0.05, "載入前端函式庫…");
      // If libraries are still loading, wait a tick
      setTimeout(() => main(), 0);
    } else {
      main();
    }
  } catch (err) {
    console.error(err);
    setProgress(0.10, "載入失敗：請開啟瀏覽器Console查看錯誤");
  }
})();
