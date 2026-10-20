/*
 * Iterative Deepening Depth Limited Search (IDDLS)
 * for limit = 0,1,2,... run Depth Limited Search (DFS with a depth cutoff).
 * Stops when goal is found, or a full iteration has no cutoff (space exhausted => no solution),
 * or safety limits are hit.
 *
 * Frontier = explicit stack (LIFO).  Cycle check = a node is skipped if its state
 * already appears among its own ancestors (keeps memory O(b*d) and avoids loops).
 */
function iddls(initial, goal, opts = {}) {
  const maxLimit  = opts.maxLimit  ?? 30;       // deepest limit to try
  const maxNodes  = opts.maxNodes  ?? 3000000;  // safety: stop if too many expansions
  const recordCap = opts.recordCap ?? 200000;   // max steps stored for animation

  const goalKey = PUZZLE.key(goal);
  const t0 = performance.now();

  const stats = { generated: 1, expanded: 0, maxDepth: 0, peakFrontier: 1, iterations: 0 };
  const steps = [];
  let solutionNode = null, aborted = false, finalLimit = 0;

  const isAncestor = (node, state) => {
    const k = PUZZLE.key(state);
    for (let p = node; p; p = p.parent) if (PUZZLE.key(p.state) === k) return true;
    return false;
  };

  for (let limit = 0; limit <= maxLimit && !solutionNode && !aborted; limit++) {
    stats.iterations++;
    finalLimit = limit;
    steps.push({ type: "iteration", limit });

    const stack = [{ state: initial, parent: null, move: null, depth: 0 }];
    let cutoff = false;

    while (stack.length) {
      if (stats.expanded >= maxNodes) { aborted = true; break; }

      const node = stack.pop();
      stats.expanded++;
      if (node.depth > stats.maxDepth) stats.maxDepth = node.depth;

      const record = (type, children) => {
        if (steps.length < recordCap)
          steps.push({
            type, limit,
            state: node.state,
            parent: node.parent ? node.parent.state : null,
            move: node.move,
            depth: node.depth,
            cost: node.depth,                       // g(n) = depth (unit step cost)
            children: children.map((c) => ({ state: c.state, move: c.move })),
            frontier: stack.map((n) => n.state),    // snapshot of stack (Open list)
            generated: stats.generated,
            expanded: stats.expanded
          });
      };

      // Goal test
      if (PUZZLE.key(node.state) === goalKey) {
        solutionNode = node;
        record("goal", []);
        break;
      }

      // Depth cutoff
      if (node.depth === limit) {
        cutoff = true;
        record("cutoff", []);
        continue;
      }

      // Expand: generate successors, skip ones that repeat an ancestor
      const kids = [];
      for (const s of PUZZLE.successors(node.state)) {
        if (isAncestor(node, s.state)) continue;
        kids.push({ state: s.state, parent: node, move: s.move, depth: node.depth + 1 });
      }
      stats.generated += kids.length;
      for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]); // first child popped first
      if (stack.length > stats.peakFrontier) stats.peakFrontier = stack.length;

      record("expand", kids);
    }

    // A full iteration with no cutoff means the whole space was searched: no solution exists
    if (!solutionNode && !cutoff && !aborted) break;
  }

  // Rebuild solution path
  let path = null;
  if (solutionNode) {
    path = [];
    for (let n = solutionNode; n; n = n.parent) path.push({ state: n.state, move: n.move });
    path.reverse();
  }

  return {
    found: !!solutionNode,
    aborted,
    path,                                   // [{state, move}, ...] step 0..N
    moves: path ? path.length - 1 : null,
    pathCost: path ? path.length - 1 : null,
    finalLimit,
    generated: stats.generated,
    expanded: stats.expanded,
    maxDepth: stats.maxDepth,
    iterations: stats.iterations,
    peakFrontier: stats.peakFrontier,
    memoryBytes: stats.peakFrontier * 9 * 8,   // rough: nodes on stack × 9 cells × 8 bytes
    timeMs: performance.now() - t0,
    steps
  };
}