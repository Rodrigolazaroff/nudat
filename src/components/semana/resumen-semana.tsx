import type { CSSProperties, ReactNode } from "react";
import { etiquetaTipo } from "@/lib/comidas";
import {
  COMIDAS_PRINCIPALES,
  formatearDuracion,
  formatearMinutos,
  type Estadistica,
  type Resumen,
} from "@/lib/resumen";
import { formatearDecimal, plural } from "./formato";
import { papel } from "./papel";
import { Voz } from "./voz";

const escalon = (i: number) => ({ "--i": i }) as CSSProperties;

// Bloque con bisel (en pantalla) que en papel queda como recuadro fino en tinta.
function Bloque({
  children,
  className = "",
  nucleo = "",
  i,
}: {
  children: ReactNode;
  className?: string;
  nucleo?: string;
  i: number;
}) {
  return (
    <div className={`bisel entrar ${papel.bisel} ${className}`} style={escalon(i)}>
      <div className={`bisel-nucleo h-full ${papel.nucleo} ${nucleo}`}>{children}</div>
    </div>
  );
}

const tituloBloque = "font-display text-lg font-bold tracking-tight";
// Separadores internos: hairline en pantalla, tinta suave en papel.
const linea = "border-borde print:border-tinta-suave";

function hora(e: Estadistica | null): string {
  return e ? formatearMinutos(e.promedio) : "Sin dato";
}

export function ResumenSemana({ resumen: r }: { resumen: Resumen }) {
  const ayuno = r.ayunoNocturno;

  return (
    <section aria-labelledby="titulo-resumen" className="flex flex-col gap-3 print:break-inside-avoid">
      <h2
        id="titulo-resumen"
        className="entrar font-display text-xl font-bold tracking-tight"
        style={escalon(2)}
      >
        Resumen
      </h2>

      {/* Datos generales: un solo bloque partido en celdas (2×2 en el celu, 4 en fila en
          compu y en papel), en vez de cuatro tarjetas iguales. */}
      <Bloque i={2}>
        <dl className="grid grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          <Dato
            className={`border-r border-b lg:border-b-0 print:border-b-0 ${linea}`}
            titulo="Registros"
            valor={r.totalRegistros}
            detalle={
              <>
                <span className="block">
                  {plural(r.totalComidas, "comida", "comidas")} ·{" "}
                  {plural(r.totalBebidas, "bebida", "bebidas")}
                </span>
                {r.porcentajeConFoto !== null ? (
                  <span className="block">{r.porcentajeConFoto} % con foto</span>
                ) : null}
              </>
            }
          />
          <Dato
            className={`border-b lg:border-r lg:border-b-0 print:border-r print:border-b-0 ${linea}`}
            titulo="Días con registros"
            valor={`${r.diasConRegistro} de ${r.diasPeriodo}`}
            detalle={
              r.promedioComidasPorDia !== null
                ? `${formatearDecimal(r.promedioComidasPorDia)} comidas por día`
                : null
            }
          />
          <Dato
            className={`border-r ${linea}`}
            titulo="Ayuno nocturno"
            valor={ayuno ? formatearDuracion(ayuno.promedio) : "Sin dato"}
            detalle={
              ayuno
                ? ayuno.cantidad === 1
                  ? "1 noche"
                  : `${ayuno.cantidad} noches · de ${formatearDuracion(ayuno.minimo)} a ${formatearDuracion(ayuno.maximo)}`
                : null
            }
          />
          <div className="p-4 print:px-3 print:py-2.5">
            <dt className="text-sm font-medium text-tinta-suave">Horario promedio</dt>
            <dd className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-sm">Primera</span>
              <span className="font-display text-xl font-bold tracking-tight tabular-nums">
                {hora(r.primeraComida)}
              </span>
            </dd>
            <dd className="flex items-baseline justify-between gap-2">
              <span className="text-sm">Última</span>
              <span className="font-display text-xl font-bold tracking-tight tabular-nums">
                {hora(r.ultimaComida)}
              </span>
            </dd>
          </div>
        </dl>
      </Bloque>

      <div className="grid gap-3 lg:grid-cols-3 print:grid-cols-3">
        <Bloque i={3} className="lg:col-span-2 print:col-span-2" nucleo="p-5 print:px-3 print:py-2.5">
          <h3 className={tituloBloque}>Por tipo de comida</h3>
          <table className="mt-3 w-full text-sm print:mt-1.5">
            <thead>
              <tr className={`border-b text-xs text-tinta-suave ${linea}`}>
                <th scope="col" className="py-1.5 pr-2 text-left font-medium">
                  Comida
                </th>
                <th scope="col" className="px-2 py-1.5 text-right font-medium">
                  Días
                </th>
                <th scope="col" className="py-1.5 pl-2 text-right font-medium">
                  Horario promedio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde print:divide-tinta-suave">
              {r.porTipo.map((t) => (
                <tr key={t.tipo}>
                  <th scope="row" className="py-2 pr-2 text-left font-semibold print:py-1.5">
                    {etiquetaTipo(t.tipo)}
                  </th>
                  <td className="px-2 py-2 text-right tabular-nums print:py-1.5">
                    <span className="font-semibold">{t.dias}</span>{" "}
                    <span className="text-tinta-suave">de {r.diasPeriodo}</span>
                    {t.registros > t.dias ? (
                      <span className="block text-xs text-tinta-suave">{t.registros} registros</span>
                    ) : null}
                  </td>
                  <td className="py-2 pl-2 text-right tabular-nums print:py-1.5">
                    {t.tipo === "bebida" ? (
                      // Un promedio de horarios de bebidas no dice nada: se toman a cualquier hora.
                      <span className="text-tinta-suave">
                        {t.registros > 0 ? "Varios horarios" : "Sin dato"}
                      </span>
                    ) : t.horario ? (
                      <>
                        <span className="font-semibold">{formatearMinutos(t.horario.promedio)}</span>
                        {t.horario.cantidad > 1 ? (
                          <span className="block text-xs text-tinta-suave">
                            {formatearMinutos(t.horario.minimo)} a {formatearMinutos(t.horario.maximo)}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-tinta-suave">Sin dato</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Bloque>

        {/* Dos datos cortos en un mismo bloque, separados por una línea. */}
        <Bloque i={4} nucleo="flex flex-col">
          <div className="p-5 print:px-3 print:py-2.5">
            <h3 className={tituloBloque}>Comidas principales sin registro</h3>
            {r.salteadas.diasEvaluados === 0 ? (
              <p className="mt-2 text-sm text-tinta-suave">Todavía no hay días completos para evaluar.</p>
            ) : (
              <ul className="mt-2.5 flex flex-col gap-1.5 text-sm print:mt-1.5 print:gap-1">
                {COMIDAS_PRINCIPALES.map((t) => {
                  const n = r.salteadas.porTipo[t];
                  return (
                    <li key={t} className="flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-2">
                        {n > 0 ? (
                          <span aria-hidden="true" className="size-2 rounded-full bg-acento print:hidden" />
                        ) : null}
                        {etiquetaTipo(t)}
                      </span>
                      <span className={`tabular-nums ${n > 0 ? "font-semibold" : "text-tinta-suave"}`}>
                        {plural(n, "día", "días")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={`mt-auto border-t p-5 print:px-3 print:py-2.5 ${linea}`}>
            <h3 className={tituloBloque}>Cenas después de las 22:00</h3>
            {r.cenasTarde.totalCenas === 0 ? (
              <p className="mt-2 text-sm text-tinta-suave">
                <Voz pantalla="No cargaste cenas." impresion="No registró cenas." />
              </p>
            ) : (
              <p className="mt-1.5 font-display text-xl font-bold tracking-tight tabular-nums">
                {r.cenasTarde.cantidad}{" "}
                <span className="font-sans text-base font-normal tracking-normal text-tinta-suave">
                  de {plural(r.cenasTarde.totalCenas, "cena", "cenas")}
                </span>
              </p>
            )}
          </div>
        </Bloque>
      </div>
    </section>
  );
}

function Dato({
  titulo,
  valor,
  detalle,
  className,
}: {
  titulo: string;
  valor: ReactNode;
  detalle: ReactNode;
  className: string;
}) {
  return (
    <div className={`p-4 print:px-3 print:py-2.5 ${className}`}>
      <dt className="text-sm font-medium text-tinta-suave">{titulo}</dt>
      <dd className="mt-1.5 font-display text-xl font-bold tracking-tight tabular-nums sm:text-2xl print:text-xl">
        {valor}
      </dd>
      {detalle ? <dd className="mt-1 text-sm text-tinta-suave tabular-nums">{detalle}</dd> : null}
    </div>
  );
}
