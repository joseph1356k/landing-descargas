// ============================================================
//  Configuración editable de la landing
//  Cambia aquí el archivo de descarga, el nombre y los textos
//  sin tocar el resto del código.
// ============================================================

// Ruta (o URL absoluta) del archivo que descarga el botón.
// El binario vive en /downloads del repo; se sirve desde GitHub
// para no inflar el deploy de Vercel.
export const DOWNLOAD_URL =
  "https://github.com/joseph1356k/landing-descargas/raw/main/downloads/you-0.37.apk";

// Nombre del producto — aparece en el botón y el wordmark.
export const APP_NAME = "U";

// Texto pequeño junto al botón.
export const FINE_PRINT_DEFAULT = "Versión inicial 0.37 · Android · .apk";

// Palabras de la pantalla de carga, en orden.
export const LOADER_WORDS = ["despertando", "aprendiendo", "listo"];
