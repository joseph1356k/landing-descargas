// ============================================================
//  presence.js — el fondo vivo de U
//
//  Tres ideas, una metáfora:
//   · Un orbe de luz cálida que te sigue con intención
//     (un beat detrás del cursor: aprende tu posición, no la copia).
//   · Polvo luminoso que orbita esa presencia.
//   · Un campo de memoria: por donde pasas queda una estela
//     que se desvanece lentamente. El fondo te recuerda.
//
//  Sin líneas de constelación, sin neón. Solo luz.
// ============================================================

const PEARL = "242,237,230";
const HALO  = "201,184,255";
const EMBER = "255,217,176";

const MEM_SCALE = 6;          // resolución del campo de memoria (1/6)
const MEM_DECAY = 0.996;      // persistencia de la estela por frame
const IDLE_MS   = 3800;       // sin mouse → el orbe deambula solo

const reduced = matchMedia("(prefers-reduced-motion: reduce)");

export function createPresence(canvas) {
  const ctx  = canvas.getContext("2d");
  const mem  = document.createElement("canvas");
  const mctx = mem.getContext("2d");

  let w = 0, h = 0, dpr = 1;
  let parts = [];
  let raf = 0, running = false, t = 0;

  const orb = { x: 0, y: 0, tx: 0, ty: 0, r: 0 };
  const ptr = { x: 0, y: 0, active: false, last: 0, sx: 0, sy: 0 };
  let focus = null; // objetivo fijado (p. ej. el CTA en hover)

  // Sello pre-renderizado para estampar memoria (radial lavanda)
  const stamp = document.createElement("canvas");
  stamp.width = stamp.height = 64;
  {
    const s = stamp.getContext("2d");
    const g = s.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,   `rgba(${HALO},.65)`);
    g.addColorStop(.55, `rgba(${HALO},.16)`);
    g.addColorStop(1,   `rgba(${HALO},0)`);
    s.fillStyle = g;
    s.fillRect(0, 0, 64, 64);
  }

  function resize() {
    w = innerWidth;
    h = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width  = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    mem.width  = Math.ceil(w / MEM_SCALE);
    mem.height = Math.ceil(h / MEM_SCALE);

    const n = reduced.matches
      ? 90
      : Math.round(Math.min(170, Math.max(60, (w * h) / 16000)));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0, vy: 0,
      s: 0.6 + Math.random() * 1.3,
      a: 0.18 + Math.random() * 0.45,
      ph: Math.random() * Math.PI * 2,
      warm: Math.random() < 0.28,
    }));

    orb.x = orb.tx = w * 0.66;
    orb.y = orb.ty = h * 0.42;
    orb.r = Math.min(w, h) * 0.15;

    if (reduced.matches) drawStatic();
  }

  function memStamp(x, y, r, alpha) {
    mctx.globalCompositeOperation = "lighter";
    mctx.globalAlpha = alpha;
    const sx = x / MEM_SCALE, sy = y / MEM_SCALE, sr = r / MEM_SCALE;
    mctx.drawImage(stamp, sx - sr, sy - sr, sr * 2, sr * 2);
  }

  function drawOrb(px, py, breathe) {
    const r = orb.r * (1 + (breathe ? 0.06 * Math.sin(t * 0.9) : 0));

    let g = ctx.createRadialGradient(px, py, r * 0.1, px, py, r);
    g.addColorStop(0,   `rgba(${EMBER},.14)`);
    g.addColorStop(.55, `rgba(${HALO},.09)`);
    g.addColorStop(1,   `rgba(${HALO},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();

    g = ctx.createRadialGradient(px, py, 0, px, py, r * 0.45);
    g.addColorStop(0, `rgba(${EMBER},.32)`);
    g.addColorStop(1, `rgba(${EMBER},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px, py, r * 0.45, 0, 7); ctx.fill();

    g = ctx.createRadialGradient(px, py, 0, px, py, r * 0.16);
    g.addColorStop(0,  `rgba(${PEARL},.95)`);
    g.addColorStop(.5, `rgba(${EMBER},.45)`);
    g.addColorStop(1,  `rgba(${EMBER},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px, py, r * 0.16, 0, 7); ctx.fill();
  }

  function drawDust(animate) {
    const R = Math.min(w, h) * 0.42;
    for (const p of parts) {
      if (animate) {
        // campo de flujo suave + órbita alrededor de la presencia
        const a = (Math.sin(p.x * 0.0016 + t * 0.14) +
                   Math.cos(p.y * 0.0013 - t * 0.11)) * 2.1;
        p.vx += Math.cos(a) * 0.015;
        p.vy += Math.sin(a) * 0.015;

        const dx = p.x - orb.x, dy = p.y - orb.y;
        const d = Math.hypot(dx, dy) + 1;
        if (d < R) {
          const k = 1 - d / R;
          p.vx += (-dy / d) * 0.055 * k + (-dx / d) * 0.012 * k;
          p.vy += ( dx / d) * 0.055 * k + (-dy / d) * 0.012 * k;
        }
        p.vx *= 0.984; p.vy *= 0.984;
        p.x += p.vx;   p.y += p.vy;

        if (p.x < -24) p.x = w + 24; else if (p.x > w + 24) p.x = -24;
        if (p.y < -24) p.y = h + 24; else if (p.y > h + 24) p.y = -24;
      }
      const tw = animate ? 0.55 + 0.45 * Math.sin(t * 1.7 + p.ph) : 0.7;
      ctx.globalAlpha = p.a * tw;
      ctx.fillStyle = `rgb(${p.warm ? EMBER : PEARL})`;
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    ctx.globalAlpha = 1;
  }

  function frame() {
    t += 1 / 60;

    // ¿A quién sigue la presencia?
    const idle = performance.now() - ptr.last > IDLE_MS;
    if (focus)                      { orb.tx = focus.x;  orb.ty = focus.y; }
    else if (ptr.active && !idle)   { orb.tx = ptr.x;    orb.ty = ptr.y;   }
    else { // deambula sola, con calma
      orb.tx = w * (0.64 + 0.13 * Math.sin(t * 0.11));
      orb.ty = h * (0.40 + 0.12 * Math.sin(t * 0.073 + 1.7));
    }
    orb.x += (orb.tx - orb.x) * 0.028;
    orb.y += (orb.ty - orb.y) * 0.030;

    // La memoria se desvanece…
    mctx.globalCompositeOperation = "destination-in";
    mctx.globalAlpha = 1;
    mctx.fillStyle = `rgba(0,0,0,${MEM_DECAY})`;
    mctx.fillRect(0, 0, mem.width, mem.height);
    // …y se escribe: el orbe y tu cursor dejan estela
    memStamp(orb.x, orb.y, 34, 0.022);
    if (ptr.active) {
      const dx = ptr.x - ptr.sx, dy = ptr.y - ptr.sy;
      if (dx * dx + dy * dy > 36) {
        memStamp(ptr.x, ptr.y, 26, 0.06);
        ptr.sx = ptr.x; ptr.sy = ptr.y;
      }
    }

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.9;
    ctx.drawImage(mem, 0, 0, w, h);
    ctx.globalAlpha = 1;
    drawOrb(orb.x, orb.y, true);
    drawDust(true);

    raf = requestAnimationFrame(frame);
  }

  // Composición fija para prefers-reduced-motion: un solo cuadro.
  function drawStatic() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "screen";
    drawOrb(w * 0.66, h * 0.42, false);
    drawDust(false);
  }

  function start() {
    if (reduced.matches) { drawStatic(); return; }
    if (!running) { running = true; raf = requestAnimationFrame(frame); }
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // --- eventos ---
  addEventListener("pointermove", (e) => {
    ptr.x = e.clientX; ptr.y = e.clientY;
    ptr.active = true; ptr.last = performance.now();
  }, { passive: true });

  addEventListener("pointerdown", (e) => {
    if (reduced.matches) return;
    memStamp(e.clientX, e.clientY, 64, 0.22);       // pulso de memoria
    for (const p of parts) {                         // el polvo reacciona
      const dx = p.x - e.clientX, dy = p.y - e.clientY;
      const d = Math.hypot(dx, dy);
      if (d < 150 && d > 0.1) {
        const k = (1 - d / 150) * 1.7;
        p.vx += (dx / d) * k; p.vy += (dy / d) * k;
      }
    }
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });

  let rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(resize, 160);
  });

  reduced.addEventListener?.("change", () => { stop(); resize(); start(); });

  resize();
  start();

  return {
    // El CTA "llama" a la presencia cuando el usuario lo considera
    focusOn(x, y) { focus = { x, y }; },
    blur() { focus = null; },
    destroy() { stop(); },
  };
}
