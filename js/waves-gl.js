// ============================================================
//  waves-gl.js — olas continuas en WebGL sobre la imagen
//
//  En lugar de mover capas, deformamos la imagen misma con un
//  shader: ondas sinusoidales en capas que fluyen sin fin
//  alrededor de la esfera (más fuertes en el humo lateral,
//  suaves en el centro), un vaivén vertical que hace flotar
//  la esfera, y el mouse dobla/empuja el campo con fuerza:
//   · parallax fuerte de la imagen hacia el cursor,
//   · empuje local (el humo se aparta alrededor del puntero),
//   · luz integrada que abrillanta por donde pasa.
//
//  Soporta varias texturas con crossfade (BG_IMAGES). Si no
//  hay WebGL, backdrop.js usa el fallback de capas DOM.
// ============================================================

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uMix;
uniform float uTime;
uniform float uAspect;
uniform vec2  uScale;
uniform vec2  uMouseN;   // -1..1 desde el centro
uniform vec2  uMouseUv;  // 0..1 en pantalla
uniform float uPower;    // fuerza de la interacción

void main() {
  vec2 suv = vUv;

  // distancia a la esfera (centro visual de la imagen)
  vec2 c = vec2(0.5, 0.54);
  float d = length(vec2((suv.x - c.x) * uAspect, suv.y - c.y));
  float side = smoothstep(0.10, 0.42, d); // 0 en la esfera, 1 en el humo

  // --- olas continuas: tres frecuencias superpuestas ---
  vec2 warp = vec2(
    sin(suv.y * 6.0  + uTime * 0.75) * 0.020 +
    sin(suv.y * 13.0 - uTime * 0.50) * 0.009 +
    sin(suv.y * 2.2  + uTime * 0.30) * 0.022,
    sin(suv.x * 5.0  + uTime * 0.60) * 0.016 +
    cos(suv.x * 11.0 + uTime * 0.85) * 0.008 +
    cos(suv.x * 2.0  - uTime * 0.24) * 0.016
  ) * side;

  // --- la esfera flota: vaivén vertical global ---
  float bob = sin(uTime * 0.5) * 0.012;

  // --- mouse: parallax fuerte + empuje local del humo ---
  vec2 par = uMouseN * vec2(0.085, 0.065) * (0.30 + 0.70 * side) * uPower;
  vec2 mv = vec2((suv.x - uMouseUv.x) * uAspect, suv.y - uMouseUv.y);
  float md = length(mv);
  vec2 push = (md > 0.001 ? mv / md : vec2(0.0))
              * exp(-md * md * 12.0) * 0.030 * uPower * side;

  vec2 tuv = (suv + warp + par + push - 0.5) * uScale + 0.5 + vec2(0.0, bob);
  vec4 col = mix(texture2D(uTexA, tuv), texture2D(uTexB, tuv), uMix);

  // luz que acompaña el cursor, fundida en la imagen
  col.rgb += exp(-md * md * 16.0) * 0.12 * uPower;

  gl_FragColor = col;
}`;

const DPR_MAX = 1.6;
const ZOOM = 1.18;      // margen para que la deformación nunca muestre bordes
const IDLE_MS = 3200;   // sin mouse → la interacción se relaja

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
  return sh;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // GitHub raw envía CORS *
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function createWavesGL(container, urls, { holdMs = 5500, fadeMs = 2800 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = "bg-canvas";
  const gl = canvas.getContext("webgl", {
    antialias: false, alpha: false, depth: false, stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  // triángulo fullscreen
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const n of ["uTexA", "uTexB", "uMix", "uTime", "uAspect", "uScale", "uMouseN", "uMouseUv", "uPower"]) {
    U[n] = gl.getUniformLocation(prog, n);
  }
  gl.uniform1i(U.uTexA, 0);
  gl.uniform1i(U.uTexB, 1);

  // nunca negro: el lienzo arranca del color del papel
  gl.clearColor(0.929, 0.937, 0.957, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const makeTex = () => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  };
  let texA = makeTex();
  let texB = makeTex();
  const upload = (tex, img) => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  };

  let imgW = 16, imgH = 9;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, DPR_MAX);
    const w = container.clientWidth || innerWidth;
    const h = container.clientHeight || innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const ca = w / h, ia = imgW / imgH;
    const sx = ca > ia ? 1 : ca / ia;
    const sy = ca > ia ? ia / ca : 1;
    gl.uniform2f(U.uScale, sx / ZOOM, sy / ZOOM);
    gl.uniform1f(U.uAspect, ca);
  }

  // --- estado de interacción (lerp con inercia) ---
  const cur = { nx: 0, ny: 0, ux: 0.5, uy: 0.5, power: 0 };
  const tgt = { nx: 0, ny: 0, ux: 0.5, uy: 0.5, power: 0 };
  let lastMove = 0;

  addEventListener("pointermove", (e) => {
    tgt.nx = (e.clientX / innerWidth) * 2 - 1;
    tgt.ny = (e.clientY / innerHeight) * 2 - 1;
    tgt.ux = e.clientX / innerWidth;
    tgt.uy = 1 - e.clientY / innerHeight; // uv con origen abajo
    tgt.power = 1;
    lastMove = performance.now();
  }, { passive: true });

  document.documentElement.addEventListener("pointerleave", () => { lastMove = 0; });

  // --- crossfade entre texturas (si hay varias imágenes) ---
  let mix = 0, mixTarget = 0, cycleTimer = 0, idx = 0;
  const mixStep = 1000 / 60 / fadeMs; // por frame aprox

  function startCycle() {
    if (urls.length < 2 || cycleTimer) return;
    cycleTimer = setInterval(() => {
      idx = (idx + 1) % urls.length;
      loadImage(urls[idx]).then((img) => {
        upload(texB, img);
        mixTarget = 1;
      }).catch(() => {});
    }, holdMs + fadeMs);
  }

  // --- render ---
  let raf = 0, running = false;

  function render() {
    const t = performance.now();
    const idle = t - lastMove > IDLE_MS;
    if (idle) { tgt.nx = 0; tgt.ny = 0; tgt.power = 0; } // relajación

    cur.nx += (tgt.nx - cur.nx) * 0.06;
    cur.ny += (tgt.ny - cur.ny) * 0.06;
    cur.ux += (tgt.ux - cur.ux) * 0.10;
    cur.uy += (tgt.uy - cur.uy) * 0.10;
    cur.power += (tgt.power - cur.power) * 0.07;

    if (mix !== mixTarget) {
      mix = Math.min(1, mix + mixStep);
      if (mix >= 1) { // el frame nuevo pasa a ser la base
        const tmp = texA; texA = texB; texB = tmp;
        mix = 0; mixTarget = 0;
      }
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texB);

    gl.uniform1f(U.uTime, t * 0.001);
    gl.uniform1f(U.uMix, mix);
    gl.uniform2f(U.uMouseN, cur.nx, -cur.ny);
    gl.uniform2f(U.uMouseUv, cur.ux, cur.uy);
    gl.uniform1f(U.uPower, cur.power);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(render);
  }

  function start() { if (!running) { running = true; raf = requestAnimationFrame(render); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });

  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  container.prepend(canvas);
  resize();

  const destroy = () => {
    stop();
    clearInterval(cycleTimer);
    canvas.remove();
  };

  const ready = loadImage(urls[0]).then((img) => {
    imgW = img.naturalWidth; imgH = img.naturalHeight;
    upload(texA, img);
    upload(texB, img); // misma textura hasta que llegue otro frame
    resize();
    render();          // primer cuadro inmediato (sin esperar rAF)
    stop();            // reinicia el loop limpio
    start();
    startCycle();
    return urls[0];
  });
  // si la textura falla (CORS, red), el caller decide el fallback

  return { ready, destroy };
}
