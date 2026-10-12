// Page backdrop: a deep star field in three depth layers that drifts with scroll
// and pointer, a faint nebula in the accent hue, and a sparse "connectome" —
// nearby bright stars link up and fade apart, like synapses or network nodes.
// Dark theme renders luminous stars; light theme renders an ink star chart.
(() => {
  const canvas = document.getElementById('cosmos');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());

  let W = 0, H = 0, stars = [], hubs = [], col = {}, t = 0, running = false;
  let px = 0, py = 0, tx = 0, ty = 0;                    // pointer parallax, eased

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    const dark = v('--bg').startsWith('#0') || v('--bg').startsWith('#1');
    col = { star: v('--fg'), accent: v('--c0'), accent2: v('--c3'), net: v('--c1'), temp: ['--c0', '--c1', '--c2', '--c3'].map(v), dark };
  }

  function build() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed = 11; stars = []; hubs = [];
    const n = Math.round((W * H) / 1100);
    for (let i = 0; i < n; i++) {
      const z = rand();                                  // 0 far … 1 near
      let x = rand() * W, y = rand() * H * 1.6;
      if (rand() < 0.5) {                                // crowd half the far stars into a galactic band
        const u = rand() * 1.3 - 0.15;
        x = u * W; y = H * 1.05 - u * H * 0.75 + gauss() * H * 0.07;
      }
      stars.push({ x, y, z: rand() < 0.5 ? z * 0.5 : z, r: 0.3 + z * z * 1.5,
        a: 0.3 + rand() * 0.7, tw: rand() * Math.PI * 2, k: rand() < 0.12 ? Math.floor(rand() * 4) : -1 });   // k: colour temperature, -1 = white
    }
    // the brightest, nearest stars become network hubs
    for (const s of stars) if (s.z > 0.8 && hubs.length < 90) hubs.push(s);
  }

  function nebula(sy) {
    const g = (x, y, r, c, a) => {
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, c); grd.addColorStop(1, 'transparent');
      ctx.globalAlpha = a; ctx.fillStyle = grd; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    const a = col.dark ? 0.07 : 0.035;
    ctx.save();                                          // the band's diffuse glow
    ctx.translate(W * 0.5, H * 0.67 - sy * 0.06);
    ctx.rotate(-Math.atan2(H * 0.75, W)); ctx.scale(1, 0.13);
    g(0, 0, Math.hypot(W, H) * 0.6, col.star, col.dark ? 0.07 : 0.035);
    ctx.restore();
    g(W * 0.78, H * 0.22 - sy * 0.05, Math.max(W, H) * 0.55, col.accent, a);
    g(W * 0.12, H * 0.85 - sy * 0.03, Math.max(W, H) * 0.45, col.accent2, a * 0.7);
    ctx.globalAlpha = 1;
  }

  function draw() {
    const sy = scrollY;
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    ctx.clearRect(0, 0, W, H);
    nebula(sy);
    const span = H * 1.6;
    const pos = (s) => {
      const depth = 0.08 + s.z * 0.35;
      let y = (s.y - sy * depth - t * 1.5 * (0.2 + s.z)) % span;
      if (y < 0) y += span;
      return [s.x + px * s.z * 18, y - H * 0.3 + py * s.z * 12];
    };
    // keep the text column calm: links fade toward the left where copy sits
    const calm = (x) => { const u = Math.min(1, Math.max(0, (x / W - 0.3) / 0.4)); return 0.15 + 0.85 * u * u * (3 - 2 * u); };
    // connectome: link hubs that drift close, fading with distance and time
    const maxD = Math.min(W, H) * 0.2;
    ctx.lineWidth = 0.5; ctx.strokeStyle = col.net;      // the network wears the systems colour
    const hp = hubs.map(pos);
    for (let i = 0; i < hp.length; i++) {
      for (let j = i + 1; j < hp.length; j++) {
        const d = Math.hypot(hp[i][0] - hp[j][0], hp[i][1] - hp[j][1]);
        if (d > maxD) continue;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.25 + i * 1.7 + j);
        const quiet = calm((hp[i][0] + hp[j][0]) / 2);
        ctx.globalAlpha = (1 - d / maxD) * pulse * quiet * (col.dark ? 0.22 : 0.14);
        ctx.beginPath(); ctx.moveTo(hp[i][0], hp[i][1]); ctx.lineTo(hp[j][0], hp[j][1]); ctx.stroke();
      }
    }
    // stars
    for (const s of stars) {
      ctx.fillStyle = s.k < 0 ? col.star : col.temp[s.k];
      const [x, y] = pos(s);
      if (y < -4 || y > H + 4) continue;
      const tw = 0.8 + 0.2 * Math.sin(t * 0.7 + s.tw);
      ctx.globalAlpha = s.a * tw * (col.dark ? 0.75 : 0.3);
      ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    // hubs glow faintly in the network colour
    ctx.fillStyle = col.net;
    for (const [x, y] of hp) {
      ctx.globalAlpha = col.dark ? 0.35 : 0.25;
      ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (!running) return;
    t += 1 / 60; draw();
    requestAnimationFrame(loop);
  }
  function setRunning() {
    const want = !document.hidden && !reduce;
    if (want && !running) { running = true; requestAnimationFrame(loop); }
    if (!want) running = false;
  }

  readColors(); build(); draw();
  addEventListener('resize', () => { build(); draw(); });
  addEventListener('scroll', () => { if (!running) draw(); }, { passive: true });
  addEventListener('pointermove', (e) => { tx = e.clientX / W - 0.5; ty = e.clientY / H - 0.5; }, { passive: true });
  addEventListener('themechange', () => { readColors(); draw(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); draw(); });
  document.addEventListener('visibilitychange', setRunning);
  setRunning();
})();
