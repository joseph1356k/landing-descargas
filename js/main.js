// ============================================================
//  main.js — orquestación de la landing
//  Loader → fondo vivo → revelado del hero → CTA magnético
// ============================================================

import { DOWNLOAD_URL, APP_NAME, LOADER_WORDS } from "./config.js";
import { createBackdrop } from "./backdrop.js";

const reduced  = matchMedia("(prefers-reduced-motion: reduce)");
const hoverable = matchMedia("(hover: hover) and (pointer: fine)");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- fondo vivo ----------
const backdrop = createBackdrop(document.querySelector(".backdrop"));

// ---------- descarga ----------
const ctas = [...document.querySelectorAll("[data-download]")];
for (const a of ctas) {
  a.href = DOWNLOAD_URL;
  const label = a.querySelector(".cta-label");
  if (label) label.textContent = `Descargar ${APP_NAME}`;
}

// ---------- pantalla de carga ----------
const loader  = document.getElementById("loader");
const wordEl  = document.getElementById("loaderWord");
const fillEl  = document.getElementById("loaderFill");

function revealPage() {
  if (!document.body.classList.contains("is-loading")) return;
  document.body.classList.remove("is-loading");
  document.body.classList.add("is-ready");
  setTimeout(() => loader?.remove(), 1100);
}

if (reduced.matches) {
  wordEl.textContent = "listo";
  wait(400).then(revealPage);
} else {
  requestAnimationFrame(() => { fillEl.style.transform = "scaleX(1)"; });

  let i = 0;
  const cycle = setInterval(() => {
    i += 1;
    if (i >= LOADER_WORDS.length) { clearInterval(cycle); return; }
    wordEl.style.animation = "none";
    void wordEl.offsetWidth; // reinicia la animación de entrada
    wordEl.textContent = LOADER_WORDS[i];
    wordEl.style.animation = "";
  }, 900);

  // La intro dura ~3 s: da tiempo a ver el fondo despertar,
  // y espera a que el primer frame y las fuentes estén listos.
  const MIN_MS = 2950;
  const started = performance.now();
  const assets = Promise.race([
    Promise.all([document.fonts?.ready ?? wait(0), backdrop.ready]),
    wait(3600),
  ]);
  assets
    .then(() => wait(Math.max(0, MIN_MS - (performance.now() - started))))
    .then(revealPage);
}
loader?.addEventListener("click", revealPage); // clic = saltar la intro

// ---------- CTA magnético (solo mouse, sin reduced-motion) ----------
if (hoverable.matches && !reduced.matches) {
  const REACH = 90, PULL = 0.16, MAX = 8;
  let queued = false, ev = null;

  addEventListener("pointermove", (e) => {
    ev = e;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      for (const a of ctas) {
        const r = a.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = ev.clientX - cx, dy = ev.clientY - cy;
        const inside =
          Math.abs(dx) < r.width / 2 + REACH &&
          Math.abs(dy) < r.height / 2 + REACH;
        if (inside) {
          const tx = Math.max(-MAX, Math.min(MAX, dx * PULL));
          const ty = Math.max(-MAX, Math.min(MAX, dy * PULL));
          a.style.transform = `translate(${tx}px, ${ty}px)`;
        } else if (a.style.transform) {
          a.style.transform = "";
        }
      }
    });
  }, { passive: true });
}

// ---------- revelado por scroll de la sección memoria ----------
const memory = document.getElementById("memoria");
if (memory) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.2 }
  );
  io.observe(memory);
}

// ---------- detalles ----------
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
