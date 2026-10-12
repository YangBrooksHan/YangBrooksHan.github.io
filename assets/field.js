// One particle field, four behaviours: Langevin dynamics (equations),
// packet routing (systems), denoised video frames (pixels), a walking
// humanoid that reaches for an object (actions). The active chapter picks one.
(() => {
  const stage = document.querySelector('.stage');
  if (!stage) return;
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let seed = 7;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = () => {
    let u = 0;
    while (!u) u = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };

  let W = 0, H = 0, S = 1, cx = 0, cy = 0;
  let P = [], nodes = [], edges = [], adj = [];
  let mode = 0, t = 0, entered = 0, running = false, visible = true;
  let col = {};

  function readColors() {
    const cs = getComputedStyle(stage);
    const v = (n) => cs.getPropertyValue(n).trim();
    col = { hue: [v('--c0'), v('--c1'), v('--c2'), v('--c3')], bg: v('--stage-bg'), line: v('--stage-line') };
    // each chapter draws from a short band of the colormap centred on its own
    // stop, leaning toward its neighbours, so the stage shifts gradually
    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const mix = (a, b, w) => 'rgb(' + rgb(a).map((x, i) => Math.round(x + (rgb(b)[i] - x) * w)).join(',') + ')';
    col.band = col.hue.map((c, m) => {
      const prev = col.hue[Math.max(0, m - 1)], next = col.hue[Math.min(3, m + 1)];
      return [mix(c, prev, 0.45), mix(c, prev, 0.2), c, mix(c, next, 0.2), mix(c, next, 0.45)];
    });
  }

  function buildNetwork() {
    nodes = []; edges = []; adj = [];
    let tries = 0;
    while (nodes.length < 30 && tries++ < 4000) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand());
      const p = { x: Math.cos(a) * r * 1.25, y: Math.sin(a) * r * 0.95 };
      if (nodes.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > 0.26)) nodes.push(p);
    }
    nodes.forEach(() => adj.push([]));
    const key = new Set();
    nodes.forEach((p, i) => {
      nodes.map((q, j) => [j, Math.hypot(p.x - q.x, p.y - q.y)])
        .filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 3)
        .forEach(([j]) => {
          const k = i < j ? i + '-' + j : j + '-' + i;
          if (key.has(k)) return;
          key.add(k); edges.push([i, j]);
          adj[i].push(edges.length - 1); adj[j].push(edges.length - 1);
        });
    });
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.min(W, H) * 0.4; cx = W / 2; cy = H / 2;
    const n = Math.max(450, Math.min(1400, Math.round((W * H) / 420)));
    while (P.length < n) {
      P.push({ x: cx + gauss() * S * 0.5, y: cy + gauss() * S * 0.5, vx: 0, vy: 0,
        nx: gauss(), ny: gauss(), e: 0, s: rand(), sp: 0.25 + rand() * 0.5, dir: 1, r: rand() });
    }
    P.length = n;
    P.forEach((p) => { p.e = Math.floor(rand() * edges.length); });
    ctx.fillStyle = col.bg; ctx.fillRect(0, 0, W, H);
  }

  // ---------- targets for each behaviour (normalized units, y down) ----------
  const U = (x) => (x * x - 1) * (x * x - 1);

  function frames() {
    const narrow = W < 520;
    const fw = narrow ? 1.5 : 0.78, fh = narrow ? 0.62 : 0.6, gap = 0.08;
    const out = [];
    for (let k = 0; k < 3; k++) {
      const x0 = narrow ? -fw / 2 : -1.5 * fw - gap + k * (fw + gap);
      const y0 = narrow ? -1.05 + k * (fh + gap) : -fh / 2;
      const tau = (t * 0.55 + k * 0.18) % 1;            // consecutive frames of one clip
      const bx = x0 + fw * (0.12 + 0.76 * tau);
      const by = y0 + fh * (0.82 - 3.0 * tau * (1 - tau)); // projectile arc
      out.push({ x0, y0, fw, fh, bx, by });
    }
    return out;
  }

  function skeleton() {
    const ph = t * 2.4, bob = 0.025 * Math.cos(2 * ph);
    const hip = [0, 0.2 + bob], chest = [0.03, -0.27 + bob], head = [0.05, -0.47 + bob];
    const leg = (o) => {
      const a = 0.42 * Math.sin(ph + o), bend = 0.75 * Math.max(0, Math.sin(ph + o + 1.4));
      const knee = [hip[0] + 0.34 * Math.sin(a), hip[1] + 0.34 * Math.cos(a)];
      const foot = [knee[0] + 0.34 * Math.sin(a - bend), knee[1] + 0.34 * Math.cos(a - bend)];
      return [[hip, knee], [knee, foot]];
    };
    const b = -0.45 * Math.sin(ph);
    const el = [chest[0] + 0.25 * Math.sin(b), chest[1] + 0.25 * Math.cos(b)];
    const ha = [el[0] + 0.23 * Math.sin(b + 0.5), el[1] + 0.23 * Math.cos(b + 0.5)];
    const r = 1.25 + 0.12 * Math.sin(t * 1.3);
    const el2 = [chest[0] + 0.25 * Math.sin(r), chest[1] + 0.25 * Math.cos(r)];
    const ha2 = [el2[0] + 0.23 * Math.sin(r + 0.55), el2[1] + 0.23 * Math.cos(r + 0.55)];
    const bones = [[hip, chest], [chest, head], ...leg(0), ...leg(Math.PI), [chest, el], [el, ha], [chest, el2], [el2, ha2]];
    const box = [ha2[0] + 0.07, ha2[1] - 0.01];
    return { bones, head, box };
  }

  function target(p, i, n, ctxData) {
    if (mode === 0) {
      const clamp = (v, m) => Math.max(-m, Math.min(m, v));   // keep the cubic drift bounded off-screen
      const x = clamp((p.x - cx) / S, 1.8), y = clamp((p.y - cy) / S, 1.4), dt = 0.012, T = 0.09 + 0.07 * Math.sin(t * 0.35);
      const nx = x - 4 * x * (x * x - 1) * dt + Math.sqrt(2 * T * dt) * gauss();
      const ny = y - 3.2 * y * dt + Math.sqrt(2 * T * dt) * gauss();
      return [cx + nx * S, cy + ny * S, 0.9];
    }
    if (mode === 1) {
      if (!edges.length) return [p.x, p.y, 0.5];
      const [a, b] = edges[p.e];
      p.s += p.dir * p.sp * 0.012;
      if (p.s > 1 || p.s < 0) {                          // arrive at a node, pick an outgoing link
        const at = p.s > 1 ? b : a, nextE = adj[at][Math.floor(rand() * adj[at].length)];
        p.e = nextE; p.dir = edges[nextE][0] === at ? 1 : -1; p.s = p.dir > 0 ? 0 : 1;
      }
      const [u, v] = edges[p.e];
      return [cx + (nodes[u].x + (nodes[v].x - nodes[u].x) * p.s) * S,
        cy + (nodes[u].y + (nodes[v].y - nodes[u].y) * p.s) * S, 0.85];
    }
    const noise = Math.max(0, 1 - (t - entered) / 1.6);  // denoise on arrival
    let x, y, a = 0.7;
    if (mode === 2) {
      const f = ctxData[i % 3], g = p.r;
      if (g < 0.3) {                                     // frame border
        const q = (g / 0.3) * 4, side = Math.floor(q), s = q - side;
        x = f.x0 + (side === 0 ? s : side === 2 ? 1 - s : side === 1 ? 1 : 0) * f.fw;
        y = f.y0 + (side === 1 ? s : side === 3 ? 1 - s : side === 0 ? 0 : 1) * f.fh;
        a = 0.45;
      } else if (g < 0.62) {                             // the ball, snapped to pixels
        const ang = p.nx * 3, rad = 0.07 * Math.sqrt(Math.abs(p.ny) % 1);
        const cell = f.fw / 14;
        x = Math.round((f.bx + Math.cos(ang) * rad) / cell) * cell;
        y = Math.round((f.by + Math.sin(ang) * rad) / cell) * cell;
        a = 1;
      } else {                                           // ground row of pixels
        const cell = f.fw / 14;
        x = f.x0 + Math.floor(((g - 0.62) / 0.38) * 14) * cell + cell / 2;
        y = f.y0 + f.fh * 0.93;
        a = 0.5;
      }
    } else {
      const { bones, head, box } = ctxData, g = p.r;
      if (g < 0.16) {
        const ang = g / 0.16 * Math.PI * 2;
        x = head[0] + Math.cos(ang) * 0.1; y = head[1] + Math.sin(ang) * 0.1;
      } else if (g < 0.26) {
        const q = (g - 0.16) / 0.1 * 4, side = Math.floor(q), s = q - side, h = 0.065;
        x = box[0] + (side % 2 ? (side === 1 ? h : -h) : -h + 2 * h * s);
        y = box[1] + (side % 2 ? -h + 2 * h * s : (side === 0 ? -h : h));
        a = 1;
      } else if (g < 0.36) {
        x = -1.2 + ((g - 0.26) / 0.1) * 2.4; y = 0.9;           // ground
        a = 0.35;
      } else {
        const bone = bones[Math.floor((g - 0.36) / 0.64 * bones.length)], s = p.nx * 0.5 + 0.5;
        const ss = Math.min(1, Math.max(0, s % 1));
        x = bone[0][0] + (bone[1][0] - bone[0][0]) * ss; y = bone[0][1] + (bone[1][1] - bone[0][1]) * ss;
      }
    }
    return [cx + (x + p.nx * noise * 0.6) * S, cy + (y + p.ny * noise * 0.6) * S, a];
  }

  function drawBackdrop(ctxData) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = col.line;
    ctx.beginPath();
    if (mode === 0) {                                    // level sets of U(x) + 1.6 y^2
      [0.08, 0.25, 0.55, 1.0].forEach((c) => {
        for (const sgn of [1, -1]) {
          let first = true;
          for (let x = -1.7; x <= 1.7; x += 0.01) {
            const r = (c - U(x)) / 1.6;
            if (r < 0) { first = true; continue; }
            const X = cx + x * S, Y = cy + sgn * Math.sqrt(r) * S;
            first ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); first = false;
          }
        }
      });
    } else if (mode === 1) {
      edges.forEach(([a, b]) => { ctx.moveTo(cx + nodes[a].x * S, cy + nodes[a].y * S); ctx.lineTo(cx + nodes[b].x * S, cy + nodes[b].y * S); });
    } else if (mode === 3) {
      ctxData.bones.forEach(([a, b]) => { ctx.moveTo(cx + a[0] * S, cy + a[1] * S); ctx.lineTo(cx + b[0] * S, cy + b[1] * S); });
    }
    ctx.stroke();
    if (mode === 1) {
      ctx.fillStyle = col.hue[1];
      nodes.forEach((q) => { ctx.beginPath(); ctx.arc(cx + q.x * S, cy + q.y * S, 3, 0, Math.PI * 2); ctx.fill(); });
    }
  }

  function step(draw) {
    t += 1 / 60;
    const data = mode === 2 ? frames() : mode === 3 ? skeleton() : null;
    for (let i = 0; i < P.length; i++) {
      const p = P[i], [tx, ty, a] = target(p, i, P.length, data);
      p.a = a;
      if (mode === 0) { p.vx = p.vx * 0.6 + (tx - p.x) * 0.4; p.vy = p.vy * 0.6 + (ty - p.y) * 0.4; }
      else { p.vx = p.vx * 0.78 + (tx - p.x) * 0.09; p.vy = p.vy * 0.78 + (ty - p.y) * 0.09; }
      p.x += p.vx; p.y += p.vy;
    }
    if (!draw) return;
    ctx.globalAlpha = reduce ? 1 : 0.24;
    ctx.fillStyle = col.bg; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    drawBackdrop(data);
    col.band[mode].forEach((shade, k) => {
      ctx.fillStyle = shade;
      for (const p of P) {
        if (Math.min(4, Math.floor(p.r * 5)) !== k) continue;
        ctx.globalAlpha = p.a; ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      }
    });
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (!running) return;
    step(true);
    requestAnimationFrame(loop);
  }
  function setRunning() {
    const want = visible && !document.hidden && !reduce;
    if (want && !running) { running = true; requestAnimationFrame(loop); }
    if (!want) running = false;
  }
  function still() {                                     // reduced motion: settle, then draw once
    for (let k = 0; k < 140; k++) step(false);
    step(true);
  }

  function setMode(m) {
    if (m === mode) return;
    mode = m; entered = t;
    stage.dataset.mode = String(m);
    if (reduce) still();
  }

  // chapters run newest-first; each names the behaviour it shows via data-mode
  const chapters = [...document.querySelectorAll('.chapter')];
  mode = chapters.length ? Number(chapters[0].dataset.mode) : 0;
  readColors(); buildNetwork(); resize();
  stage.dataset.mode = String(mode);
  addEventListener('resize', () => { resize(); if (reduce) still(); });
  addEventListener('themechange', () => { readColors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, W, H); if (reduce) still(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => dispatchEvent(new Event('themechange')));
  document.addEventListener('visibilitychange', setRunning);

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setRunning(); }).observe(stage);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      chapters.forEach((c) => c.classList.toggle('on', c === e.target));
      document.querySelectorAll('.path a').forEach((a) => a.classList.toggle('on', a.hash === '#' + e.target.id));
      setMode(Number(e.target.dataset.mode));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  chapters.forEach((c) => io.observe(c));
  still();                                               // paint a settled first frame before animating
  if (!reduce) setRunning();
})();
