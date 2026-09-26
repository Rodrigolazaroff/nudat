import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { obtenerPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { esBebida, etiquetaTipo, horaActual, hoyISO } from "@/lib/comidas";
import {
  COMIDAS_PRINCIPALES,
  calcularResumen,
  diaAlimentario,
  registrosPorDia,
  sumarDias,
} from "@/lib/resumen";
import { IconoImprimir, IconoMas, IconoResumen } from "@/components/comidas/iconos";
import { formatearDecimal, plural, rangoFechas } from "@/components/semana/formato";
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
      <div className="flex flex-col gap-5">
        <div className="entrar min-w-0">
          <h1 className="titulo-pantalla text-[clamp(2.5rem,12vw,3.5rem)]">Resumen</h1>
          <p className="mt-2 font-medium text-tinta-suave">Del {rangoFechas(desde, hasta)}</p>
        </div>
        <div className="entrar" style={escalon(1)}>
          <SelectorPeriodo actual={periodo} />
        </div>
      </div>

      {vacio ? (
        <div className="bisel entrar" style={escalon(2)}>
          <div className="bisel-nucleo flex flex-col items-center px-6 py-10 text-center">
            <div className="flex size-18 items-center justify-center rounded-full bg-primario-suave text-primario shadow-[inset_0_0_0_6px_var(--superficie),0_0_0_1px_var(--borde)]">
              <IconoResumen className="size-8" />
            </div>
            <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-balance">
              No cargaste nada en los últimos {periodo} días
            </h2>
            <div className="mt-6 flex w-full flex-col gap-2.5">
              <Link
                href="/nueva"
                className="boton boton-primario foco group w-full justify-between px-2"
              >
                <span aria-hidden="true" className="size-10 shrink-0" />
                Cargar una comida
                <span aria-hidden="true" className="boton-icono">
                  <IconoMas className="size-5" />
                </span>
              </Link>
              {hayEn30Dias ? (
                <Link href="/resumen?dias=30" className="boton boton-secundario foco w-full">
                  Ver los últimos 30 días
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <>
          <section
            aria-labelledby="titulo-constancia"
            className="entrar flex flex-col gap-3"
            style={escalon(2)}
          >
            <h2
              id="titulo-constancia"
              className="font-display text-xl font-bold tracking-tight text-balance"
            >
              <span className="tabular-nums">{resumen.diasConRegistro}</span> de{" "}
              <span className="tabular-nums">{resumen.diasPeriodo}</span> días con algo cargado
            </h2>
            <TiraConstancia dias={dias} hoy={hoy} madrugada={madrugada} />
          </section>

          <section aria-labelledby="titulo-numeros" className="entrar" style={escalon(3)}>
            <h2 id="titulo-numeros" className="sr-only">
              Promedios del período
            </h2>
            <div className="bisel">
              <dl className="bisel-nucleo flex flex-col divide-y divide-borde px-5 py-1.5">
                {promedioComidas === null ? (
                  <Dato titulo="Comidas por día" valor="Sin datos" apagado />
                ) : (
                  <Dato titulo="Comidas por día" valor={formatearDecimal(promedioComidas)} />
                )}
                {bebidas.registros === 0 ? (
                  <Dato titulo="Bebidas" valor="Ninguna cargada" apagado />
                ) : (
                  <Dato
                    titulo="Bebidas"
                    valor={String(bebidas.registros)}
                    resto={`en ${plural(bebidas.dias, "día", "días")}`}
                  />
                )}
                {resumen.conFoto > 0 ? (
                  <Dato
                    titulo="Con foto"
                    valor={String(resumen.conFoto)}
                    resto={`de ${plural(resumen.totalRegistros, "registro", "registros")}`}
                  />
                ) : null}
              </dl>
            </div>
          </section>

          <Seccion id="titulo-horarios" titulo="Horarios" paso={4}>
            <Horarios
              primera={resumen.primeraComida}
              ultima={resumen.ultimaComida}
              ayuno={resumen.ayunoNocturno}
            />
          </Seccion>

          <Seccion id="titulo-tipos" titulo="Qué cargaste" paso={5}>
            <RepartoTipos porTipo={resumen.porTipo} />
          </Seccion>

          <Seccion id="titulo-principales" titulo="Comidas principales" paso={6}>
            {diasEvaluados === 0 ? (
              <p className="py-1 text-sm text-tinta-suave text-pretty">
                Todavía no hay días terminados.
              </p>
            ) : (
              <dl className="-my-1.5 flex flex-col divide-y divide-borde">
                {COMIDAS_PRINCIPALES.map((t) => (
                  <Dato
                    key={t}
                    titulo={etiquetaTipo(t)}
                    valor={String(diasEvaluados - resumen.salteadas.porTipo[t])}
                    resto={`de ${plural(diasEvaluados, "día", "días")}`}
                  />
                ))}
              </dl>
            )}
          </Seccion>

          <div className="entrar" style={escalon(7)}>
            <Link
              href="/semana"
              className="boton boton-secundario foco group w-full justify-between px-2"
            >
              <span aria-hidden="true" className="size-10 shrink-0" />
              Imprimir semana
              <span aria-hidden="true" className="boton-icono">
                <IconoImprimir className="size-5" />
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

const escalon = (i: number) => ({ "--i": i }) as CSSProperties;

// Bloque con título de sección (display) y su contenido en una tarjeta con bisel.
function Seccion({
  id,
  titulo,
  paso,
  children,
}: {
  id: string;
  titulo: string;
  paso: number;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="entrar flex flex-col gap-3" style={escalon(paso)}>
      <h2 id={id} className="font-display text-xl font-bold tracking-tight">
        {titulo}
      </h2>
      <div className="bisel">
        <div className="bisel-nucleo px-5 py-4">{children}</div>
      </div>
    </section>
  );
}

// Fila etiqueta + valor: el número en display y, al lado, su unidad ("de 7 días").
function Dato({
  titulo,
  valor,
  resto,
  apagado = false,
}: {
  titulo: string;
  valor: string;
  resto?: string;
  apagado?: boolean;
}) {
  return (
    <div className="flex min-h-13 items-center justify-between gap-4 py-2.5">
      <dt className="text-[0.9375rem] font-medium text-tinta-suave">{titulo}</dt>
      <dd className="text-right">
        {apagado ? (
          <span className="text-sm text-tinta-suave">{valor}</span>
        ) : (
          <>
            <span className="font-display text-xl leading-none font-bold tracking-tight tabular-nums">
              {valor}
            </span>
            {resto ? (
              <span className="text-sm font-medium text-tinta-suave tabular-nums"> {resto}</span>
            ) : null}
          </>
        )}
      </dd>
    </div>
  );
}
