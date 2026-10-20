/* Solver page: input boards + animated playback of the steps recorded by iddls() */
(() => {
  const $ = (id) => document.getElementById(id);
  const initialBoard = $("initialBoard"), goalBoard = $("goalBoard"), stage = $("stageBoard");

  /* ================= 1. INPUT BOARDS ================= */
  function buildBoard(box) {
    box.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const inp = document.createElement("input");
      inp.type = "text"; inp.maxLength = 1; inp.inputMode = "numeric";
      inp.addEventListener("input", () => inp.classList.remove("invalid"));
      box.appendChild(inp);
    }
  }
  function writeBoard(box, state) {
    [...box.children].forEach((inp, i) => {
      inp.value = state[i] === 0 ? "_" : state[i];
      inp.classList.toggle("blank", state[i] === 0);
    });
  }
  function readBoard(box) {
    return [...box.children].map((inp) => {
      const v = inp.value.trim();
      return v === "" || v === "_" ? 0 : /^[0-8]$/.test(v) ? Number(v) : NaN;
    });
  }
  function showMessage(text, type = "danger") {
    $("message").innerHTML = `<div class="alert alert-${type} py-2 small mb-0">${text}</div>`;
  }
  function getValidatedPuzzle() {
    const initial = readBoard(initialBoard), goal = readBoard(goalBoard);
    let ok = true;
    [[initial, initialBoard], [goal, goalBoard]].forEach(([s, box]) => {
      if (!PUZZLE.isValid(s)) {
        ok = false;
        [...box.children].forEach((inp, i) => {
          inp.classList.toggle("invalid", Number.isNaN(s[i]) || s.filter((x) => x === s[i]).length > 1);
        });
      }
    });
    if (!ok) { showMessage("Each board must contain digits 0–8 exactly once (0 or _ = blank)."); return null; }
    if (!PUZZLE.isSolvable(initial, goal)) {
      showMessage("This puzzle is <b>NOT solvable</b> (parity mismatch). Change a state or use Random."); return null;
    }
    showMessage("Puzzle is valid and solvable ✔", "success");
    return { initial, goal };
  }

  /* ================= 2. STAGE BOARD (animated tiles) ================= */
  const tiles = {};
  for (let n = 1; n <= 8; n++) {
    const d = document.createElement("div");
    d.className = "stile"; d.textContent = n;
    stage.appendChild(d); tiles[n] = d;
  }
  let lastDrawn = null;
  function drawStage(state) {
    state.forEach((v, i) => {
      if (!v) return;
      const t = tiles[v];
      t.style.setProperty("--r", Math.floor(i / 3));
      t.style.setProperty("--c", i % 3);
      t.classList.toggle("moved", !!lastDrawn && lastDrawn[i] !== v); // tile that just slid
    });
    lastDrawn = state;
  }

  const mini = (state, cls = "") => state
    ? `<div class="mini-board ${cls}">${state.map((v) => `<div class="${v === 0 ? "blank" : ""}">${v === 0 ? "" : v}</div>`).join("")}</div>`
    : `<span class="text-muted small">—</span>`;

  /* ================= 3. PLAYBACK STATE ================= */
  const SPEEDS = [[1200,1],[700,1],[400,1],[220,1],[120,1],[60,1],[30,1],[15,2],[8,5],[4,15]]; // [delay ms, frames per tick]
  let frames = [], idx = 0, timer = null, playing = false;
  let result = null, runInitial = null, iterStart = [], goalFrame = -1, pathStart = 0;

  function buildFrames(r) {
    frames = r.steps.map((s) => ({ k: "s", s }));
    iterStart = [];
    r.steps.forEach((s, i) => { if (s.type === "iteration") iterStart[s.limit] = i; });
    goalFrame = r.steps.findIndex((s) => s.type === "goal");
    pathStart = frames.length;
    if (r.found) r.path.forEach((p, i) => frames.push({ k: "p", i, p }));
  }

  // data for a search frame ("iteration" markers have no state, so borrow from neighbours)
  function dataOf(e) {
    const s = frames[e].s;
    if (s.type !== "iteration") return s;
    const p = e > 0 ? frames[e - 1].s : null;
    return { type: "iteration", limit: s.limit, state: runInitial, parent: null, move: null,
      depth: 0, cost: 0, children: [], frontier: [runInitial],
      generated: p ? p.generated : 1, expanded: p ? p.expanded : 0 };
  }

  /* ================= 4. RENDER ================= */
  function render() {
    const f = frames[idx], last = frames.length - 1;
    const e = f.k === "s" ? idx : pathStart - 1;
    const d = dataOf(e);
    let state = d.state, parent = d.parent, kids = d.children, depth = d.depth, cost = d.cost, move = d.move, label;

    if (f.k === "p") {
      state = f.p.state; move = f.p.move; depth = cost = f.i; kids = [];
      parent = f.i > 0 ? result.path[f.i - 1].state : null;
      label = `Replaying solution: step ${f.i} of ${result.moves}`;
    } else if (d.type === "iteration") label = `New iteration: depth limit ${d.limit}`;
    else label = { expand: "Expanding node", cutoff: "Cutoff: depth limit reached", goal: "Goal state reached!" }[d.type];

    // explored list = nodes handled earlier in this iteration
    const start = iterStart[d.limit], explored = [];
    for (let j = e; j > start && j > e - 8; j--) explored.push(frames[j].s.state);

    drawStage(state);
    stage.classList.toggle("solved", (f.k === "p" && f.i === result.moves) || (f.k === "s" && d.type === "goal"));
    $("phaseLabel").textContent = label;
    $("stageCaption").textContent = f.k === "p"
      ? (f.i === 0 ? "Step 0 · initial state" : `Step ${f.i} · blank moved ${move}`)
      : (move ? `Reached by moving blank ${move}` : "Root node (initial state)");

    $("sLimit").textContent = d.limit;   $("sDepth").textContent = depth;
    $("sCost").textContent = cost;       $("sMove").textContent = move || "–";
    $("sGen").textContent = d.generated; $("sExp").textContent = d.expanded;
    $("sFront").textContent = d.frontier.length; $("sExplored").textContent = e - start;
    $("frontCount").textContent = d.frontier.length; $("exploredCount").textContent = e - start;

    $("currentBox").innerHTML = mini(state, "active");
    $("parentBox").innerHTML = mini(parent);
    $("succBox").innerHTML = kids.length
      ? kids.map((c) => `<div class="succ">${mini(c.state)}<small>${c.move}</small></div>`).join("")
      : `<span class="text-muted small">${d.type === "cutoff" ? "Cutoff: node not expanded" : "None"}</span>`;
    $("frontBox").innerHTML = d.frontier.slice(-8).reverse().map((s) => mini(s)).join("") || `<span class="text-muted small">Empty</span>`;
    $("exploredBox").innerHTML = explored.map((s) => mini(s)).join("") || `<span class="text-muted small">Empty</span>`;

    $("pathBox").innerHTML = f.k === "p"
      ? result.path.slice(0, f.i + 1).map((n, i) =>
          `<div class="path-step ${i === f.i ? "now" : ""}">${mini(n.state, i === result.moves ? "goal" : "")}<br>${i === 0 ? "Start" : "#" + i + " " + n.move}</div>`).join("")
      : `<span class="text-muted small">${result.found ? "Appears during the solution replay (or press “Skip to solution”)." : "No solution path."}</span>`;

    $("bar").style.width = (last ? (idx / last) * 100 : 100) + "%";
    $("frameInfo").textContent = `Frame ${idx + 1} / ${frames.length}`;
    const showAt = result.found ? (goalFrame >= 0 ? goalFrame : pathStart) : last;
    $("summary").classList.toggle("d-none", idx < showAt);
    setButtons();
  }

  function setButtons() {
    const has = frames.length > 0, last = frames.length - 1;
    $("btnPause").disabled = !playing;
    $("btnResume").disabled = !has || playing;
    $("btnNext").disabled = !has || idx >= last;
    $("btnPrev").disabled = !has || idx <= 0;
    $("btnSkip").disabled = !has || idx >= (result.found ? pathStart : last);
    let t = "Idle", c = "";
    if (has) {
      if (idx >= last && !playing) { t = result.found ? "Solved ✔" : "No solution"; c = result.found ? "s-ok" : "s-bad"; }
      else if (playing) { t = frames[idx].k === "p" ? "Replaying solution" : "Searching…"; c = "s-run"; }
      else { t = "Paused"; c = "s-pause"; }
    }
    $("statusBadge").textContent = t;
    $("statusBadge").className = "badge status-badge " + c;
  }

  function buildSummary(r) {
    $("summaryTitle").innerHTML = r.found
      ? `Solution Summary <span class="badge bg-success ms-2">Solution Found</span>`
      : `Solution Summary <span class="badge bg-danger ms-2">Not Found${r.aborted ? " (node limit reached)" : ""}</span>`;
    const rows = [
      ["Total moves", r.moves ?? "–"], ["Path cost", r.pathCost ?? "–"],
      ["Nodes generated", r.generated], ["Nodes expanded", r.expanded],
      ["Max search depth", r.maxDepth], ["Execution time", r.timeMs.toFixed(2) + " ms"],
      ["Memory (approx.)", (r.memoryBytes / 1024).toFixed(2) + " KB"], ["Iterations (final limit)", `${r.iterations} (${r.finalLimit})`],
    ];
    $("summaryGrid").innerHTML = rows.map(([k, v]) =>
      `<div class="col-6 col-md-3"><div class="stat"><b>${v}</b><span>${k}</span></div></div>`).join("");
  }

  /* ================= 5. CONTROLS ================= */
  function stop() { clearTimeout(timer); playing = false; }

  function tick() {
    const [delay, stride] = SPEEDS[$("speed").value - 1];
    stage.style.setProperty("--dur", Math.min(delay * 0.85, 350) + "ms");
    if (idx >= frames.length - 1) { stop(); setButtons(); return; }
    idx = Math.min(idx + stride, frames.length - 1);
    render();
    timer = setTimeout(tick, delay);
  }
  function play() {
    clearTimeout(timer);
    if (idx >= frames.length - 1) idx = 0;
    playing = true;
    timer = setTimeout(tick, 0);
  }

  function run() {
    const p = getValidatedPuzzle();
    if (!p) return;
    if (PUZZLE.sameState(p.initial, p.goal)) { showMessage("Initial and goal states are identical.", "info"); return; }
    stop();
    runInitial = p.initial; lastDrawn = null;
    result = iddls(p.initial, p.goal, { maxLimit: Number($("maxLimit").value) });
    buildFrames(result); buildSummary(result);
    if (result.steps.length >= 200000) showMessage("Animation log was capped at 200,000 steps (the search itself ran fully).", "warning");
    idx = 0; render(); play();
  }

  function clearAll() {
    stop(); frames = []; result = null; idx = 0; lastDrawn = null;
    const init = readBoard(initialBoard);
    drawStage(PUZZLE.isValid(init) ? init : PUZZLE.DEFAULT_INITIAL);
    stage.classList.remove("solved");
    ["sLimit","sDepth","sCost","sMove","sGen","sExp","sFront","sExplored"].forEach((id) => ($(id).textContent = "–"));
    ["parentBox","currentBox","succBox","frontBox","exploredBox","pathBox"].forEach((id) => ($(id).innerHTML = ""));
    $("frontCount").textContent = $("exploredCount").textContent = "0";
    $("phaseLabel").textContent = "Press Run";
    $("stageCaption").textContent = "Current state";
    $("summary").classList.add("d-none");
    $("bar").style.width = "0%"; $("frameInfo").textContent = "Frame 0 / 0";
    setButtons();
  }

  $("btnRun").onclick = run;
  $("btnPause").onclick = () => { stop(); setButtons(); };
  $("btnResume").onclick = play;
  $("btnNext").onclick = () => { stop(); if (idx < frames.length - 1) idx++; render(); };
  $("btnPrev").onclick = () => { stop(); if (idx > 0) idx--; render(); };
  $("btnReset").onclick = () => { $("message").innerHTML = ""; clearAll(); };
  $("btnSkip").onclick = () => { idx = Math.max(idx, result.found ? pathStart : frames.length - 1); render(); };
  $("speed").oninput = (e) => ($("speedVal").textContent = e.target.value);
  $("maxLimit").oninput = (e) => ($("maxLimitVal").textContent = e.target.value);

  $("btnDefault").onclick = () => {
    writeBoard(initialBoard, PUZZLE.DEFAULT_INITIAL); writeBoard(goalBoard, PUZZLE.DEFAULT_GOAL);
    $("message").innerHTML = ""; clearAll();
  };
  $("btnRandom").onclick = () => {
    let goal = readBoard(goalBoard);
    if (!PUZZLE.isValid(goal)) goal = PUZZLE.DEFAULT_GOAL;
    writeBoard(goalBoard, goal); writeBoard(initialBoard, PUZZLE.randomPuzzle(goal));
    showMessage("Random solvable puzzle generated ✔", "success"); clearAll();
  };

  /* ================= INIT ================= */
  buildBoard(initialBoard); buildBoard(goalBoard);
  writeBoard(initialBoard, PUZZLE.DEFAULT_INITIAL); writeBoard(goalBoard, PUZZLE.DEFAULT_GOAL);
  clearAll();
})();