/* State = array of 9 numbers, 0 = blank. Index = row*3 + col */
const PUZZLE = (() => {
  const MOVES = [
    { name: "Up",    dr: -1, dc: 0 },
    { name: "Down",  dr: 1,  dc: 0 },
    { name: "Left",  dr: 0,  dc: -1 },
    { name: "Right", dr: 0,  dc: 1 }
  ];

  const DEFAULT_INITIAL = [2, 8, 3, 1, 6, 4, 7, 0, 5];
  const DEFAULT_GOAL    = [1, 2, 3, 8, 0, 4, 7, 6, 5];

  const key = (s) => s.join("");

  const isValid = (s) =>
    Array.isArray(s) && s.length === 9 &&
    [0, 1, 2, 3, 4, 5, 6, 7, 8].every((n) => s.includes(n));

  const sameState = (a, b) => key(a) === key(b);

  // Count inversions ignoring the blank
  function inversions(s) {
    const t = s.filter((x) => x !== 0);
    let c = 0;
    for (let i = 0; i < t.length; i++)
      for (let j = i + 1; j < t.length; j++) if (t[i] > t[j]) c++;
    return c;
  }

  // On a 3x3 board, goal is reachable iff both states have the same inversion parity
  const isSolvable = (initial, goal) => inversions(initial) % 2 === inversions(goal) % 2;

  // All states reachable by one blank move
  function successors(s) {
    const z = s.indexOf(0), r = Math.floor(z / 3), c = z % 3;
    const out = [];
    for (const m of MOVES) {
      const nr = r + m.dr, nc = c + m.dc;
      if (nr < 0 || nr > 2 || nc < 0 || nc > 2) continue;
      const n = s.slice();
      const t = nr * 3 + nc;
      [n[z], n[t]] = [n[t], n[z]];
      out.push({ state: n, move: m.name });
    }
    return out;
  }

  // Random solvable puzzle: random walk BACKWARDS from the goal, so it is always solvable.
  // depth is kept small (default 8-14) so IDDLS finishes quickly in the browser.
  function randomPuzzle(goal, minMoves = 8, maxMoves = 14) {
    const n = minMoves + Math.floor(Math.random() * (maxMoves - minMoves + 1));
    let cur = goal.slice(), prev = null;
    for (let i = 0; i < n; i++) {
      let opts = successors(cur).filter((x) => !prev || key(x.state) !== key(prev));
      const pick = opts[Math.floor(Math.random() * opts.length)];
      prev = cur;
      cur = pick.state;
    }
    if (sameState(cur, goal)) return randomPuzzle(goal, minMoves, maxMoves);
    return cur;
  }

  // Heuristics (used from Day 3 for comparison with GBFS / A*)
  function misplaced(s, goal) {
    let c = 0;
    for (let i = 0; i < 9; i++) if (s[i] !== 0 && s[i] !== goal[i]) c++;
    return c;
  }
  function manhattan(s, goal) {
    const pos = {};
    goal.forEach((v, i) => (pos[v] = i));
    let d = 0;
    for (let i = 0; i < 9; i++) {
      if (s[i] === 0) continue;
      const g = pos[s[i]];
      d += Math.abs(Math.floor(i / 3) - Math.floor(g / 3)) + Math.abs((i % 3) - (g % 3));
    }
    return d;
  }

  return { MOVES, DEFAULT_INITIAL, DEFAULT_GOAL, key, isValid, sameState,
           inversions, isSolvable, successors, randomPuzzle, misplaced, manhattan };
})();