import Link from "next/link";
import type { RegistrosDia } from "@/lib/resumen";
import { fechaLarga } from "@/components/semana/formato";
import { ui } from "@/components/semana/ui";

// Niveles por cantidad de registros del día. Además del color, cada celda muestra el
// número (y la vacía va con borde punteado), así no depende solo del color.
const NIVELES = [
  { etiqueta: "Nada", clases: "border border-dashed border-borde bg-superficie text-tinta-suave" },
  { etiqueta: "1 o 2", clases: "bg-primario-suave text-primario" },
  { etiqueta: "3 o 4", clases: "bg-primario/35 text-tinta" },
  { etiqueta: "5 o más", clases: "bg-primario text-sobre-primario" },
] as const;

function nivel(total: number): number {
  if (total === 0) return 0;
  if (total <= 2) return 1;
  if (total <= 4) return 2;
  return 3;
}

const SEMANA_DESDE_LUNES = ["L", "M", "M", "J", "V", "S", "D"];

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

export function TiraConstancia({ dias, hoy }: { dias: RegistrosDia[]; hoy: string }) {
  if (dias.length === 0) return null;

  // Una semana: una fila con la inicial de cada día. Más: calendario de lunes a domingo.
  const calendario = dias.length > 7;
  const encabezado = calendario
    ? SEMANA_DESDE_LUNES
    : dias.map((d) => SEMANA_DESDE_LUNES[diaSemana(d.fecha)]);
  const columnaInicial = calendario ? diaSemana(dias[0].fecha) + 1 : 1;

  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden="true" className="grid grid-cols-7 gap-1 text-center text-xs text-tinta-suave">
        {encabezado.map((letra, i) => (
          <span key={i}>{letra}</span>
        ))}
      </div>

      <ol className="grid grid-cols-7 gap-1">
        {dias.map((d, i) => {
          const esHoy = d.fecha === hoy;
          const { clases } = NIVELES[nivel(d.total)];
          const etiqueta = `${fechaLarga(d.fecha)}${esHoy ? " (hoy)" : ""}: ${detalle(d)}. Ver el día.`;
          return (
            <li key={d.fecha} style={i === 0 ? { gridColumnStart: columnaInicial } : undefined}>
              <Link
                href={`/?fecha=${d.fecha}`}
                aria-label={etiqueta}
                className={`flex h-14 flex-col items-center justify-center rounded-xl leading-tight ${clases} ${ui.foco} ${
                  esHoy ? "ring-2 ring-acento ring-offset-1 ring-offset-fondo" : ""
                }`}
              >
                <span className="text-[0.7rem] tabular-nums">
                  {Number(d.fecha.slice(8))}
                </span>
                <span className="text-base font-semibold tabular-nums">
                  {d.total === 0 ? "–" : d.total}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-1.5 text-xs text-tinta-suave">
        <p id="leyenda-constancia">Registros por día:</p>
        <ul aria-labelledby="leyenda-constancia" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {NIVELES.map((n) => (
            <li key={n.etiqueta} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`size-4 rounded ${n.clases}`} />
              {n.etiqueta}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-4 rounded ring-2 ring-acento ring-offset-1 ring-offset-fondo"
            />
            Hoy
          </li>
        </ul>
      </div>
    </div>
  );
}
