// ============================================================
//  backdrop.js — fondo vivo
//
//  Camino principal: WebGL (waves-gl.js). La imagen misma se
//  deforma: olas continuas alrededor de la esfera, la esfera
//  flota arriba/abajo y el mouse dobla/empuja el humo con
//  fuerza. Movimiento real de píxeles, no capas desplazadas.
//
//  Fallback (sin WebGL): el sistema de capas DOM de siempre —
//  crossfade de variantes + ondas duplicadas con blend/máscara
//  + glow, todo reactivo al mouse con inercia.
// ============================================================

import { BG_IMAGES, BG_HOLD_MS, BG_FADE_MS } from "./config.js";
import { createWavesGL } from "./waves-gl.js";

const hoverable = matchMedia("(hover: hover) and (pointer: fine)");

export function createBackdrop(root) {
  try {
    const gl = createWavesGL(root, BG_IMAGES, { holdMs: BG_HOLD_MS, fadeMs: BG_FADE_MS });
    if (gl) {
      root.classList.add("gl-on"); // oculta las capas DOM
      // Si la textura no carga (CORS, red, bloqueadores), se
      // desmonta el canvas y entran las capas DOM sin dejar
      // la página colgada.
      const ready = gl.ready.catch(() => {
        gl.destroy();
        root.classList.remove("gl-on");
        return createDomBackdrop(root).ready;
      });
      return { ready, destroy: gl.destroy };
    }
  } catch { /* sin WebGL → capas DOM */ }
  return createDomBackdrop(root);
}

// ------------------------------------------------------------
//  Fallback DOM (idéntico al sistema anterior)
// ------------------------------------------------------------

const VARIANTS = [
  { flip: false, s: 1.02, x: 0,    y: 0    },
  { flip: true,  s: 1.07, x: 0.8,  y: -0.6 },
  { flip: false, s: 1.12, x: -0.7, y: -1.2 },
  { flip: true,  s: 1.05, x: 0.5,  y: 0.8  },
];

const DRIFT = 0.05;
const IDLE_MS = 3200;

function transformOf(v, extraScale = 0) {
  const flip = v.flip ? " scaleX(-1)" : "";
  return `translate(${v.x}%, ${v.y}%) scale(${(v.s + extraScale).toFixed(3)})${flip}`;
}

function createDomBackdrop(root) {
  const layers = [...root.querySelectorAll(".bg-layer")];
  const depth  = root.querySelector(".bg-depth");
  const waves  = [...root.querySelectorAll(".bg-wave")];
  const glow   = root.querySelector(".bg-glow");

  let timer = 0;
  let step = 0;
  let active = 0;

  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => resolve(src);
      img.src = src;
    });

  const ready = loadImage(BG_IMAGES[0]);
  BG_IMAGES.slice(1).forEach(loadImage);

  const frameCount = Math.max(BG_IMAGES.length, VARIANTS.length);
  const imageAt = (i) => BG_IMAGES[i % BG_IMAGES.length];
  const variantAt = (i) => VARIANTS[i % VARIANTS.length];

  function showFrame(i, instant = false) {
    const layer = layers[active];
    const v = variantAt(i);
    layer.style.backgroundImage = `url("${imageAt(i)}")`;

    if (instant) {
      layer.style.transition = "none";
      layer.style.transform = transformOf(v);
      layer.style.opacity = "1";
      return;
    }

    layer.style.transition = "none";
    layer.style.transform = transformOf(v);
    layer.style.opacity = "0";
    void layer.offsetWidth;

    layer.style.transition =
      `opacity ${BG_FADE_MS}ms ease, ` +
      `transform ${BG_HOLD_MS + BG_FADE_MS * 2}ms linear`;
    layer.style.transform = transformOf(v, DRIFT);
    layer.style.opacity = "1";

    const other = layers[1 - active];
    other.style.transition = `opacity ${BG_FADE_MS}ms ease`;
    other.style.opacity = "0";
  }

  function cycle() {
    step = (step + 1) % frameCount;
    active = 1 - active;
    showFrame(step);
  }

  function start() {
    if (frameCount < 2) return;
    if (!timer) timer = setInterval(cycle, BG_HOLD_MS + BG_FADE_MS);
  }
  function stop() {
    clearInterval(timer);
    timer = 0;
  }

  ready.then((src) => {
    showFrame(0, true);
    for (const w of waves) w.style.backgroundImage = `url("${src}")`;
    start();
  });

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });

  if (hoverable.matches) {
    const cur = { nx: 0, ny: 0, gx: innerWidth / 2, gy: innerHeight / 2 };
    const tgt = { nx: 0, ny: 0, gx: innerWidth / 2, gy: innerHeight / 2 };
    let raf = 0;
    let lastMove = 0;
    let glowOn = false;

    const apply = () => {
      depth.style.transform =
        `translate3d(${(cur.nx * -8).toFixed(2)}px, ${(cur.ny * -6).toFixed(2)}px, 0)`;

      const [a, b] = waves;
      if (a) {
        a.style.transform =
          `translate3d(${(cur.nx * 34).toFixed(2)}px, ${(cur.ny * 24).toFixed(2)}px, 0) ` +
          `rotate(${(cur.nx * 1).toFixed(3)}deg) scale(1.06)`;
      }
      if (b) {
        b.style.transform =
          `translate3d(${(cur.nx * -26).toFixed(2)}px, ${(cur.ny * 34).toFixed(2)}px, 0) ` +
          `rotate(${(cur.nx * -0.7).toFixed(3)}deg) scale(1.12) scaleX(-1)`;
      }

      if (glow) {
        glow.style.transform =
          `translate3d(${cur.gx.toFixed(1)}px, ${cur.gy.toFixed(1)}px, 0) translate(-50%, -50%)`;
        glow.style.opacity = glowOn ? "0.55" : "0";
      }
    };

    const tick = () => {
      const idle = performance.now() - lastMove > IDLE_MS;
      if (idle) { tgt.nx = 0; tgt.ny = 0; glowOn = false; }

      cur.nx += (tgt.nx - cur.nx) * 0.055;
      cur.ny += (tgt.ny - cur.ny) * 0.055;
      cur.gx += (tgt.gx - cur.gx) * 0.12;
      cur.gy += (tgt.gy - cur.gy) * 0.12;
      apply();

      const settled =
        idle &&
        Math.abs(tgt.nx - cur.nx) + Math.abs(tgt.ny - cur.ny) < 0.001 &&
        Math.abs(tgt.gx - cur.gx) + Math.abs(tgt.gy - cur.gy) < 0.3;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };

    addEventListener("pointermove", (e) => {
      tgt.nx = (e.clientX / innerWidth) * 2 - 1;
      tgt.ny = (e.clientY / innerHeight) * 2 - 1;
      tgt.gx = e.clientX;
      tgt.gy = e.clientY;
      lastMove = performance.now();
      glowOn = true;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    document.documentElement.addEventListener("pointerleave", () => {
      lastMove = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }

  return { ready, destroy: stop };
}
