const initialBoard = document.getElementById("initialBoard");
const goalBoard    = document.getElementById("goalBoard");
const messageBox   = document.getElementById("message");
const resultBox    = document.getElementById("result");

// ---------- Build 3x3 input grids ----------
function buildBoard(container) {
  container.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const inp = document.createElement("input");
    inp.type = "text";
    inp.maxLength = 1;
    inp.inputMode = "numeric";
    inp.addEventListener("input", () => inp.classList.remove("invalid"));
    container.appendChild(inp);
  }
}

function writeBoard(container, state) {
  [...container.children].forEach((inp, i) => {
    inp.value = state[i] === 0 ? "_" : state[i];
    inp.classList.toggle("blank", state[i] === 0);
  });
}

// "_", "0" or empty => 0 (blank); returns null if a cell is not a digit 0-8
function readBoard(container) {
  const out = [];
  [...container.children].forEach((inp) => {
    const v = inp.value.trim();
    out.push(v === "" || v === "_" ? 0 : /^[0-8]$/.test(v) ? Number(v) : NaN);
  });
  return out;
}

function showMessage(text, type = "danger") {
  messageBox.innerHTML = `<div class="alert alert-${type} mb-2">${text}</div>`;
}

// ---------- Validation ----------
function getValidatedPuzzle() {
  const initial = readBoard(initialBoard);
  const goal = readBoard(goalBoard);

  let ok = true;
  [[initial, initialBoard], [goal, goalBoard]].forEach(([s, box]) => {
    if (!PUZZLE.isValid(s)) {
      ok = false;
      [...box.children].forEach((inp, i) => {
        const dup = s.filter((x) => x === s[i]).length > 1 || Number.isNaN(s[i]);
        inp.classList.toggle("invalid", dup);
      });
    }
  });
  if (!ok) { showMessage("Each board must contain the digits 0–8 exactly once (0 or _ = blank)."); return null; }

  if (!PUZZLE.isSolvable(initial, goal)) {
    showMessage("This puzzle is <b>NOT solvable</b> (inversion parity of initial and goal differs). Change a state or use Random.");
    return null;
  }
  showMessage("Puzzle is valid and solvable ✔", "success");
  return { initial, goal };
}

// ---------- Buttons ----------
document.getElementById("btnDefault").onclick = () => {
  writeBoard(initialBoard, PUZZLE.DEFAULT_INITIAL);
  writeBoard(goalBoard, PUZZLE.DEFAULT_GOAL);
  messageBox.innerHTML = ""; resultBox.innerHTML = "";
};

document.getElementById("btnRandom").onclick = () => {
  let goal = readBoard(goalBoard);
  if (!PUZZLE.isValid(goal)) goal = PUZZLE.DEFAULT_GOAL;   // fall back to default goal
  writeBoard(goalBoard, goal);
  writeBoard(initialBoard, PUZZLE.randomPuzzle(goal));
  showMessage("Random solvable puzzle generated ✔", "success");
  resultBox.innerHTML = "";
};

document.getElementById("btnValidate").onclick = getValidatedPuzzle;

// ---------- Day-1 test: run IDDLS and print the path ----------
function miniBoardHTML(state) {
  return `<div class="mini-board">${state
    .map((v) => `<div class="${v === 0 ? "blank" : ""}">${v === 0 ? "" : v}</div>`)
    .join("")}</div>`;
}

document.getElementById("btnRun").onclick = () => {
  const p = getValidatedPuzzle();
  if (!p) return;
  if (PUZZLE.sameState(p.initial, p.goal)) { showMessage("Initial and goal are already the same.", "info"); return; }

  const r = iddls(p.initial, p.goal);
  console.log(r);

  if (!r.found) {
    resultBox.innerHTML = `<div class="alert alert-warning">Solution NOT found (${r.aborted ? "node limit reached" : "depth limit reached"}).<br>Expanded: ${r.expanded}</div>`;
    return;
  }

  const stepsHTML = r.path.map((n, i) => `
    <div class="step-board">
      <div class="small fw-bold">Step ${i}${n.move ? " (blank " + n.move + ")" : ""}</div>
      ${miniBoardHTML(n.state)}
    </div>`).join("");

  resultBox.innerHTML = `
    <div class="card shadow-sm"><div class="card-body">
      <h5 class="card-title text-success">Solution Found ✔</h5>
      <ul>
        <li>Moves / Path cost: <b>${r.moves}</b></li>
        <li>Final depth limit: <b>${r.finalLimit}</b> (iterations: ${r.iterations})</li>
        <li>Nodes generated: <b>${r.generated}</b></li>
        <li>Nodes expanded: <b>${r.expanded}</b></li>
        <li>Max depth reached: <b>${r.maxDepth}</b></li>
        <li>Time: <b>${r.timeMs.toFixed(2)} ms</b></li>
        <li>Peak frontier size: <b>${r.peakFrontier}</b> (~${r.memoryBytes} bytes)</li>
        <li>Recorded animation steps: <b>${r.steps.length}</b></li>
      </ul>
      <div>${stepsHTML}</div>
    </div></div>`;
};

// ---------- Init ----------
buildBoard(initialBoard);
buildBoard(goalBoard);
writeBoard(initialBoard, PUZZLE.DEFAULT_INITIAL);
writeBoard(goalBoard, PUZZLE.DEFAULT_GOAL);