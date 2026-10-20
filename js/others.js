/* BFS, DFS, DLS, GBFS and A* — used ONLY for the Comparison page.
   (Your fully visualised algorithm is IDDLS in iddls.js.) */
const OTHERS = (() => {
  class Heap {                                  // min-heap ordered by f, then insertion order
    constructor() { this.a = []; }
    get size() { return this.a.length; }
    less(x, y) { return x.f < y.f || (x.f === y.f && x.seq < y.seq); }
    push(n) {
      const a = this.a; a.push(n);
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (!this.less(a[i], a[p])) break;
        [a[i], a[p]] = [a[p], a[i]]; i = p;
      }
    }
    pop() {
      const a = this.a, top = a[0], last = a.pop();
      if (a.length) {
        a[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i;
          if (l < a.length && this.less(a[l], a[m])) m = l;
          if (r < a.length && this.less(a[r], a[m])) m = r;
          if (m === i) break;
          [a[i], a[m]] = [a[m], a[i]]; i = m;
        }
      }
      return top;
    }
  }

  // type: "bfs" | "dfs" | "dls" | "gbfs" | "astar"
  function run(type, initial, goal, o = {}) {
    const t0 = performance.now();
    const maxNodes = o.maxNodes ?? 400000;
    const limit = o.limit ?? 8;
    const hf = o.h || PUZZLE.manhattan;
    const informed = type === "gbfs" || type === "astar";
    const gk = PUZZLE.key(goal);

    let seq = 0;
    const mk = (state, parent, move) => {
      const g = parent ? parent.g + 1 : 0;
      const h = informed ? hf(state, goal) : 0;
      return { state, parent, move, g, f: type === "gbfs" ? h : g + h, seq: seq++ };
    };

    const heap = informed ? new Heap() : null;
    const list = []; let head = 0;
    const push = (n) => (heap ? heap.push(n) : list.push(n));
    const pop = () => (heap ? heap.pop() : type === "bfs" ? list[head++] : list.pop());
    const size = () => (heap ? heap.size : list.length - head);

    const seen = new Set(), closed = new Set(), best = new Map();
    const root = mk(initial, null, null);
    if (type === "bfs") seen.add(PUZZLE.key(initial));
    if (type === "astar") best.set(PUZZLE.key(initial), 0);
    push(root);

    let generated = 1, expanded = 0, maxDepth = 0, peak = 1, found = null, aborted = false;

    while (size()) {
      if (expanded >= maxNodes) { aborted = true; break; }
      const n = pop(), k = PUZZLE.key(n.state);

      if (type === "astar") { if (n.g > best.get(k)) continue; }                 // stale entry
      else if (type === "dfs" || type === "gbfs") { if (closed.has(k)) continue; closed.add(k); }

      expanded++;
      if (n.g > maxDepth) maxDepth = n.g;
      if (k === gk) { found = n; break; }
      if (type === "dls" && n.g >= limit) continue;                              // cutoff

      for (const s of PUZZLE.successors(n.state)) {
        const k2 = PUZZLE.key(s.state);
        if (type === "bfs") { if (seen.has(k2)) continue; seen.add(k2); }
        else if (type === "dls") {                                               // ancestor check
          let loop = false;
          for (let p = n; p; p = p.parent) if (PUZZLE.key(p.state) === k2) { loop = true; break; }
          if (loop) continue;
        } else if (type === "astar") {
          const g = n.g + 1;
          if (best.has(k2) && best.get(k2) <= g) continue;
          best.set(k2, g);
        } else if (closed.has(k2)) continue;
        push(mk(s.state, n, s.move)); generated++;
      }
      if (size() > peak) peak = size();
    }

    return {
      found: !!found, aborted,
      moves: found ? found.g : null,
      generated, expanded, maxDepth,
      timeMs: performance.now() - t0,
      memoryBytes: (peak + seen.size + closed.size + best.size) * 9 * 8
    };
  }

  return { run };
})();