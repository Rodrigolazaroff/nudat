import Link from "next/link";
import type { RegistrosDia } from "@/lib/resumen";
import { fechaLarga } from "@/components/semana/formato";
import { IconoLuna } from "@/components/comidas/iconos";

// Niveles por cantidad de registros del día. Además del color, cada celda muestra el
// número (la vacía, un guion y borde punteado) y el nivel 1 lleva borde propio, así
// no depende solo del color ni se confunde con el vacío.
const NIVELES = [
  { etiqueta: "Nada", clases: "border border-dashed border-tinta-suave/60 bg-hundido/50 text-tinta-suave" },
  { etiqueta: "1 o 2", clases: "border border-primario/50 bg-primario-suave text-primario" },
  { etiqueta: "3 o 4", clases: "bg-primario/35 text-tinta shadow-suave" },
  { etiqueta: "5 o más", clases: "bg-primario text-sobre-primario shadow-boton" },
] as const;

function nivel(total: number): number {
  if (total === 0) return 0;
  if (total <= 2) return 1;
  if (total <= 4) return 2;
  return 3;
}

// "Mi" para el miércoles, así no quedan dos "M" seguidas.
const SEMANA_DESDE_LUNES = ["L", "M", "Mi", "J", "V", "S", "D"];

/** 0 = lunes … 6 = domingo. */
function diaSemana(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
}

function detalle({ total, comidas, bebidas }: RegistrosDia): string {
  if (total === 0) return "sin registros";
  const partes = [];
  if (comidas > 0) partes.push(comidas === 1 ? "1 comida" : `${comidas} comidas`);
  if (bebidas > 0) partes.push(bebidas === 1 ? "1 bebida" : `${bebidas} bebidas`);
  return partes.join(" y ");
}

function detalleMadrugada(n: number): string {
  if (n === 0) return "";
  return n === 1
    ? ", incluye 1 de madrugada, que en Hoy aparece en el día siguiente"
    : `, incluye ${n} de madrugada, que en Hoy aparecen en el día siguiente`;
}

export function TiraConstancia({
  dias,
  hoy,
  madrugada = {},
}: {
  dias: RegistrosDia[];
  /** Día alimentario en curso (YYYY-MM-DD). */
  hoy: string;
  /** Registros de madrugada por día alimentario (fecha calendario = día + 1, antes de las 05:00). */
  madrugada?: Record<string, number>;
}) {
  if (dias.length === 0) return null;

  // Una semana: una fila con la inicial de cada día. Más: calendario de lunes a domingo.
  const calendario = dias.length > 7;
  const encabezado = calendario
    ? SEMANA_DESDE_LUNES
    : dias.map((d) => SEMANA_DESDE_LUNES[diaSemana(d.fecha)]);
  const columnaInicial = calendario ? diaSemana(dias[0].fecha) + 1 : 1;
  const hayMadrugada = dias.some((d) => (madrugada[d.fecha] ?? 0) > 0);
  const hoyEnPeriodo = dias.some((d) => d.fecha === hoy);

  return (
    <div className="flex flex-col gap-3">
      <div
        aria-hidden="true"
        className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-tinta-suave"
      >
        {encabezado.map((letra, i) => (
          <span key={i}>{letra}</span>
        ))}
      </div>

      <ol className="grid grid-cols-7 gap-1">
        {dias.map((d, i) => {
          const esHoy = d.fecha === hoy;
          const deMadrugada = madrugada[d.fecha] ?? 0;
          const { clases } = NIVELES[nivel(d.total)];
          const etiqueta = `${fechaLarga(d.fecha)}${esHoy ? " (hoy)" : ""}: ${detalle(d)}${detalleMadrugada(deMadrugada)}. Ver el día.`;
          return (
            <li key={d.fecha} style={i === 0 ? { gridColumnStart: columnaInicial } : undefined}>
              <Link
                href={`/?fecha=${d.fecha}`}
                aria-label={etiqueta}
                className={`relative flex h-15 flex-col items-center justify-center rounded-2xl leading-tight transition-[scale] duration-150 ease-premium select-none active:scale-[0.94] motion-reduce:transition-none motion-reduce:active:scale-100 ${clases} focus-visible:outline-2 focus-visible:outline-primario ${
                  esHoy
                    ? "ring-2 ring-tinta ring-offset-2 ring-offset-fondo focus-visible:outline-offset-5"
                    : "focus-visible:outline-offset-2"
                }`}
              >
                <span className="text-xs font-medium tabular-nums">{Number(d.fecha.slice(8))}</span>
                <span className="font-display text-lg leading-tight font-bold tabular-nums">
                  {d.total === 0 ? "–" : d.total}
                </span>
                {deMadrugada > 0 ? (
                  <IconoLuna className="absolute top-1.5 right-1.5 size-3" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-2 text-xs font-medium text-tinta-suave">
        <ul aria-label="Leyenda" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {NIVELES.map((n) => (
            <li key={n.etiqueta} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`size-4 rounded-md ${n.clases}`} />
              {n.etiqueta}
            </li>
          ))}
          {hoyEnPeriodo ? (
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-4 rounded-md ring-2 ring-tinta ring-offset-1 ring-offset-fondo"
              />
              Hoy
            </li>
          ) : null}
          {hayMadrugada ? (
            <li className="flex items-center gap-1.5">
              <IconoLuna className="size-4 text-tinta" />
              Madrugada
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
