// ============================================================
//  main.js — orquestación de la landing
//  Loader → fondo vivo → revelado del hero → CTA magnético
// ============================================================

import { DOWNLOAD_URL, APP_NAME, LOADER_WORDS } from "./config.js";
import { createBackdrop } from "./backdrop.js";

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

requestAnimationFrame(() => { fillEl.style.transform = "scaleX(1)"; });

let wordIndex = 0;
const wordCycle = setInterval(() => {
  wordIndex += 1;
  if (wordIndex >= LOADER_WORDS.length) { clearInterval(wordCycle); return; }
  wordEl.style.animation = "none";
  void wordEl.offsetWidth; // reinicia la animación de entrada
  wordEl.textContent = LOADER_WORDS[wordIndex];
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

loader?.addEventListener("click", revealPage); // clic = saltar la intro

// ---------- CTA magnético v2 (solo mouse) ----------
//  Atracción con inercia real: el botón se acerca al cursor,
//  crece apenas al "engancharse" y regresa con un resorte
//  suave al soltarlo. Un solo rAF que se apaga al asentarse.
if (hoverable.matches) {
  const REACH = 140, PULL = 0.27, MAX = 14;
  const clamp = (v) => Math.max(-MAX, Math.min(MAX, v));
  const state = ctas.map((a) => ({ a, x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1 }));
  let mx = 0, my = 0, raf = 0;

  const loop = () => {
    let live = false;
    for (const st of state) {
      const r = st.a.getBoundingClientRect();
      // centro sin el desplazamiento actual (evita realimentación)
      const cx = r.left + r.width / 2 - st.x;
      const cy = r.top + r.height / 2 - st.y;
      const dx = mx - cx, dy = my - cy;
      const inside =
        Math.abs(dx) < r.width / 2 + REACH &&
        Math.abs(dy) < r.height / 2 + REACH;

      st.tx = inside ? clamp(dx * PULL) : 0;
      st.ty = inside ? clamp(dy * PULL) : 0;
      st.ts = inside ? 1.05 : 1;

      st.x += (st.tx - st.x) * 0.16;
      st.y += (st.ty - st.y) * 0.16;
      st.s += (st.ts - st.s) * 0.14;

      const settled =
        !inside &&
        Math.abs(st.x) + Math.abs(st.y) < 0.05 &&
        Math.abs(st.s - 1) < 0.002;

      if (settled) {
        if (st.a.style.transform) st.a.style.transform = "";
        st.x = st.y = 0; st.s = 1;
      } else {
        st.a.style.transform =
          `translate(${st.x.toFixed(2)}px, ${st.y.toFixed(2)}px) scale(${st.s.toFixed(3)})`;
        live = true;
      }
    }
    raf = live ? requestAnimationFrame(loop) : 0;
  };

  addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!raf) raf = requestAnimationFrame(loop);
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
