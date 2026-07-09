# U — Landing de descarga

Landing minimalista para **U**, un asistente personal de IA que aprende de ti.
HTML/CSS/JS estático, sin dependencias ni build.

## Correr en local

Los ES modules necesitan un servidor (no funciona abriendo el archivo directo):

```bash
npx serve -l 4321 .
```

Luego abre `http://localhost:4321`.

## Edición rápida

| Qué cambiar | Dónde |
|---|---|
| Archivo de descarga | `js/config.js` → `DOWNLOAD_URL` (sube el binario a `downloads/`) |
| Nombre de la app | `js/config.js` → `APP_NAME` |
| Textos del loader | `js/config.js` → `LOADER_WORDS` |
| Copy (headline, sub, timeline) | `index.html` |
| Paleta y tipografía | `styles.css` → variables en `:root` |
| Fondo vivo (orbe, polvo, memoria) | `js/presence.js` (constantes arriba del archivo) |

## Reemplazar el fondo por video/imagen

En `index.html`, dentro de `.backdrop`, comenta el `<canvas>` y descomenta el
`<video class="backdrop-media">` (o usa un `<img>` con la misma clase).

## Estructura

```
index.html        página completa (hero + sección memoria)
styles.css        estilos y tokens de diseño
js/config.js      constantes editables
js/main.js        loader, revelados, CTA magnético
js/presence.js    fondo vivo en canvas (orbe + polvo + estela de memoria)
downloads/        coloca aquí app.zip
```

## Accesibilidad y rendimiento

- Respeta `prefers-reduced-motion` (fondo estático, sin animaciones).
- Canvas pausado cuando la pestaña no está visible; DPR limitado a 1.75.
- Funciona sin JavaScript (el contenido se muestra, sin efectos).
