// ============================================================
//  Configuración editable de la landing
//  Cambia aquí el archivo de descarga, el nombre, los textos
//  y los frames del fondo sin tocar el resto del código.
// ============================================================

// Ruta (o URL absoluta) del archivo que descarga el botón.
// El binario vive en /downloads del repo; se sirve desde GitHub
// para no inflar el deploy de Vercel.
export const DOWNLOAD_URL =
  "https://github.com/joseph1356k/landing-descargas/raw/main/downloads/U-0.37.apk";

// Nombre del producto — aparece en el botón y el wordmark.
export const APP_NAME = "U";

// Palabras de la pantalla de carga, en orden.
export const LOADER_WORDS = ["despertando", "aprendiendo", "listo"];

// ------------------------------------------------------------
//  Fondo animado
//  Agrega aquí más frames de la secuencia (en orden). Con un
//  solo frame el sistema genera variantes (espejo + zoom/paneo)
//  para que el fondo respire igual. Sube los archivos a
//  assets/bg/ y usa su URL de GitHub raw para producción.
// ------------------------------------------------------------
export const BG_IMAGES = [
  "https://github.com/joseph1356k/landing-descargas/raw/main/assets/bg/orb-1.jpg",
];

// Cuánto se sostiene cada frame y cuánto dura el fundido (ms).
export const BG_HOLD_MS = 5500;
export const BG_FADE_MS = 2800;
