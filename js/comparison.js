(() => {
  const $ = (id) => document.getElementById(id);
  const initialBoard = $("initialBoard"), goalBoard = $("goalBoard");

  /* ---- boards ---- */
  function buildBoard(box) {
    for (let i = 0; i < 9; i++) {
      const inp = document.createElement("input");
      inp.type = "text"; inp.maxLength = 1; inp.inputMode = "numeric";
      inp.addEventListener("input", () => inp.classList.remove("invalid"));
      box.appendChild(inp);
    }
  }
  const writeBoard = (box, s) => [...box.children].forEach((inp, i) => {
    inp.value = s[i] === 0 ? "_" : s[i]; inp.classList.toggle("blank", s[i] === 0);
  });
  const readBoard = (box) => [...box.children].map((inp) => {
    const v = inp.value.trim();
    return v === "" || v === "_" ? 0 : /^[0-8]$/.test(v) ? Number(v) : NaN;
  });
  const msg = (t, type = "danger") => ($("message").innerHTML = `<div class="alert alert-${type} py-2 small mb-0">${t}</div>`);

  function getPuzzle() {
    const initial = readBoard(initialBoard), goal = readBoard(goalBoard);
    let ok = true;
    [[initial, initialBoard], [goal, goalBoard]].forEach(([s, box]) => {
      if (!PUZZLE.isValid(s)) {
        ok = false;
        [...box.children].forEach((inp, i) =>
          inp.classList.toggle("invalid", Number.isNaN(s[i]) || s.filter((x) => x === s[i]).length > 1));
      }
    });
    if (!ok) { msg("Each board must contain digits 0–8 exactly once."); return null; }
    if (!PUZZLE.isSolvable(initial, goal)) { msg("This puzzle is <b>NOT solvable</b>."); return null; }
    if (PUZZLE.sameState(initial, goal)) { msg("Initial and goal are identical.", "info"); return null; }
    $("message").innerHTML = "";
    return { initial, goal };
  }

  /* ---- jobs ---- */
  const memLabel = (b) => (b < 10240 ? "Low" : b < 153600 ? "Medium" : "High");
  const kb = (b) => (b / 1024).toFixed(1) + " KB";

  function jobs(i, g) {
    const h = $("heur").value === "manhattan" ? PUZZLE.manhattan : PUZZLE.misplaced;
    const limit = Number($("dlsLimit").value) || 8;
    return [
      { name: "BFS",   fn: () => OTHERS.run("bfs", i, g) },
      { name: "DFS",   fn: () => OTHERS.run("dfs", i, g) },
      { name: "DLS",   fn: () => OTHERS.run("dls", i, g, { limit }) },
      { name: "IDDLS", fn: () => {
          const r = iddls(i, g, { maxLimit: 31, maxNodes: 2000000, recordCap: 0 });
          return { found: r.found, aborted: r.aborted, moves: r.moves, generated: r.generated,
                   expanded: r.expanded, maxDepth: r.maxDepth, timeMs: r.timeMs, memoryBytes: r.memoryBytes };
        } },
      { name: "GBFS",  fn: () => OTHERS.run("gbfs", i, g, { h }) },
      { name: "A*",    fn: () => OTHERS.run("astar", i, g, { h }) }
    ];
  }

  function compare() {
    const p = getPuzzle();
    if (!p) return;
    $("btnCompare").disabled = true;
    $("results").classList.add("d-none");
    $("loading").classList.remove("d-none");
    const list = jobs(p.initial, p.goal), rows = [];
    let n = 0;
    (function next() {
      if (n < list.length) {
        $("loadingText").textContent = `Running ${list[n].name}…`;
        setTimeout(() => { rows.push({ name: list[n].name, ...list[n].fn() }); n++; next(); }, 40);
      } else {
        $("loading").classList.add("d-none");
        render(rows);
        $("btnCompare").disabled = false;
      }
    })();
  }

  function bars(boxId, rows, pick, fmt) {
    const max = Math.max(...rows.map(pick), 1);
    $(boxId).innerHTML = rows.map((r) => `
      <div class="barrow ${r.name === "IDDLS" ? "mine" : ""} ${r.found ? "" : "fail"}">
        <div class="nm">${r.name}</div>
        <div class="bar"><span data-w="${Math.max(2, (pick(r) / max) * 100)}"></span></div>
        <div class="val">${fmt(pick(r))}</div>
      </div>`).join("");
    requestAnimationFrame(() => requestAnimationFrame(() =>
      $(boxId).querySelectorAll("span").forEach((s) => (s.style.width = s.dataset.w + "%"))));
  }

  function render(rows) {
    const ok = rows.filter((r) => r.found);
    const minMoves = Math.min(...ok.map((r) => r.moves));
    const minExp = Math.min(...ok.map((r) => r.expanded));
    const minTime = Math.min(...ok.map((r) => r.timeMs));
    const num = (x) => x.toLocaleString();

    $("tbody").innerHTML = rows.map((r) => `
      <tr class="${r.name === "IDDLS" ? "mine" : ""}">
        <td class="text-start"><b>${r.name}</b>${r.name === "IDDLS" ? ' <span class="badge bg-primary">my algo</span>' : ""}</td>
        <td>${r.found ? '<span class="badge bg-success">Yes</span>'
                      : `<span class="badge bg-danger">No</span>${r.aborted ? " <small>(node limit)</small>" : ""}`}</td>
        <td>${num(r.generated)}</td>
        <td class="${r.found && r.expanded === minExp ? "best" : ""}">${num(r.expanded)}</td>
        <td>${r.found ? r.moves : "–"}${r.found && r.moves === minMoves ? " ✔" : ""}</td>
        <td class="${r.found && r.timeMs === minTime ? "best" : ""}">${r.timeMs.toFixed(1)} ms</td>
        <td>${memLabel(r.memoryBytes)} <small class="text-muted">(${kb(r.memoryBytes)})</small></td>
      </tr>`).join("");

    const names = (f) => ok.filter(f).map((r) => r.name).join(", ");
    $("insight").innerHTML = ok.length
      ? `<b>Fewest nodes expanded:</b> ${names((r) => r.expanded === minExp)} &nbsp;|&nbsp;
         <b>Shortest solution (${minMoves} moves) found by:</b> ${names((r) => r.moves === minMoves)} &nbsp;|&nbsp;
         <b>Fastest:</b> ${names((r) => r.timeMs === minTime)}.
         ✔ marks optimal solutions; DFS/DLS/GBFS may return longer paths.`
      : "No algorithm found a solution within its limits.";

    bars("chartNodes", rows, (r) => r.expanded, num);
    bars("chartTime", rows, (r) => r.timeMs, (v) => v.toFixed(1) + " ms");
    $("results").classList.remove("d-none");
    $("results").querySelectorAll(".card").forEach((c) => c.classList.add("reveal", "show"));
  }

  /* ---- buttons ---- */
  $("btnDefault").onclick = () => { writeBoard(initialBoard, PUZZLE.DEFAULT_INITIAL); writeBoard(goalBoard, PUZZLE.DEFAULT_GOAL); $("message").innerHTML = ""; };
  $("btnRandom").onclick = () => {
    let goal = readBoard(goalBoard);
    if (!PUZZLE.isValid(goal)) goal = PUZZLE.DEFAULT_GOAL;
    writeBoard(goalBoard, goal); writeBoard(initialBoard, PUZZLE.randomPuzzle(goal));
    msg("Random solvable puzzle generated ✔", "success");
  };
  $("btnCompare").onclick = compare;

  buildBoard(initialBoard); buildBoard(goalBoard);
  writeBoard(initialBoard, PUZZLE.DEFAULT_INITIAL); writeBoard(goalBoard, PUZZLE.DEFAULT_GOAL);
})();