import { etiquetaTipo, esBebida } from "@/lib/comidas";
import type { ResumenTipo } from "@/lib/resumen";

// Barras horizontales en CSS: largo relativo al tipo más cargado, número al lado.
export function RepartoTipos({ porTipo }: { porTipo: ResumenTipo[] }) {
  const maximo = Math.max(1, ...porTipo.map((t) => t.registros));

  return (
    <ul className="flex flex-col gap-3 py-1">
      {porTipo.map((t) => {
        const ancho = t.registros === 0 ? 0 : Math.max(4, (t.registros * 100) / maximo);
        return (
          <li key={t.tipo} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-[0.9375rem]">
            <span className={`font-medium ${t.registros === 0 ? "text-tinta-suave" : "text-tinta"}`}>
              {etiquetaTipo(t.tipo)}
            </span>
            <span
              aria-hidden="true"
              className="h-3 overflow-hidden rounded-full bg-hundido shadow-[inset_0_1px_2px_rgb(20_32_26_/_0.08)]"
            >
              <span
                className={`block h-full rounded-full ${esBebida(t.tipo) ? "bg-acento" : "bg-primario"}`}
                style={{ width: `${ancho}%` }}
              />
            </span>
            <span
              className={`text-right font-display text-lg leading-none font-bold tracking-tight tabular-nums ${t.registros === 0 ? "text-tinta-suave" : ""}`}
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
