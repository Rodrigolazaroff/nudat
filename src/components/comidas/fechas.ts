// Fechas como texto "YYYY-MM-DD" (igual que la columna `comidas.fecha`).
// Se opera en UTC a medianoche para que la cuenta de días no dependa del huso del servidor
// ni del celu; "hoy" siempre viene de hoyISO() (hora de Argentina).

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function aDate(fecha: string) {
  return new Date(`${fecha}T00:00:00Z`);
}

export function esFechaValida(valor: unknown): valor is string {
  if (typeof valor !== "string" || !RE_FECHA.test(valor)) return false;
  const d = aDate(valor);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

export function sumarDias(fecha: string, dias: number): string {
  const d = aDate(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** `?fecha=` de la URL: válida y no futura; si no, hoy. */
export function fechaDeParam(valor: string | string[] | undefined, hoy: string): string {
  const v = Array.isArray(valor) ? valor[0] : valor;
  return esFechaValida(v) && v <= hoy ? v : hoy;
}

function formatear(fecha: string, opciones: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-AR", { ...opciones, timeZone: "UTC" }).format(aDate(fecha));
}

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Hoy", "Ayer" o el día de la semana ("Lunes"). */
export function nombreDia(fecha: string, hoy: string): string {
  if (fecha === hoy) return "Hoy";
  if (fecha === sumarDias(hoy, -1)) return "Ayer";
  return mayuscula(formatear(fecha, { weekday: "long" }));
}

/** "martes 23 de septiembre" (con el año si no es el actual). */
export function fechaLarga(fecha: string, hoy: string): string {
  return formatear(fecha, {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(fecha.slice(0, 4) !== hoy.slice(0, 4) && { year: "numeric" }),
  });
}

/** "23 de septiembre". */
export function diaYMes(fecha: string): string {
  return formatear(fecha, { day: "numeric", month: "long" });
}
