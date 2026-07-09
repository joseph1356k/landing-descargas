// ============================================================
//  backdrop.js — fondo vivo por secuencia de imágenes
//
//  Dos capas que se funden lentamente entre "frames". Cada
//  frame combina una imagen de la secuencia con una variante
//  de encuadre (espejo, zoom y paneo sutil), de modo que:
//   · con varias imágenes, el humo evoluciona frame a frame;
//   · con una sola, las variantes bastan para que respire;
//   · el loop siempre cierra sin salto.
//
//  Nada brusco: fundidos largos, deriva lenta, esfera estable.
// ============================================================

import { BG_IMAGES, BG_HOLD_MS, BG_FADE_MS } from "./config.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const hoverable = matchMedia("(hover: hover) and (pointer: fine)");

// Encuadres por los que rota la secuencia. La esfera está al
// centro de las imágenes, así que el espejo no la mueve.
const VARIANTS = [
  { flip: false, s: 1.02, x: 0,    y: 0    },
  { flip: true,  s: 1.07, x: 0.8,  y: -0.6 },
  { flip: false, s: 1.12, x: -0.7, y: -1.2 },
  { flip: true,  s: 1.05, x: 0.5,  y: 0.8  },
];

const DRIFT = 0.05; // cuánto crece el zoom mientras un frame está visible

function transformOf(v, extraScale = 0) {
  const flip = v.flip ? " scaleX(-1)" : "";
  return `translate(${v.x}%, ${v.y}%) scale(${(v.s + extraScale).toFixed(3)})${flip}`;
}

export function createBackdrop(root) {
  const layers = [...root.querySelectorAll(".bg-layer")];
  const parallax = root.querySelector(".bg-parallax");
  let timer = 0;
  let step = 0;
  let active = 0;

  // --- precarga (la primera imagen bloquea el reveal del loader) ---
  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => resolve(src); // no bloquear si una falla
      img.src = src;
    });

  const ready = loadImage(BG_IMAGES[0]);
  BG_IMAGES.slice(1).forEach(loadImage); // el resto, en segundo plano

  const frameCount = Math.max(BG_IMAGES.length, VARIANTS.length);
  const imageAt = (i) => BG_IMAGES[i % BG_IMAGES.length];
  const variantAt = (i) => VARIANTS[i % VARIANTS.length];

  function showFrame(i, instant = false) {
    const layer = layers[active];
    const v = variantAt(i);
    layer.style.backgroundImage = `url("${imageAt(i)}")`;

    if (instant || reduced.matches) {
      layer.style.transition = "none";
      layer.style.transform = transformOf(v);
      layer.style.opacity = "1";
      return;
    }

    // arranca en su encuadre inicial, sin transición…
    layer.style.transition = "none";
    layer.style.transform = transformOf(v);
    layer.style.opacity = "0";
    void layer.offsetWidth;

    // …y deriva hacia su encuadre final mientras aparece
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
    if (reduced.matches || frameCount < 2) return;
    if (!timer) timer = setInterval(cycle, BG_HOLD_MS + BG_FADE_MS);
  }
  function stop() {
    clearInterval(timer);
    timer = 0;
  }

  // primer frame en cuanto haya imagen
  ready.then(() => {
    showFrame(0, true);
    start();
  });

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });

  reduced.addEventListener?.("change", () => {
    stop();
    showFrame(step, true);
    start();
  });

  // --- parallax sutil con el mouse ---
  if (hoverable.matches && !reduced.matches && parallax) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const MAX = 9; // px de desplazamiento máximo

    const tick = () => {
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      parallax.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    addEventListener("pointermove", (e) => {
      tx = (e.clientX / innerWidth - 0.5) * -2 * MAX;
      ty = (e.clientY / innerHeight - 0.5) * -2 * MAX;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  return { ready, destroy: stop };
}
