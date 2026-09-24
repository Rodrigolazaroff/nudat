import Link from "next/link";
import { fechaCorta } from "./formato";
import { IndicadorLink } from "./indicador-link";
import { ui } from "./ui";

export function SelectorSemana({
  desde,
  hasta,
  hrefAnterior,
  hrefSiguiente,
  hrefUltimos,
}: {
  desde: string;
  hasta: string;
  hrefAnterior: string;
  /** null si ya se está viendo hasta hoy. */
  hrefSiguiente: string | null;
  /** Link a "últimos 7 días", o null si ya se está ahí. */
  hrefUltimos: string | null;
}) {
  return (
    <nav
      aria-label="Cambiar semana"
      className="flex items-center justify-between gap-2 rounded-2xl border border-borde bg-superficie p-2 print:hidden"
    >
      <Link href={hrefAnterior} scroll={false} className={ui.botonChico}>
        <IndicadorLink />
        <span aria-hidden="true">‹</span>
        <span className="sr-only sm:not-sr-only">Semana anterior</span>
      </Link>

      <div className="flex min-w-0 flex-col items-center text-center">
        <span className="text-sm font-medium tabular-nums capitalize">
          {fechaCorta(desde)} – {fechaCorta(hasta)}
        </span>
        {hrefUltimos ? (
          <Link
            href={hrefUltimos}
            scroll={false}
            className={`rounded text-xs font-medium text-primario underline-offset-4 hover:underline ${ui.foco}`}
          >
            Ir a los últimos 7 días
          </Link>
        ) : (
          <span className="text-xs text-tinta-suave">Últimos 7 días</span>
        )}
      </div>

      {hrefSiguiente ? (
        <Link href={hrefSiguiente} scroll={false} className={ui.botonChico}>
          <span className="sr-only sm:not-sr-only">Semana siguiente</span>
          <span aria-hidden="true">›</span>
          <IndicadorLink />
        </Link>
      ) : (
        <span aria-disabled="true" className={`${ui.botonChico} cursor-not-allowed opacity-40`}>
          <span className="sr-only sm:not-sr-only">Semana siguiente</span>
          <span aria-hidden="true">›</span>
          <span aria-hidden="true" className="size-3" />
        </span>
      )}
    </nav>
  );
}
