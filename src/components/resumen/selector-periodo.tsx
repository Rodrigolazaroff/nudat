import Link from "next/link";
import { IndicadorLink } from "@/components/semana/indicador-link";

export const PERIODOS = [7, 30] as const;
export type Periodo = (typeof PERIODOS)[number];

/** `?dias=` de la URL: 7 (por defecto) o 30. */
export function periodoDeParam(valor: string | string[] | undefined): Periodo {
  const v = Array.isArray(valor) ? valor[0] : valor;
  return v === "30" ? 30 : 7;
}

const hrefPeriodo = (p: Periodo) => (p === 7 ? "/resumen" : `/resumen?dias=${p}`);

// Dos chips hechos con links: cada período es una URL (se puede compartir, funciona
// sin JS y el botón Atrás vuelve al anterior).
export function SelectorPeriodo({ actual }: { actual: Periodo }) {
  return (
    <nav aria-label="Período del resumen">
      <ul className="grid grid-cols-2 gap-2">
        {PERIODOS.map((p) => {
          const activo = p === actual;
          return (
            <li key={p}>
              <Link
                href={hrefPeriodo(p)}
                scroll={false}
                aria-current={activo ? "page" : undefined}
                // En una línea a 360px: sin separador a la izquierda, la ruedita va en el
                // borde (absoluta) y no le quita ancho al texto.
                className={`chip foco relative w-full justify-center px-5 text-sm tracking-tight whitespace-nowrap ${
                  activo ? "chip-activo" : "hover:shadow-[0_0_0_1px_rgb(47_107_79_/_0.3)]"
                }`}
              >
                Últimos {p} días
                <IndicadorLink className="absolute top-1/2 right-2 -mt-1.5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
