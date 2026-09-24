// Helpers de fotos para el navegador. Funciones puras: no dependen de React ni de Supabase.
//
// - leerFechaFoto(): fecha y hora de la toma (EXIF DateTimeOriginal) en el formato del esquema.
//   Hay que llamarla con el archivo ORIGINAL: comprimirImagen() devuelve un JPEG sin metadatos.
// - comprimirImagen(): JPEG liviano para subir (máx. 1600 px del lado largo, calidad 0.8).
//   Al recomprimir también se descartan el GPS y el resto del EXIF de la foto original.
// - rutaFoto(): ruta en el bucket, `{paciente_id}/{uuid}.jpg`.

import type * as Exifr from "exifr";
// Bundle "mini" de exifr: solo JPEG + TIFF/EXIF, sin diccionarios (~8 kB gzip). Sin
// diccionarios las claves de la salida son los códigos numéricos de los tags.
// @ts-expect-error -- este subpath no publica tipos propios; son los mismos que los de "exifr".
import * as exifrMini from "exifr/dist/mini.esm.mjs";

const exifr = exifrMini as typeof Exifr;

export const LADO_MAXIMO = 1600;
export const CALIDAD_JPEG = 0.8;

export type FechaHora = { fecha: string; hora: string }; // YYYY-MM-DD y HH:MM

const TAG_DATE_TIME_ORIGINAL = 0x9003;
const TAG_DATE_TIME_DIGITIZED = 0x9004; // respaldo: en fotos de celular coincide con el original

const OPCIONES_EXIF: Parameters<typeof Exifr.parse>[1] = {
  // Del bloque EXIF solo las dos fechas. IFD0 se recorre igual (tiene el puntero al bloque EXIF).
  exif: { pick: [TAG_DATE_TIME_ORIGINAL, TAG_DATE_TIME_DIGITIZED] },
  gps: false,
  interop: false,
  ifd1: false,
  // Queremos el texto crudo "YYYY:MM:DD HH:MM:SS": es la hora de reloj del celular al sacar la
  // foto, que es justo lo que se registra. Convertirlo a Date metería la zona horaria en el medio.
  translateKeys: false,
  translateValues: false,
  reviveValues: false,
};

/** Fecha y hora de la toma, o null si la foto no la tiene (capturas, PNG, fotos de WhatsApp…). */
export async function leerFechaFoto(archivo: Blob): Promise<FechaHora | null> {
  try {
    const salida = (await exifr.parse(archivo, OPCIONES_EXIF)) as
      | Record<number, unknown>
      | undefined;
    if (!salida) return null;
    return (
      interpretarFechaExif(salida[TAG_DATE_TIME_ORIGINAL]) ??
      interpretarFechaExif(salida[TAG_DATE_TIME_DIGITIZED])
    );
  } catch {
    // Formato no soportado por el bundle mini o archivo dañado: seguimos sin fecha.
    return null;
  }
}

/** "2026:09:23 13:05:42" → { fecha: "2026-09-23", hora: "13:05" }. Exportada para tests. */
export function interpretarFechaExif(valor: unknown): FechaHora | null {
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    // exifr arma el Date con la hora local, así que los getters locales devuelven la del reloj.
    return armarFechaHora(
      valor.getFullYear(),
      valor.getMonth() + 1,
      valor.getDate(),
      valor.getHours(),
      valor.getMinutes(),
    );
  }
  if (typeof valor !== "string") return null;
  const m = /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2})/.exec(valor.trim());
  if (!m) return null;
  return armarFechaHora(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]));
}

function armarFechaHora(
  anio: number,
  mes: number,
  dia: number,
  hora: number,
  minuto: number,
): FechaHora | null {
  // Cámaras sin fecha configurada escriben "0000:00:00 00:00:00" o valores basura.
  if (anio < 2000 || anio > 2100) return null;
  if (hora > 23 || minuto > 59) return null;
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  if (d.getUTCFullYear() !== anio || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) {
    return null; // 31 de febrero y similares
  }
  const dos = (n: number) => String(n).padStart(2, "0");
  return { fecha: `${anio}-${dos(mes)}-${dos(dia)}`, hora: `${dos(hora)}:${dos(minuto)}` };
}

type ImagenDecodificada = {
  fuente: CanvasImageSource;
  ancho: number;
  alto: number;
  liberar: () => void;
};

async function decodificar(archivo: Blob): Promise<ImagenDecodificada> {
  try {
    // "from-image" aplica la orientación EXIF (fotos del celular en vertical). Los navegadores
    // que no conocen la opción tiran TypeError y caemos al <img>.
    const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    return {
      fuente: bitmap,
      ancho: bitmap.width,
      alto: bitmap.height,
      liberar: () => bitmap.close(),
    };
  } catch {
    // Respaldo: <img> respeta la orientación EXIF por defecto (image-orientation: from-image).
    // onload en vez de img.decode(): decode() puede no resolver si la pestaña no está visible.
    const url = URL.createObjectURL(archivo);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("No se pudo decodificar la imagen"));
        img.src = url;
      });
      return {
        fuente: img,
        ancho: img.naturalWidth,
        alto: img.naturalHeight,
        liberar: () => URL.revokeObjectURL(url),
      };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }
}

/** Medidas finales: el lado largo queda en `ladoMaximo` como mucho (nunca se agranda). */
export function medidasEscaladas(ancho: number, alto: number, ladoMaximo = LADO_MAXIMO) {
  const escala = Math.min(1, ladoMaximo / Math.max(ancho, alto));
  return {
    ancho: Math.max(1, Math.round(ancho * escala)),
    alto: Math.max(1, Math.round(alto * escala)),
  };
}

/** Recomprime la foto a JPEG. Tira Error si el navegador no puede leerla (p. ej. HEIC en Chrome). */
export async function comprimirImagen(
  archivo: Blob,
  { ladoMaximo = LADO_MAXIMO, calidad = CALIDAD_JPEG } = {},
): Promise<Blob> {
  const imagen = await decodificar(archivo);
  const canvas = document.createElement("canvas");
  try {
    if (!imagen.ancho || !imagen.alto) throw new Error("Imagen sin dimensiones");
    const { ancho, alto } = medidasEscaladas(imagen.ancho, imagen.alto, ladoMaximo);
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D no disponible");
    // Fondo blanco: un PNG con transparencia quedaría negro al pasarlo a JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ancho, alto);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imagen.fuente, 0, 0, ancho, alto);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", calidad),
    );
    if (!blob) throw new Error("No se pudo generar el JPEG");
    return blob;
  } finally {
    imagen.liberar();
    // Safari en iOS tiene un tope de memoria para canvas: lo soltamos enseguida.
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** Ruta en el bucket de fotos: `{pacienteId}/{uuid}.jpg`. */
export function rutaFoto(pacienteId: string): string {
  return `${pacienteId}/${uuid()}.jpg`;
}

// crypto.randomUUID solo existe en contextos seguros (https o localhost). Probando desde el
// celu contra la IP de la compu (http://192.168…) no está, así que lo armamos a mano.
function uuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // versión 4
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
