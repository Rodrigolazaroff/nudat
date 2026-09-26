import type { ReactNode } from "react";
import { etiquetaTipo } from "@/lib/comidas";
import {
  COMIDAS_PRINCIPALES,
  HORA_CORTE_DIA,
  formatearDuracion,
  formatearMinutos,
  type Estadistica,
  type Resumen,
} from "@/lib/resumen";
import { fechaCorta, formatearDecimal, plural } from "./formato";
import { ui } from "./ui";
import { Voz } from "./voz";

// En papel el borde claro de pantalla casi no se ve: se oscurece al imprimir.
const tarjeta = `${ui.tarjeta} print:border-tinta-suave`;

function hora(e: Estadistica | null): string {
  return e ? formatearMinutos(e.promedio) : "Sin dato";
}

export function ResumenSemana({ resumen: r }: { resumen: Resumen }) {
  const ayuno = r.ayunoNocturno;

  return (
    <section aria-labelledby="titulo-resumen" className="flex flex-col gap-3 print:break-inside-avoid">
      <h2 id="titulo-resumen" className="text-lg font-semibold tracking-tight">
        Resumen
      </h2>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:grid-cols-4">
        <Dato
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
          titulo="Días con registros"
          valor={`${r.diasConRegistro} de ${r.diasPeriodo}`}
          detalle={
            r.promedioComidasPorDia !== null
              ? `${formatearDecimal(r.promedioComidasPorDia)} comidas por día, sin contar bebidas`
              : null
          }
        />
        <Dato
          titulo="Ayuno nocturno"
          valor={ayuno ? formatearDuracion(ayuno.promedio) : "Sin dato"}
          detalle={
            ayuno
              ? ayuno.cantidad === 1
                ? "1 noche"
                : `${ayuno.cantidad} noches · de ${formatearDuracion(ayuno.minimo)} a ${formatearDuracion(ayuno.maximo)}`
              : "Hacen falta dos días seguidos con registros"
          }
        />
        <div className={tarjeta}>
          <dt className="text-sm text-tinta-suave">Horario promedio</dt>
          <dd className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-sm">Primera</span>
            <span className="text-xl font-semibold tabular-nums">{hora(r.primeraComida)}</span>
          </dd>
          <dd className="flex items-baseline justify-between gap-2">
            <span className="text-sm">Última</span>
            <span className="text-xl font-semibold tabular-nums">{hora(r.ultimaComida)}</span>
          </dd>
        </div>
      </dl>

      <div className="grid gap-3 lg:grid-cols-3 print:grid-cols-3">
        <div className={`${tarjeta} lg:col-span-2 print:col-span-2`}>
          <h3 className="text-sm text-tinta-suave">Por tipo de comida</h3>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-xs text-tinta-suave">
                <th scope="col" className="py-1.5 pr-2 text-left font-normal">
                  Comida
                </th>
                <th scope="col" className="px-2 py-1.5 text-right font-normal">
                  Días
                </th>
                <th scope="col" className="py-1.5 pl-2 text-right font-normal">
                  Horario promedio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde print:divide-tinta-suave">
              {r.porTipo.map((t) => (
                <tr key={t.tipo}>
                  <th scope="row" className="py-2 pr-2 text-left font-medium">
                    {etiquetaTipo(t.tipo)}
                  </th>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {t.dias} <span className="text-tinta-suave">de {r.diasPeriodo}</span>
                    {t.registros > t.dias ? (
                      <span className="block text-xs text-tinta-suave">{t.registros} registros</span>
                    ) : null}
                  </td>
                  <td className="py-2 pl-2 text-right tabular-nums">
                    {t.tipo === "bebida" ? (
                      // Un promedio de horarios de bebidas no dice nada: se toman a cualquier hora.
                      <span className="text-tinta-suave">
                        {t.registros > 0 ? "Varios horarios" : "Sin dato"}
                      </span>
                    ) : t.horario ? (
                      <>
                        {formatearMinutos(t.horario.promedio)}
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
        </div>

        <div className="flex flex-col gap-3">
          <div className={tarjeta}>
            <h3 className="text-sm text-tinta-suave">Comidas principales sin registro</h3>
            {r.salteadas.diasEvaluados === 0 ? (
              <p className="mt-2 text-sm text-tinta-suave">Todavía no hay días completos para evaluar.</p>
            ) : (
              <>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {COMIDAS_PRINCIPALES.map((t) => {
                    const n = r.salteadas.porTipo[t];
                    return (
                      <li key={t} className="flex items-baseline justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          {n > 0 ? (
                            <span aria-hidden="true" className="size-1.5 rounded-full bg-acento" />
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
                <p className="mt-2 text-xs text-tinta-suave">
                  Sobre {plural(r.salteadas.diasEvaluados, "día", "días")} con registros.
                </p>
              </>
            )}
          </div>

          <div className={tarjeta}>
            <h3 className="text-sm text-tinta-suave">Cenas después de las 22:00</h3>
            {r.cenasTarde.totalCenas === 0 ? (
              <p className="mt-2 text-sm text-tinta-suave">
                <Voz pantalla="No cargaste cenas." impresion="No registró cenas." />
              </p>
            ) : (
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {r.cenasTarde.cantidad}{" "}
                <span className="text-base font-normal text-tinta-suave">
                  de {plural(r.cenasTarde.totalCenas, "cena", "cenas")}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-tinta-suave text-pretty">
        Lo que se come antes de las {String(HORA_CORTE_DIA).padStart(2, "0")}:00 cuenta para el día
        anterior. Las bebidas no cuentan para los horarios de comida (primera, última y ayuno).
        {r.diaEnCurso ? (
          <>
            {" "}
            <Voz
              pantalla={`Hoy (${fechaCorta(r.diaEnCurso)}) todavía está en curso: no se cuenta en comidas sin registro ni en la última comida.`}
              impresion={`El día en curso al imprimir (${fechaCorta(r.diaEnCurso)}) no se cuenta en comidas sin registro ni en la última comida.`}
            />
          </>
        ) : null}
        {r.diasSinRegistro.length > 0
          ? " Los días sin ningún registro no se cuentan como comidas salteadas."
          : null}
      </p>
    </section>
  );
}

function Dato({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: ReactNode;
  detalle: ReactNode;
}) {
  return (
    <div className={tarjeta}>
      <dt className="text-sm text-tinta-suave">{titulo}</dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{valor}</dd>
      {detalle ? <dd className="mt-1 text-sm text-tinta-suave tabular-nums">{detalle}</dd> : null}
    </div>
  );
}
