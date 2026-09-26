import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { obtenerPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { esBebida, etiquetaTipo, horaActual, hoyISO } from "@/lib/comidas";
import {
  COMIDAS_PRINCIPALES,
  HORA_CORTE_DIA,
  calcularResumen,
  diaAlimentario,
  registrosPorDia,
  sumarDias,
} from "@/lib/resumen";
import { IconoImprimir, IconoMas, IconoResumen } from "@/components/comidas/iconos";
import { formatearDecimal, plural, rangoFechas } from "@/components/semana/formato";
import { ui } from "@/components/semana/ui";
import { Horarios } from "@/components/resumen/horarios";
import { RepartoTipos } from "@/components/resumen/reparto-tipos";
import { SelectorPeriodo, periodoDeParam } from "@/components/resumen/selector-periodo";
import { TiraConstancia } from "@/components/resumen/tira-constancia";

export const metadata: Metadata = { title: "Resumen" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaginaResumen({ searchParams }: Props) {
  const [perfil, consulta] = await Promise.all([obtenerPerfil(), searchParams]);

  const periodo = periodoDeParam(consulta.dias);
  // "Hoy" es el día alimentario: a las 02:00 todavía es el día anterior, así el día
  // nuevo no aparece vacío y el de ayer no se da por terminado antes de tiempo.
  const hoyCalendario = hoyISO();
  const hoy = diaAlimentario(hoyCalendario, horaActual())?.dia ?? hoyCalendario;
  const hasta = hoy;
  const desde = sumarDias(hoy, -(periodo - 1));

  // Una sola consulta con lo justo para las cuentas. Hasta el día siguiente: lo
  // comido de madrugada cuenta para el día anterior (mismo criterio que /semana).
  const supabase = await createClient();
  const { data: comidas, error } = await supabase
    .from("comidas")
    .select("fecha, hora, tipo, foto_path")
    .eq("usuario_id", perfil.id)
    .gte("fecha", desde)
    .lte("fecha", sumarDias(hasta, 1))
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false });
  if (error) throw new Error(`No se pudo cargar el resumen: ${error.message}`);

  // calcularResumen y registrosPorDia descartan solas lo que queda fuera del período.
  const resumen = calcularResumen(comidas, desde, hasta, { hoy });
  const dias = registrosPorDia(comidas, desde, hasta);

  // Registros de madrugada por día alimentario: en Hoy figuran en el día siguiente.
  const madrugada: Record<string, number> = {};
  for (const c of comidas) {
    const lugar = diaAlimentario(c.fecha, c.hora);
    if (lugar?.madrugada) madrugada[lugar.dia] = (madrugada[lugar.dia] ?? 0) + 1;
  }

  // Semana vacía: si hay algo en los últimos 30 días, se ofrece verlo.
  let hayEn30Dias = false;
  if (resumen.totalRegistros === 0 && periodo === 7) {
    const { count } = await supabase
      .from("comidas")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", perfil.id)
      .gte("fecha", sumarDias(hoy, -29))
      .lte("fecha", sumarDias(hoy, 1));
    hayEn30Dias = (count ?? 0) > 0;
  }

  const bebidas = resumen.porTipo.find((t) => esBebida(t.tipo)) ?? { registros: 0, dias: 0 };
  // Comidas por día: solo días con alguna comida (un día con un mate solo no baja el promedio).
  const diasConComida = dias.filter((d) => d.comidas > 0);
  const totalComidas = diasConComida.reduce((n, d) => n + d.comidas, 0);
  const promedioComidas =
    diasConComida.length > 0 ? totalComidas / diasConComida.length : null;
  const diasEvaluados = resumen.salteadas.diasEvaluados;
  const vacio = resumen.totalRegistros === 0;

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">Resumen</h1>
            <p className="mt-1 text-sm text-tinta-suave">Del {rangoFechas(desde, hasta)}</p>
          </div>
          {vacio ? null : (
            <Link
              href="/semana"
              className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-borde bg-superficie px-3 text-sm font-medium text-tinta transition-colors hover:bg-fondo motion-reduce:transition-none ${ui.foco}`}
            >
              <IconoImprimir className="size-5" />
              Imprimir semana
            </Link>
          )}
        </div>
        <SelectorPeriodo actual={periodo} />
      </div>

      {vacio ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-borde bg-superficie px-6 py-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primario-suave text-primario">
            <IconoResumen className="size-8" />
          </div>
          <h2 className="mt-4 font-medium text-balance">
            No cargaste nada en los últimos {periodo} días
          </h2>
          <p className="mt-1 max-w-xs text-sm text-tinta-suave text-pretty">
            {hayEn30Dias
              ? "En los últimos 30 días sí hay registros. Podés verlos o cargar lo que comiste hoy."
              : "Cuando cargues lo que comés y tomás, acá vas a ver qué comidas cargaste cada día y en qué horarios."}
          </p>
          <div className="mt-5 flex w-full max-w-xs flex-col gap-2">
            <Link href="/nueva" className={ui.botonPrimario}>
              <IconoMas className="size-5" />
              Cargar una comida
            </Link>
            {hayEn30Dias ? (
              <Link href="/resumen?dias=30" className={ui.botonSecundario}>
                Ver los últimos 30 días
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <section aria-labelledby="titulo-constancia" className="flex flex-col gap-3">
            <h2 id="titulo-constancia" className="text-lg font-semibold text-balance">
              <span className="tabular-nums">{resumen.diasConRegistro}</span> de{" "}
              <span className="tabular-nums">{resumen.diasPeriodo}</span> días con algo cargado
            </h2>
            <TiraConstancia dias={dias} hoy={hoy} madrugada={madrugada} />
          </section>

          <section aria-labelledby="titulo-numeros">
            <h2 id="titulo-numeros" className="sr-only">
              Promedios del período
            </h2>
            <dl className="flex flex-col divide-y divide-borde rounded-2xl border border-borde bg-superficie px-4 py-1">
              <Dato
                titulo="Comidas por día"
                valor={promedioComidas === null ? "Sin datos" : formatearDecimal(promedioComidas)}
                detalle={
                  promedioComidas === null
                    ? "Solo cargaste bebidas"
                    : `Promedio de ${plural(diasConComida.length, "día", "días")}, sin bebidas`
                }
              />
              <Dato
                titulo="Bebidas"
                valor={
                  bebidas.registros === 0
                    ? "Ninguna cargada"
                    : `${bebidas.registros}, en ${plural(bebidas.dias, "día", "días")}`
                }
              />
              {resumen.conFoto > 0 ? (
                <Dato
                  titulo="Con foto"
                  valor={`${resumen.conFoto} de ${plural(resumen.totalRegistros, "registro", "registros")}`}
                />
              ) : null}
            </dl>
          </section>

          <Seccion id="titulo-horarios" titulo="Horarios">
            <Horarios
              primera={resumen.primeraComida}
              ultima={resumen.ultimaComida}
              ayuno={resumen.ayunoNocturno}
            />
          </Seccion>

          <Seccion id="titulo-tipos" titulo="Qué cargaste">
            <RepartoTipos porTipo={resumen.porTipo} />
          </Seccion>

          <Seccion id="titulo-principales" titulo="Comidas principales">
            {diasEvaluados === 0 ? (
              <p className="text-sm text-tinta-suave text-pretty">
                Todavía no hay días terminados para mirar. Hoy entra cuando termina.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-tinta-suave text-pretty">
                  {diasEvaluados === 1
                    ? "Si aparece cada una en el día terminado con algo cargado."
                    : `En cuántos de los ${plural(diasEvaluados, "día terminado", "días terminados")} con algo cargado aparece cada una.`}
                </p>
                <dl className="flex flex-col divide-y divide-borde">
                  {COMIDAS_PRINCIPALES.map((t) => {
                    const con = diasEvaluados - resumen.salteadas.porTipo[t];
                    return (
                      <div key={t} className="flex min-h-11 items-center justify-between gap-3">
                        <dt>{etiquetaTipo(t)}</dt>
                        <dd className="tabular-nums">
                          {con} de {plural(diasEvaluados, "día", "días")}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </Seccion>

          <p className="text-xs text-tinta-suave text-pretty">
            Lo que se come antes de las {String(HORA_CORTE_DIA).padStart(2, "0")}:00 cuenta para el
            día anterior. Los días sin nada cargado no entran en las comidas principales.
          </p>
        </>
      )}
    </div>
  );
}

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="font-semibold">
        {titulo}
      </h2>
      <div className={ui.tarjeta}>{children}</div>
    </section>
  );
}

// Fila clave-valor: el nombre a la izquierda, el dato y su aclaración a la derecha.
function Dato({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <div className="flex min-h-11 items-baseline justify-between gap-4 py-2.5">
      <dt className="text-sm text-tinta-suave">{titulo}</dt>
      <dd className="text-right">
        <span className="font-semibold tabular-nums">{valor}</span>
        {detalle ? (
          <span className="block text-xs text-tinta-suave text-pretty">{detalle}</span>
        ) : null}
      </dd>
    </div>
  );
}
