# U — Landing de descarga

Landing minimalista de tema claro para **U**, un asistente personal de IA
que aprende de ti. HTML/CSS/JS estático, sin dependencias ni build.

## Correr en local

Los ES modules necesitan un servidor (no funciona abriendo el archivo directo):

```bash
npx serve -l 4321 .
```

Luego abre `http://localhost:4321`.

## Edición rápida

| Qué cambiar | Dónde |
|---|---|
| Archivo de descarga | `js/config.js` → `DOWNLOAD_URL` (sube el binario a `downloads/` con nombre limpio, ej. `U-0.38.apk`) |
| Nombre de la app | `js/config.js` → `APP_NAME` |
| Frames del fondo | `js/config.js` → `BG_IMAGES` (súbelos a `assets/bg/` y usa la URL de GitHub raw) |
| Velocidad del loop de fondo | `js/config.js` → `BG_HOLD_MS` / `BG_FADE_MS` |
| Textos del loader | `js/config.js` → `LOADER_WORDS` |
| Copy (headline, sub, timeline) | `index.html` |
| Paleta y tipografía | `styles.css` → variables en `:root` |
| Intensidad de la reacción al mouse | `js/backdrop.js` → multiplicadores dentro de `apply()` |

## El fondo vivo (js/waves-gl.js + js/backdrop.js)

**Camino principal — WebGL**: la imagen se deforma con un shader.
Olas sinusoidales en tres frecuencias fluyen sin fin alrededor de la
esfera (fuertes en el humo, suaves en el centro), la esfera flota
arriba/abajo, y el mouse dobla la imagen (parallax fuerte), empuja el
humo localmente y lleva una luz integrada. Movimiento continuo de
píxeles, también en móvil (el touch también deforma al arrastrar).
Soporta varias texturas con crossfade (`BG_IMAGES`).

**Fallback sin WebGL**: capas DOM — crossfade de variantes + imagen
duplicada con blend/máscara reactiva al mouse + glow.

La animación corre siempre, aunque el sistema tenga los efectos de
animación desactivados (`prefers-reduced-motion` se ignora a propósito:
es parte del producto). Ajustes rápidos en el shader de `waves-gl.js`:
amplitudes de `warp` (olas), `bob` (flotación) y `par`/`push` (mouse).

## Binarios e imágenes pesadas

El APK y los frames del fondo se sirven desde **GitHub raw** (no van en el
deploy de Vercel). Por eso las URLs en `js/config.js` son absolutas.
El fondo usa `orb-1.jpg` (47 KB); el PNG original queda como fuente.

## Estructura

```
index.html        página completa (hero + sección memoria)
styles.css        estilos y tokens de diseño (tema claro)
js/config.js      constantes editables
js/main.js        loader, revelados, CTA magnético
js/backdrop.js    fondo vivo por capas reactivo al mouse
assets/bg/        frames del fondo
downloads/        binario de la app (U-x.xx.apk)
```

## Accesibilidad y rendimiento

- Mobile first: imagen de 47 KB precargada, safe-areas para notch,
  blur reducido en el loader, área táctil generosa en el CTA.
- Loop pausado cuando la pestaña no está visible.
- Funciona sin JavaScript (el contenido se muestra, sin efectos).
