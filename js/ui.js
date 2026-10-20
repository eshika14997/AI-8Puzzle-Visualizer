/* Interactive UI extras: theme, scroll effects, ripple, spotlight, hero decor, confetti */
(() => {
  const root = document.documentElement;

  /* ---- Theme (dark / light) ---- */
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  const setTheme = (t) => {
    root.setAttribute("data-bs-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) {}
    const b = document.getElementById("themeBtn");
    if (b) b.textContent = t === "dark" ? "☀️" : "🌙";
  };
  const nav = document.querySelector(".navbar-nav");
  if (nav) {
    const li = document.createElement("li");
    li.className = "nav-item d-flex align-items-center";
    li.innerHTML = `<button id="themeBtn" class="theme-btn" title="Toggle theme" aria-label="Toggle theme"></button>`;
    nav.appendChild(li);
    li.firstElementChild.onclick = () => setTheme(root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark");
  }
  setTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  /* ---- Scroll progress bar + navbar shadow ---- */
  const bar = document.createElement("div");
  bar.id = "scrollbar"; document.body.appendChild(bar);
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%";
    document.querySelector(".navbar")?.classList.toggle("scrolled", scrollY > 10);
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---- Cards: reveal on scroll (+ hover lift except on the solver page) ---- */
  const solverPage = !!document.getElementById("stageBoard");
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const c = e.target;
    c.classList.add("show"); io.unobserve(c);
    setTimeout(() => (c.style.transitionDelay = ""), 900);
  }), { threshold: 0.08 });
  document.querySelectorAll(".card").forEach((c, i) => {
    c.classList.add("reveal");
    if (!solverPage) c.classList.add("lift");
    c.style.transitionDelay = (i % 4) * 70 + "ms";
    io.observe(c);
  });

  /* ---- Mouse spotlight on cards ---- */
  document.addEventListener("mousemove", (e) => {
    const c = e.target.closest && e.target.closest(".card");
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", e.clientX - r.left + "px");
    c.style.setProperty("--my", e.clientY - r.top + "px");
  });

  /* ---- Button ripple ---- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".btn");
    if (!b || b.disabled) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 600);
  });

  /* ---- Hero decoration: blobs + floating tiles ---- */
  const hero = document.querySelector(".hero");
  if (hero) {
    [["#a855f7", "-60px", "8%", 260], ["#06b6d4", "auto", "70%", 300]].forEach(([c, t, l, s], i) => {
      const b = document.createElement("div");
      b.className = "blob";
      b.style.cssText = `background:${c};width:${s}px;height:${s}px;top:${t === "auto" ? "40%" : t};left:${l};animation-delay:${i * -4}s`;
      hero.prepend(b);
    });
    for (let n = 1; n <= 8; n++) {
      const t = document.createElement("span");
      t.className = "ftile"; t.textContent = n;
      t.style.left = (n % 2 ? 3 + Math.random() * 14 : 83 + Math.random() * 12) + "%";
      t.style.top = 8 + Math.random() * 72 + "%";
      t.style.setProperty("--d", 5 + Math.random() * 5 + "s");
      t.style.setProperty("--dl", -Math.random() * 5 + "s");
      t.style.setProperty("--rot", Math.random() * 30 - 15 + "deg");
      hero.prepend(t);
    }
  }

  /* ---- Confetti when the puzzle is solved ---- */
  function confetti() {
    const c = document.createElement("canvas");
    Object.assign(c.style, { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2000 });
    document.body.appendChild(c);
    const ctx = c.getContext("2d"), W = (c.width = innerWidth), H = (c.height = innerHeight);
    const cols = ["#4f46e5", "#06b6d4", "#f59e0b", "#ef4444", "#16a34a", "#a855f7"];
    const ps = Array.from({ length: 150 }, () => ({
      x: W / 2, y: H * 0.35, vx: (Math.random() - 0.5) * 15, vy: -3 - Math.random() * 12,
      s: 6 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: cols[(Math.random() * cols.length) | 0]
    }));
    let f = 0;
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      ps.forEach((p) => {
        p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
      });
      if (++f < 160) requestAnimationFrame(draw); else c.remove();
    })();
  }
  const stage = document.getElementById("stageBoard");
  if (stage) {
    let was = false;
    new MutationObserver(() => {
      const now = stage.classList.contains("solved");
      if (now && !was) confetti();
      was = now;
    }).observe(stage, { attributes: true, attributeFilter: ["class"] });
  }
})();