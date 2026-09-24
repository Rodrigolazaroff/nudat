import type { TipoComida } from "@/lib/database.types";

export const BUCKET_FOTOS = "fotos-comidas";

// En orden del día.
export const TIPOS_COMIDA: { valor: TipoComida; etiqueta: string }[] = [
  { valor: "desayuno", etiqueta: "Desayuno" },
  { valor: "media_manana", etiqueta: "Media mañana" },
  { valor: "almuerzo", etiqueta: "Almuerzo" },
  { valor: "merienda", etiqueta: "Merienda" },
  { valor: "cena", etiqueta: "Cena" },
  { valor: "colacion", etiqueta: "Colación" },
];

export function etiquetaTipo(tipo: TipoComida) {
  return TIPOS_COMIDA.find((t) => t.valor === tipo)?.etiqueta ?? tipo;
}

// Sugerencia según la hora (HH:MM). Siempre editable por el paciente.
export function sugerirTipo(hora: string): TipoComida {
  const h = Number(hora.slice(0, 2));
  if (h >= 5 && h < 10) return "desayuno";
  if (h >= 10 && h < 12) return "media_manana";
  if (h >= 12 && h < 16) return "almuerzo";
  if (h >= 16 && h < 20) return "merienda";
  if (h >= 20 || h < 2) return "cena";
  return "colacion";
}

// Fechas siempre en hora de Argentina, sin depender del huso del servidor.
export const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

export function hoyISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(new Date());
}

export function horaActual(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}
