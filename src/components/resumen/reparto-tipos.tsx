import { etiquetaTipo, esBebida } from "@/lib/comidas";
import type { ResumenTipo } from "@/lib/resumen";

// Barras horizontales en CSS: largo relativo al tipo más cargado, número al lado.
export function RepartoTipos({ porTipo }: { porTipo: ResumenTipo[] }) {
  const maximo = Math.max(1, ...porTipo.map((t) => t.registros));

  return (
    <ul className="flex flex-col gap-2.5">
      {porTipo.map((t) => {
        const ancho = t.registros === 0 ? 0 : Math.max(4, (t.registros * 100) / maximo);
        return (
          <li key={t.tipo} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm">
            <span className={t.registros === 0 ? "text-tinta-suave" : undefined}>
              {etiquetaTipo(t.tipo)}
            </span>
            <span aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-fondo">
              <span
                className={`block h-full rounded-full ${esBebida(t.tipo) ? "bg-acento" : "bg-primario"}`}
                style={{ width: `${ancho}%` }}
              />
            </span>
            <span
              className={`text-right font-semibold tabular-nums ${t.registros === 0 ? "text-tinta-suave" : ""}`}
            >
              {t.registros}
              <span className="sr-only">{t.registros === 1 ? " registro" : " registros"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
