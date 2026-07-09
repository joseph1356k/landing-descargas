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

## El fondo vivo (js/backdrop.js)

Cuatro capas, de atrás hacia adelante:

1. **Base** — la secuencia de imágenes en crossfade lento con deriva de
   zoom (Ken Burns). Con un solo frame, rota variantes (espejo + paneo).
2. **Ondas** — la misma imagen duplicada con blend `screen` y una máscara
   con hueco central: la esfera queda estable y el humo lateral reacciona
   al mouse (desplazamiento, inclinación y elevación con inercia).
3. **Glow** — campo de luz integrado por blend que sigue al cursor.
4. **Velo** — gradientes que integran la imagen con el papel y protegen
   la legibilidad del texto.

En touch y `prefers-reduced-motion` solo queda el loop base (las capas
reactivas ni se pintan). El rAF se apaga solo cuando todo se asienta.

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

- Respeta `prefers-reduced-motion` (fondo estático, sin animaciones).
- Mobile first: imagen de 47 KB precargada, safe-areas para notch,
  blur reducido en el loader, área táctil generosa en el CTA.
- Loop pausado cuando la pestaña no está visible.
- Funciona sin JavaScript (el contenido se muestra, sin efectos).
