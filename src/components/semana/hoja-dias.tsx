import { etiquetaTipo } from "@/lib/comidas";
import { COMIDAS_PRINCIPALES } from "@/lib/resumen";
import { conteoDeDia, fechaConAnio, madrugadaDel } from "./formato";
import type { DiaGrilla } from "./grilla-semana";
import { Miniatura } from "./miniatura";

// Hasta cuántos registros se intenta que un día entero quede en la misma hoja. Con más,
// se corta entre registros (nunca adentro de uno) para no dejar media hoja en blanco.
const REGISTROS_DIA_ENTERO = 4;

/**
 * Solo impresión: lista cronológica por día alimentario, pensada para A4 vertical en
 * blanco y negro. Líneas finas oscuras, sin fondos (los navegadores no los imprimen) y
 * descripciones completas.
 */
export function HojaDias({ dias, diaEnCurso }: { dias: DiaGrilla[]; diaEnCurso: string | null }) {
  return (
    <ol id="hoja-dias" className="hidden print:block">
      {dias.map((dia) => {
        const enCurso = dia.fecha === diaEnCurso;
        const tipos = new Set(dia.comidas.map((c) => c.tipo));
        const faltan =
          dia.comidas.length > 0 && !enCurso ? COMIDAS_PRINCIPALES.filter((t) => !tipos.has(t)) : [];
        return (
          <li
            key={dia.fecha}
            className={`mt-4 first:mt-0 ${dia.comidas.length <= REGISTROS_DIA_ENTERO ? "break-inside-avoid" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-tinta pb-1 break-after-avoid">
              <h3 className="font-semibold first-letter:uppercase">
                {fechaConAnio(dia.fecha)}
                {enCurso ? <span className="font-normal"> (en curso al imprimir)</span> : null}
              </h3>
              <span className="shrink-0 text-sm tabular-nums">{conteoDeDia(dia.comidas)}</span>
            </div>

            {/* Vacío: el "Sin registros" del encabezado alcanza. */}
            {dia.comidas.length === 0 ? null : (
              <ul>
                {dia.comidas.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-3 border-b border-tinta-suave py-1.5 text-sm break-inside-avoid last:border-b-0"
                  >
                    <span className="w-28 shrink-0 font-medium tabular-nums">
                      {c.hora}
                      {c.madrugada ? (
                        <span className="block text-xs font-normal">({madrugadaDel(c.fecha)})</span>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{etiquetaTipo(c.tipo)}</span>
                      <span className="block whitespace-pre-wrap text-pretty">
                        {c.descripcion.trim() || <span className="text-tinta-suave">Sin descripción.</span>}
                      </span>
                    </span>
                    <Miniatura
                      url={c.fotoUrl}
                      error={c.fotoError}
                      eager
                      className="size-20 rounded"
                    />
                  </li>
                ))}
              </ul>
            )}

            {faltan.length > 0 ? (
              <p className="border-t border-tinta-suave pt-1 text-xs text-tinta-suave">
                Comidas principales sin registro:{" "}
                {faltan.map((t) => etiquetaTipo(t).toLowerCase()).join(", ")}.
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
