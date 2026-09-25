import Link from "next/link";
import { IndicadorLink } from "@/components/semana/indicador-link";
import { ui } from "@/components/semana/ui";

export const PERIODOS = [7, 30] as const;
export type Periodo = (typeof PERIODOS)[number];

/** `?dias=` de la URL: 7 (por defecto) o 30. */
export function periodoDeParam(valor: string | string[] | undefined): Periodo {
  const v = Array.isArray(valor) ? valor[0] : valor;
  return v === "30" ? 30 : 7;
}

const hrefPeriodo = (p: Periodo) => (p === 7 ? "/resumen" : `/resumen?dias=${p}`);

// Control segmentado hecho con links: cada período es una URL (se puede compartir,
// funciona sin JS y el botón Atrás vuelve al anterior).
export function SelectorPeriodo({ actual }: { actual: Periodo }) {
  return (
    <nav aria-label="Período del resumen">
      <ul className="grid grid-cols-2 gap-1 rounded-2xl border border-borde bg-superficie p-1">
        {PERIODOS.map((p) => {
          const activo = p === actual;
          return (
            <li key={p}>
              <Link
                href={hrefPeriodo(p)}
                scroll={false}
                aria-current={activo ? "page" : undefined}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${ui.foco} ${
                  activo
                    ? "bg-primario text-sobre-primario"
                    : "text-tinta-suave hover:bg-fondo hover:text-tinta"
                }`}
              >
                <span aria-hidden="true" className="size-3" />
                Últimos {p} días
                <IndicadorLink />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
