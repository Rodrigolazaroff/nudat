import Link from "next/link";
import { IconoDerecha, IconoIzquierda } from "@/components/comidas/iconos";
import { IndicadorCirculo } from "./indicador-link";

/** Flechas para cambiar de semana (círculos de 44px, como los días en Hoy). */
export function SelectorSemana({
  hrefAnterior,
  hrefSiguiente,
}: {
  hrefAnterior: string;
  /** null si ya se está viendo hasta hoy. */
  hrefSiguiente: string | null;
}) {
  return (
    <nav aria-label="Cambiar semana" className="flex shrink-0 gap-2 pt-1 print:hidden">
      <Link
        href={hrefAnterior}
        scroll={false}
        aria-label="Semana anterior"
        className="boton-circulo foco relative"
      >
        <IconoIzquierda className="size-5" />
        <IndicadorCirculo />
      </Link>
      {hrefSiguiente ? (
        <Link
          href={hrefSiguiente}
          scroll={false}
          aria-label="Semana siguiente"
          className="boton-circulo foco relative"
        >
          <IconoDerecha className="size-5" />
          <IndicadorCirculo />
        </Link>
      ) : (
        <span aria-hidden="true" className="boton-circulo text-tinta-suave opacity-40 shadow-none">
          <IconoDerecha className="size-5" />
        </span>
      )}
    </nav>
  );
}
