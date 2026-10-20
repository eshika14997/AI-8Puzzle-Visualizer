const ALGOS = [
  { id: "bfs", name: "BFS", full: "Breadth First Search", type: "Uninformed",
    desc: "Expands the shallowest unexpanded node first, exploring the state space level by level.",
    steps: ["Put the initial state in a FIFO queue.", "Remove the front node and test it for the goal.", "Add all unseen successors to the back of the queue.", "Repeat until the goal is found or the queue is empty."],
    pros: ["Complete", "Finds the shortest solution when every move costs 1"],
    cons: ["Memory grows as O(b^d), which is the main bottleneck", "Explores many useless states"],
    time: "O(b^d)", space: "O(b^d)", complete: "Yes", optimal: "Yes (unit step cost)" },
  { id: "dfs", name: "DFS", full: "Depth First Search", type: "Uninformed",
    desc: "Always expands the deepest node first, following one path as far as possible before backtracking.",
    steps: ["Put the initial state on a LIFO stack.", "Pop the top node and test it for the goal.", "Push its unexplored successors.", "Backtrack automatically when a path dead-ends."],
    pros: ["Very low memory, O(b·m)", "Can find a solution quickly if it is deep"],
    cons: ["Not optimal; paths can be very long", "Can loop forever without a visited check", "Incomplete in infinite spaces"],
    time: "O(b^m)", space: "O(b·m)", complete: "No (yes in a finite space with an explored set)", optimal: "No" },
  { id: "dls", name: "DLS", full: "Depth Limited Search", type: "Uninformed",
    desc: "DFS with a fixed depth limit l. Nodes at depth l are not expanded, which prevents infinite descent.",
    steps: ["Run DFS from the initial state.", "If a node is at depth l, treat it as a leaf (cutoff).", "Return the solution, a cutoff, or failure."],
    pros: ["Low memory, O(b·l)", "Avoids infinite paths"],
    cons: ["Incomplete if l < d", "Not optimal if l > d", "Choosing l needs prior knowledge"],
    time: "O(b^l)", space: "O(b·l)", complete: "No (only if l ≥ d)", optimal: "No" },
  { id: "iddls", name: "IDDLS", full: "Iterative Deepening Depth Limited Search", type: "Uninformed", mine: true,
    desc: "Runs Depth Limited Search repeatedly with limits 0, 1, 2, 3, … until the goal is found. It combines BFS's completeness and optimality with DFS's low memory.",
    steps: ["Set limit = 0.", "Run DLS from the initial state with this limit.", "If the goal is found, return the path.", "Otherwise set limit = limit + 1 and repeat."],
    pros: ["Complete and optimal for unit step cost", "Memory is only O(b·d)", "No need to guess the depth limit"],
    cons: ["Re-expands upper levels in every iteration", "Slower than A* or GBFS because it uses no heuristic"],
    time: "O(b^d)", space: "O(b·d)", complete: "Yes", optimal: "Yes (unit step cost)",
    extra: `<h6 class="mt-4">Pseudocode</h6>
<pre class="code">function IDDLS(initial, goal):
    for limit = 0, 1, 2, ... :
        result = DLS(initial, goal, limit)
        if result != CUTOFF: return result

function DLS(node, goal, limit):
    if node == goal: return path(node)
    if depth(node) == limit: return CUTOFF
    for each successor s of node (not an ancestor):
        r = DLS(s, goal, limit)
        if r != CUTOFF and r != FAIL: return r
    return CUTOFF or FAIL</pre>
<h6 class="mt-3">Why the repeated work is acceptable</h6>
<p class="mb-0">Most nodes sit at the deepest level, so re-generating the upper levels adds only about a b/(b−1) factor of extra work compared with a single BFS. In exchange, memory falls from O(b^d) to O(b·d).</p>` },
  { id: "gbfs", name: "GBFS", full: "Greedy Best First Search", type: "Informed",
    desc: "Expands the node that looks closest to the goal, using only the heuristic: f(n) = h(n).",
    steps: ["Keep a priority queue ordered by h(n).", "Pop the node with the smallest h(n).", "Test it for the goal and add its successors.", "Repeat."],
    pros: ["Often very fast", "Few nodes expanded with a good heuristic"],
    cons: ["Not optimal", "Can be misled by the heuristic", "Incomplete without a closed list"],
    time: "O(b^m) worst case", space: "O(b^m) worst case", complete: "No (yes with a closed list in a finite space)", optimal: "No" },
  { id: "astar", name: "A*", full: "A* Search", type: "Informed",
    desc: "Expands the node with the lowest f(n) = g(n) + h(n), where g is the cost so far and h is the estimated cost to the goal.",
    steps: ["Keep a priority queue ordered by f(n) = g(n) + h(n).", "Pop the node with the smallest f.", "If it is the goal, return the path.", "Otherwise add successors, keeping the cheapest known g for each state."],
    pros: ["Complete", "Optimal with an admissible heuristic (Manhattan and Misplaced Tiles both are)", "Expands far fewer nodes than uninformed search"],
    cons: ["Memory is O(b^d) because it stores every generated node", "Quality depends on the heuristic"],
    time: "O(b^d), reduced by a good heuristic", space: "O(b^d)", complete: "Yes", optimal: "Yes (admissible heuristic)" }
];

const nav = document.getElementById("algoNav"), body = document.getElementById("algoBody");
const li = (a) => a.map((x) => `<li>${x}</li>`).join("");

function show(id) {
  const a = ALGOS.find((x) => x.id === id);
  [...nav.children].forEach((el) => el.classList.toggle("active", el.dataset.id === id));
  body.innerHTML = `
  <div class="card algo-pane"><div class="card-body">
    <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
      <h3 class="mb-0">${a.full} (${a.name})</h3>
      <span class="badge ${a.type === "Informed" ? "bg-success" : "bg-secondary"}">${a.type}</span>
      ${a.mine ? '<span class="badge bg-warning text-dark">My assigned algorithm</span>' : ""}
    </div>
    <p>${a.desc}</p>
    <h6>Working principle</h6><ol>${li(a.steps)}</ol>
    <div class="row g-3 mt-1">
      <div class="col-md-6"><h6 class="text-success">Advantages</h6><ul>${li(a.pros)}</ul></div>
      <div class="col-md-6"><h6 class="text-danger">Limitations</h6><ul>${li(a.cons)}</ul></div>
    </div>
    <div class="row g-2 mt-1">
      ${[["Time complexity", a.time], ["Space complexity", a.space], ["Completeness", a.complete], ["Optimality", a.optimal]]
        .map(([k, v]) => `<div class="col-6 col-md-3"><div class="stat"><b style="font-size:.95rem">${v}</b><span>${k}</span></div></div>`).join("")}
    </div>
    ${a.extra || ""}
  </div></div>`;
  body.querySelector(".card").classList.add("show");
}

ALGOS.forEach((a) => {
  const el = document.createElement("div");
  el.className = "list-group-item";
  el.dataset.id = a.id;
  el.innerHTML = `${a.name}${a.mine ? " ⭐" : ""}<div class="small text-muted">${a.full}</div>`;
  el.onclick = () => show(a.id);
  nav.appendChild(el);
});
show("iddls");