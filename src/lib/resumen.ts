import type { Comida, TipoComida } from "@/lib/database.types";
import { TIPOS_COMIDA, esBebida } from "@/lib/comidas";

// Resumen automático del registro alimentario de una persona en un período.
//
// Todo es puro: no lee la hora actual ni la base, todo entra por parámetro.
// Fechas como "YYYY-MM-DD" y horas como "HH:MM" o "HH:MM:SS" (lo que guarda Postgres),
// sin husos horarios: se cargan en hora de Argentina y así se comparan.
//
// "Día alimentario": lo que se come antes de las 05:00 cuenta para el día anterior.
// Una cena del martes a las 00:30 es la cena del lunes, y sus minutos se expresan
// pasados de 1440 (00:30 → 24:30 = 1470). Así los promedios, rangos y ayunos cruzan
// la medianoche sin romperse (el promedio de 23:30 y 00:30 da 00:00, no 12:00).

export const HORA_CORTE_DIA = 5; // 05:00
const MINUTOS_CORTE = HORA_CORTE_DIA * 60;
const MINUTOS_DIA = 24 * 60;
const MS_DIA = 86_400_000;

/** Una cena cuenta como tarde si es estrictamente después de esta hora (22:00). */
export const MINUTOS_CENA_TARDE = 22 * 60;

export const COMIDAS_PRINCIPALES = [
  "desayuno",
  "almuerzo",
  "merienda",
  "cena",
] as const satisfies readonly TipoComida[];
export type ComidaPrincipal = (typeof COMIDAS_PRINCIPALES)[number];

export function esComidaPrincipal(tipo: TipoComida): tipo is ComidaPrincipal {
  return (COMIDAS_PRINCIPALES as readonly TipoComida[]).includes(tipo);
}

// ─── Fechas ───────────────────────────────────────────────────────────

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function aMs(fecha: string): number {
  return Date.parse(`${fecha}T00:00:00Z`);
}

/** true si es una fecha real con formato YYYY-MM-DD (rechaza 2026-02-30). */
export function esFechaValida(fecha: string): boolean {
  if (!RE_FECHA.test(fecha)) return false;
  const ms = aMs(fecha);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === fecha;
}

export function sumarDias(fecha: string, dias: number): string {
  return new Date(aMs(fecha) + dias * MS_DIA).toISOString().slice(0, 10);
}

/** Días de `desde` a `hasta` (negativo si hasta es anterior). */
export function diferenciaDias(desde: string, hasta: string): number {
  return Math.round((aMs(hasta) - aMs(desde)) / MS_DIA);
}

/** Todas las fechas del período, ambos extremos incluidos. Vacío si es inválido. */
export function diasDelPeriodo(desde: string, hasta: string): string[] {
  if (!esFechaValida(desde) || !esFechaValida(hasta)) return [];
  const n = diferenciaDias(desde, hasta);
  if (n < 0) return [];
  return Array.from({ length: n + 1 }, (_, i) => sumarDias(desde, i));
}

// ─── Horas ────────────────────────────────────────────────────────────

/** "08:30" o "08:30:00" → 510. null si no es una hora válida. */
export function minutosDeHora(hora: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hora);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Minutos (incluso > 1440) → "HH:MM" del reloj. 1470 → "00:30". */
export function formatearMinutos(minutos: number): string {
  const total = ((Math.round(minutos) % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 680 → "11 h 20 min". */
export function formatearDuracion(minutos: number): string {
  const total = Math.max(0, Math.round(minutos));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

// ─── Día alimentario ──────────────────────────────────────────────────

export type ComidaUbicada<T> = {
  comida: T;
  /** Día alimentario al que pertenece (puede ser el anterior a comida.fecha). */
  dia: string;
  /** Minutos desde las 00:00 del día alimentario (1440+ si fue de madrugada). */
  minutos: number;
  /** true si se comió pasada la medianoche y cuenta para el día anterior. */
  madrugada: boolean;
};

type ConFechaHora = { fecha: string; hora: string };

export function diaAlimentario(
  fecha: string,
  hora: string,
): { dia: string; minutos: number; madrugada: boolean } | null {
  const minutos = minutosDeHora(hora);
  if (minutos === null || !esFechaValida(fecha)) return null;
  if (minutos < MINUTOS_CORTE) {
    return { dia: sumarDias(fecha, -1), minutos: minutos + MINUTOS_DIA, madrugada: true };
  }
  return { dia: fecha, minutos, madrugada: false };
}

/**
 * Agrupa las comidas por día alimentario, un elemento por cada día del período
 * (también los vacíos), cada uno ordenado por horario. Descarta las que caen
 * fuera del período. Ojo: para no perder las de madrugada del último día, pedile
 * a la base las comidas con fecha hasta `hasta + 1`.
 */
export function ubicarComidas<T extends ConFechaHora>(
  comidas: readonly T[],
  desde: string,
  hasta: string,
): { fecha: string; comidas: ComidaUbicada<T>[] }[] {
  const dias = diasDelPeriodo(desde, hasta);
  const porDia = new Map<string, ComidaUbicada<T>[]>(dias.map((d) => [d, []]));

  for (const comida of comidas) {
    const lugar = diaAlimentario(comida.fecha, comida.hora);
    if (!lugar) continue;
    porDia.get(lugar.dia)?.push({ comida, ...lugar });
  }

  return dias.map((fecha) => ({
    fecha,
    comidas: porDia.get(fecha)!.sort((a, b) => a.minutos - b.minutos),
  }));
}

// ─── Resumen ──────────────────────────────────────────────────────────

/** Minutos: del día alimentario para horarios, de duración para el ayuno. */
export type Estadistica = {
  cantidad: number;
  promedio: number;
  minimo: number;
  maximo: number;
};

export type ResumenTipo = {
  tipo: TipoComida;
  registros: number;
  /** En cuántos días del período aparece. */
  dias: number;
  horario: Estadistica | null;
};

export type Resumen = {
  desde: string;
  hasta: string;
  diasPeriodo: number;
  diasConRegistro: number;
  /** Días sin ningún registro (sin contar el día en curso). */
  diasSinRegistro: string[];
  /** `hoy`, si cae dentro del período: todavía no terminó. */
  diaEnCurso: string | null;

  totalRegistros: number;
  conFoto: number;
  /** 0 a 100, redondeado. null si no hay registros. */
  porcentajeConFoto: number | null;
  /** Registros por día con registro. */
  promedioPorDia: number | null;

  /** Uno por tipo, en el orden de TIPOS_COMIDA. */
  porTipo: ResumenTipo[];

  /**
   * Comidas principales que faltan en días que tienen algún registro.
   * Los días sin ningún registro no cuentan (no sabemos si comió o no cargó),
   * y el día en curso tampoco (puede que todavía no haya llegado la hora).
   */
  salteadas: {
    diasEvaluados: number;
    porTipo: Record<ComidaPrincipal, number>;
    porDia: { fecha: string; faltan: ComidaPrincipal[] }[];
  };

  /** Última comida de un día → primera del siguiente, si ambos tienen registros. */
  ayunoNocturno: Estadistica | null;
  /** Cenas estrictamente después de las 22:00 (una a las 00:30 cuenta). */
  cenasTarde: { cantidad: number; totalCenas: number };
  /** Primera comida de cada día con registros. */
  primeraComida: Estadistica | null;
  /** Última comida de cada día con registros, sin el día en curso. */
  ultimaComida: Estadistica | null;
};

export type OpcionesResumen = {
  /** Fecha de hoy (YYYY-MM-DD) para tratar ese día como incompleto. */
  hoy?: string;
};

type ComidaResumible = Pick<Comida, "fecha" | "hora" | "tipo" | "foto_path">;

function estadistica(valores: number[]): Estadistica | null {
  if (valores.length === 0) return null;
  let suma = 0;
  let minimo = Infinity;
  let maximo = -Infinity;
  for (const v of valores) {
    suma += v;
    if (v < minimo) minimo = v;
    if (v > maximo) maximo = v;
  }
  return { cantidad: valores.length, promedio: suma / valores.length, minimo, maximo };
}

export function calcularResumen(
  comidas: readonly ComidaResumible[],
  desde: string,
  hasta: string,
  opciones: OpcionesResumen = {},
): Resumen {
  const dias = ubicarComidas(comidas, desde, hasta);
  const enPeriodo = new Set(dias.map((d) => d.fecha));
  const diaEnCurso = opciones.hoy && enPeriodo.has(opciones.hoy) ? opciones.hoy : null;

  const todas = dias.flatMap((d) => d.comidas);
  const conRegistro = dias.filter((d) => d.comidas.length > 0);
  const terminados = conRegistro.filter((d) => d.fecha !== diaEnCurso);

  const totalRegistros = todas.length;
  const conFoto = todas.filter((u) => u.comida.foto_path).length;

  const porTipo: ResumenTipo[] = TIPOS_COMIDA.map(({ valor }) => {
    const deTipo = todas.filter((u) => u.comida.tipo === valor);
    return {
      tipo: valor,
      registros: deTipo.length,
      dias: new Set(deTipo.map((u) => u.dia)).size,
      horario: estadistica(deTipo.map((u) => u.minutos)),
    };
  });

  const salteadasPorTipo: Record<ComidaPrincipal, number> = {
    desayuno: 0,
    almuerzo: 0,
    merienda: 0,
    cena: 0,
  };
  const salteadasPorDia: { fecha: string; faltan: ComidaPrincipal[] }[] = [];
  for (const dia of terminados) {
    const tipos = new Set(dia.comidas.map((u) => u.comida.tipo));
    const faltan = COMIDAS_PRINCIPALES.filter((t) => !tipos.has(t));
    for (const t of faltan) salteadasPorTipo[t]++;
    if (faltan.length > 0) salteadasPorDia.push({ fecha: dia.fecha, faltan });
  }

  // Horarios de comida: sin bebidas sueltas (un vaso de agua no corta el ayuno).
  const comidasDe = (dia: (typeof dias)[number]) =>
    dia.comidas.filter((u) => !esBebida(u.comida.tipo));

  const ayunos: number[] = [];
  for (let i = 0; i + 1 < dias.length; i++) {
    const hoy = comidasDe(dias[i]);
    const manana = comidasDe(dias[i + 1]);
    if (hoy.length === 0 || manana.length === 0) continue;
    ayunos.push(MINUTOS_DIA + manana[0].minutos - hoy[hoy.length - 1].minutos);
  }

  const cenas = todas.filter((u) => u.comida.tipo === "cena");

  return {
    desde,
    hasta,
    diasPeriodo: dias.length,
    diasConRegistro: conRegistro.length,
    diasSinRegistro: dias
      .filter((d) => d.comidas.length === 0 && d.fecha !== diaEnCurso)
      .map((d) => d.fecha),
    diaEnCurso,

    totalRegistros,
    conFoto,
    porcentajeConFoto: totalRegistros > 0 ? Math.round((conFoto * 100) / totalRegistros) : null,
    promedioPorDia: conRegistro.length > 0 ? totalRegistros / conRegistro.length : null,

    porTipo,
    salteadas: {
      diasEvaluados: terminados.length,
      porTipo: salteadasPorTipo,
      porDia: salteadasPorDia,
    },
    ayunoNocturno: estadistica(ayunos),
    cenasTarde: {
      cantidad: cenas.filter((u) => u.minutos > MINUTOS_CENA_TARDE).length,
      totalCenas: cenas.length,
    },
    primeraComida: estadistica(
      conRegistro.map(comidasDe).filter((c) => c.length > 0).map((c) => c[0].minutos),
    ),
    ultimaComida: estadistica(
      terminados.map(comidasDe).filter((c) => c.length > 0).map((c) => c[c.length - 1].minutos),
    ),
  };
}

// ─── Constancia ───────────────────────────────────────────────────────

export type RegistrosDia = {
  fecha: string;
  /** Todo lo cargado ese día alimentario (comidas + bebidas). */
  total: number;
  comidas: number;
  bebidas: number;
};

/** Cuántos registros tiene cada día alimentario del período (también los vacíos). */
export function registrosPorDia(
  comidas: readonly (ConFechaHora & { tipo: TipoComida })[],
  desde: string,
  hasta: string,
): RegistrosDia[] {
  return ubicarComidas(comidas, desde, hasta).map(({ fecha, comidas: delDia }) => {
    const bebidas = delDia.filter((u) => esBebida(u.comida.tipo)).length;
    return { fecha, total: delDia.length, comidas: delDia.length - bebidas, bebidas };
  });
}

export type Racha = {
  /** Días alimentarios seguidos con al menos un registro (comida o bebida). */
  dias: number;
  /** true si hoy ya tiene registros; si no, la racha se cuenta hasta ayer. */
  incluyeHoy: boolean;
};

/**
 * Racha actual de días seguidos con algo cargado, terminando hoy.
 * Hoy todavía no terminó: si está vacío no corta la racha, se cuenta hasta ayer.
 * Solo ve las comidas que recibe: si la racha llega al principio de lo que se
 * pidió a la base, podría ser más larga.
 */
export function rachaActual(comidas: readonly ConFechaHora[], hoy: string): Racha {
  if (!esFechaValida(hoy)) return { dias: 0, incluyeHoy: false };
  const conRegistro = new Set<string>();
  for (const c of comidas) {
    const lugar = diaAlimentario(c.fecha, c.hora);
    if (lugar) conRegistro.add(lugar.dia);
  }

  const incluyeHoy = conRegistro.has(hoy);
  let dia = incluyeHoy ? hoy : sumarDias(hoy, -1);
  let dias = 0;
  while (conRegistro.has(dia)) {
    dias++;
    dia = sumarDias(dia, -1);
  }
  return { dias, incluyeHoy };
}
