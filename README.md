# AI-8Puzzle-Visualizer

Interactive 8-Puzzle solver that visualises **Iterative Deepening Depth Limited Search (IDDLS)** step by step.

**Live demo:** https://<your-username>.github.io/AI-8Puzzle-Visualizer/

## Project Description
A web application that solves the 8-Puzzle as a state-space search problem. Users enter an initial and goal state (or generate a random solvable puzzle), run the search, and watch the blank tile move while the frontier, explored list, depth and node counts update in real time. A comparison page runs BFS, DFS, DLS, IDDLS, GBFS and A* on the same puzzle.

## Technologies Used
HTML5, CSS3, JavaScript (ES6), Bootstrap 5.3. No other frameworks or search libraries.

## Search Algorithms Implemented
- **IDDLS** (assigned algorithm): full step-by-step visualisation, implemented from scratch in `js/iddls.js`
- BFS, DFS, DLS, GBFS, A*: lightweight implementations in `js/others.js`, used only for the comparison table

## Heuristics Used
- Misplaced Tiles
- Manhattan Distance
(used by GBFS and A* on the comparison page)

## Features
Manual and random puzzle input, solvability check, animated blank-tile movement, live search panel (current/parent node, successors, frontier, explored list, depth, g(n)), Run / Pause / Resume / Next / Previous / Reset / Speed controls, solution summary, comparison page, algorithm information page, dark mode.

## Screenshots
| Home | Solver | Comparison | Algorithm Info |
|---|---|---|---|
| ![](images/home.png) | ![](images/solver.png) | ![](images/comparison.png) | ![](images/info.png) |

## Student Details
- Name: YOUR NAME
- Registration No: 24BCT0061
- Course: Artificial Intelligence
- Assigned Algorithm: IDDLS (Iterative Deepening Depth Limited Search)

## How to Run the Project
1. Clone the repo: `git clone https://github.com/<your-username>/AI-8Puzzle-Visualizer.git`
2. Open the folder in VS Code and run `index.html` with the Live Server extension (or just double-click `index.html`).
3. No build step or dependencies to install.

## References
- Russell & Norvig, *Artificial Intelligence: A Modern Approach*, 4th ed.
- Bootstrap 5.3 documentation: https://getbootstrap.com
- MDN Web Docs (JavaScript, CSS animations)
- 8-puzzle solvability (inversion parity): standard result, see AIMA
- Generative AI assistance (Claude by Anthropic) was used for code scaffolding and UI ideas; all code was reviewed and tested by me.