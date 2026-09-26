import { ZONA_HORARIA } from "@/lib/comidas";
import { diferenciaDias } from "@/lib/resumen";

// Formatos de fecha en español, escritos a mano (sin Intl) para que el server y el
// navegador den exactamente lo mismo y no haya diferencias al hidratar.

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function partes(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const semana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return { anio, mes, dia, semana };
}

/** "lun 22/9" */
export function fechaCorta(fecha: string): string {
  const p = partes(fecha);
  return `${DIAS_CORTOS[p.semana]} ${p.dia}/${p.mes}`;
}

/** "lunes 22 de septiembre" */
export function fechaLarga(fecha: string): string {
  const p = partes(fecha);
  return `${DIAS[p.semana]} ${p.dia} de ${MESES[p.mes - 1]}`;
}

/** "15 al 21 de septiembre", "29 de septiembre al 5 de octubre", con año si cruza. */
export function rangoFechas(desde: string, hasta: string): string {
  const a = partes(desde);
  const b = partes(hasta);
  if (a.anio !== b.anio) {
    return `${a.dia} de ${MESES[a.mes - 1]} de ${a.anio} al ${b.dia} de ${MESES[b.mes - 1]} de ${b.anio}`;
  }
  if (a.mes !== b.mes) return `${a.dia} de ${MESES[a.mes - 1]} al ${b.dia} de ${MESES[b.mes - 1]}`;
  return `${a.dia} al ${b.dia} de ${MESES[b.mes - 1]}`;
}

/** "lunes 22/9/2026" (encabezado de cada día en la hoja impresa). */
export function fechaConAnio(fecha: string): string {
  const p = partes(fecha);
  return `${DIAS[p.semana]} ${p.dia}/${p.mes}/${p.anio}`;
}

/** "25/09/2026" */
export function fechaNumerica(fecha: string): string {
  const p = partes(fecha);
  return `${String(p.dia).padStart(2, "0")}/${String(p.mes).padStart(2, "0")}/${p.anio}`;
}

/** Como rangoFechas, pero siempre con año: "15 al 21 de septiembre de 2026". */
export function rangoFechasConAnio(desde: string, hasta: string): string {
  const a = partes(desde);
  const b = partes(hasta);
  if (a.anio !== b.anio) return rangoFechas(desde, hasta);
  return `${rangoFechas(desde, hasta)} de ${b.anio}`;
}

/** Corto, para títulos y nombres de archivo: "15 al 21 sep 2026", "29 sep al 5 oct 2026". */
export function rangoFechasCorto(desde: string, hasta: string): string {
  const a = partes(desde);
  const b = partes(hasta);
  const mes = (m: number) => MESES[m - 1].slice(0, 3);
  if (a.anio !== b.anio) return `${a.dia} ${mes(a.mes)} ${a.anio} al ${b.dia} ${mes(b.mes)} ${b.anio}`;
  if (a.mes !== b.mes) return `${a.dia} ${mes(a.mes)} al ${b.dia} ${mes(b.mes)} ${b.anio}`;
  return `${a.dia} al ${b.dia} ${mes(b.mes)} ${b.anio}`;
}

/** Registro de pasada la medianoche: "madrugada del mar 23/9" (con la fecha real). */
export function madrugadaDel(fechaReal: string): string {
  return `madrugada del ${fechaCorta(fechaReal)}`;
}

/** "3 comidas · 1 bebida"; "Sin registros" si no hay nada. */
export function conteoDia(comidas: number, bebidas: number): string {
  if (comidas + bebidas === 0) return "Sin registros";
  return `${plural(comidas, "comida", "comidas")} · ${plural(bebidas, "bebida", "bebidas")}`;
}

/** Conteo de un día a partir de sus registros: "2 comidas · 1 bebida". */
export function conteoDeDia(registros: readonly { tipo: string }[]): string {
  const bebidas = registros.filter((r) => r.tipo === "bebida").length;
  return conteoDia(registros.length - bebidas, bebidas);
}

/** "08:30:00" → "08:30" */
export function horaCorta(hora: string): string {
  return hora.slice(0, 5);
}

export function plural(n: number, singular: string, varios: string): string {
  return `${n} ${n === 1 ? singular : varios}`;
}

// ─── Solo server (dependen de la hora actual o de Intl) ───────────────

/** Fecha (YYYY-MM-DD) en Argentina de un timestamp ISO. */
export function fechaArgentina(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(new Date(iso));
}

/** "hoy", "ayer", "hace 3 días", "hace 2 semanas", "hace 3 meses". */
export function haceCuanto(fecha: string, hoy: string): string {
  const n = diferenciaDias(fecha, hoy);
  if (n <= 0) return "hoy";
  if (n === 1) return "ayer";
  if (n < 14) return `hace ${n} días`;
  if (n < 60) return `hace ${Math.floor(n / 7)} semanas`;
  const meses = Math.floor(n / 30);
  return meses === 1 ? "hace 1 mes" : `hace ${meses} meses`;
}

/** "Vence en 6 días", "Vence en 5 h". */
export function venceEn(expiraEn: string, ahoraMs: number): string {
  const ms = Date.parse(expiraEn) - ahoraMs;
  if (ms <= 0) return "Vencida";
  if (ms < 86_400_000) return `Vence en ${Math.max(1, Math.ceil(ms / 3_600_000))} h`;
  const dias = Math.round(ms / 86_400_000);
  return dias === 1 ? "Vence en 1 día" : `Vence en ${dias} días`;
}

const decimal = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

/** 3.8333 → "3,8" */
export function formatearDecimal(n: number): string {
  return decimal.format(n);
}
