import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { obtenerPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { esBebida, etiquetaTipo, hoyISO } from "@/lib/comidas";
import {
  COMIDAS_PRINCIPALES,
  HORA_CORTE_DIA,
  calcularResumen,
  rachaActual,
  registrosPorDia,
  sumarDias,
} from "@/lib/resumen";
import { IconoMas, IconoResumen } from "@/components/comidas/iconos";
import { formatearDecimal, plural, rangoFechas } from "@/components/semana/formato";
import { ui } from "@/components/semana/ui";
import { Horarios } from "@/components/resumen/horarios";
import { RepartoTipos } from "@/components/resumen/reparto-tipos";
import { SelectorPeriodo, periodoDeParam } from "@/components/resumen/selector-periodo";
import { TiraConstancia } from "@/components/resumen/tira-constancia";

export const metadata: Metadata = { title: "Resumen" };

// La racha puede ser más larga que el período: se mira hasta 60 días para atrás.
const DIAS_RACHA = 60;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaginaResumen({ searchParams }: Props) {
  const [perfil, consulta] = await Promise.all([obtenerPerfil(), searchParams]);

  const periodo = periodoDeParam(consulta.dias);
  const hoy = hoyISO();
  const hasta = hoy;
  const desde = sumarDias(hoy, -(periodo - 1));
  const desdeRacha = sumarDias(hoy, -(Math.max(DIAS_RACHA, periodo) - 1));

  // Una sola consulta, con lo justo para las cuentas. Hasta mañana: lo comido de
  // madrugada cuenta para el día anterior (mismo criterio que /semana). Más nuevas
  // primero: si alguna vez se llegara al tope de filas, se pierde lo más viejo.
  const supabase = await createClient();
  const { data: comidas, error } = await supabase
    .from("comidas")
    .select("fecha, hora, tipo, foto_path")
    .eq("usuario_id", perfil.id)
    .gte("fecha", desdeRacha)
    .lte("fecha", sumarDias(hasta, 1))
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false });
  if (error) throw new Error(`No se pudo cargar el resumen: ${error.message}`);

  // calcularResumen y registrosPorDia descartan solas lo que queda fuera del período.
  const resumen = calcularResumen(comidas, desde, hasta, { hoy });
  const dias = registrosPorDia(comidas, desde, hasta);
  const racha = rachaActual(comidas, hoy);
  // Si la racha llega al primer día consultado, puede venir de antes.
  const rachaAlTope = racha.dias >= DIAS_RACHA - (racha.incluyeHoy ? 0 : 1);

  const bebidas = resumen.porTipo.find((t) => esBebida(t.tipo)) ?? { registros: 0, dias: 0 };
  const promedioComidas =
    resumen.diasConRegistro > 0
      ? (resumen.totalRegistros - bebidas.registros) / resumen.diasConRegistro
      : null;
  const salteadas = COMIDAS_PRINCIPALES.reduce((n, t) => n + resumen.salteadas.porTipo[t], 0);

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-semibold">Resumen</h1>
          <p className="mt-1 text-sm text-tinta-suave">Del {rangoFechas(desde, hasta)}</p>
        </div>
        <SelectorPeriodo actual={periodo} />
      </div>

      {resumen.totalRegistros === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-borde bg-superficie px-6 py-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primario-suave text-primario">
            <IconoResumen className="size-8" />
          </div>
          <h2 className="mt-4 font-medium">No cargaste nada en los últimos {periodo} días</h2>
          <p className="mt-1 max-w-xs text-sm text-tinta-suave text-pretty">
            Cuando cargues lo que comés y tomás, acá vas a ver cómo venís: cuántos días registraste,
            tus horarios y qué comidas te faltan.
          </p>
          <Link href="/nueva" className={`${ui.botonPrimario} mt-5`}>
            <IconoMas className="size-5" />
            Cargar algo
          </Link>
        </div>
      ) : (
        <>
          <section aria-labelledby="titulo-numeros">
            <h2 id="titulo-numeros" className="sr-only">
              Números del período
            </h2>
            <dl className="grid grid-cols-2 gap-3">
              <Metrica
                titulo="Días con registro"
                valor={
                  <>
                    {resumen.diasConRegistro}{" "}
                    <span className="text-base font-normal text-tinta-suave">
                      de {resumen.diasPeriodo}
                    </span>
                  </>
                }
                detalle={
                  resumen.diasConRegistro === resumen.diasPeriodo
                    ? "¡Todos los días!"
                    : `${Math.round((resumen.diasConRegistro * 100) / resumen.diasPeriodo)} % del período`
                }
              />
              <Metrica
                titulo="Racha actual"
                valor={
                  <>
                    {racha.dias}
                    {rachaAlTope ? "+" : ""}{" "}
                    <span className="text-base font-normal">
                      {racha.dias === 1 ? "día" : "días"}
                      {rachaAlTope ? <span className="sr-only"> o más</span> : null}
                    </span>
                  </>
                }
                detalle={
                  racha.dias === 0
                    ? "Cargá algo hoy para arrancar una"
                    : racha.incluyeHoy
                      ? "Seguidos, contando hoy"
                      : "Seguidos hasta ayer: cargá algo hoy para sumar"
                }
              />
              <Metrica
                titulo="Comidas por día"
                valor={promedioComidas === null ? "—" : formatearDecimal(promedioComidas)}
                detalle="Promedio de los días con registro, sin bebidas"
              />
              <Metrica
                titulo="Bebidas"
                valor={bebidas.registros}
                detalle={
                  bebidas.registros === 0
                    ? "No registraste bebidas"
                    : `En ${plural(bebidas.dias, "día", "días")}`
                }
              />
            </dl>
          </section>

          <Seccion id="titulo-constancia" titulo="Constancia">
            <TiraConstancia dias={dias} hoy={hoy} />
          </Seccion>

          <Seccion id="titulo-horarios" titulo="Horarios típicos" tarjeta>
            <Horarios
              primera={resumen.primeraComida}
              ultima={resumen.ultimaComida}
              ayuno={resumen.ayunoNocturno}
            />
          </Seccion>

          <Seccion id="titulo-tipos" titulo="Qué cargaste" tarjeta>
            <RepartoTipos porTipo={resumen.porTipo} />
          </Seccion>

          <Seccion id="titulo-salteadas" titulo="Comidas principales sin registro" tarjeta>
            {resumen.salteadas.diasEvaluados === 0 ? (
              <p className="text-sm text-tinta-suave text-pretty">
                Todavía no hay días completos para mirar (hoy cuenta recién cuando termina).
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-tinta-suave text-pretty">
                  <span
                    className={`mr-1 text-2xl font-semibold tabular-nums ${
                      salteadas > 0 ? "text-tinta" : "text-primario"
                    }`}
                  >
                    {salteadas}
                  </span>{" "}
                  {salteadas === 1 ? "comida principal" : "comidas principales"} sin cargar en{" "}
                  {plural(resumen.salteadas.diasEvaluados, "día", "días")} con registros.
                </p>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  {COMIDAS_PRINCIPALES.map((t) => {
                    const n = resumen.salteadas.porTipo[t];
                    return (
                      <li
                        key={t}
                        className={`flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 ${
                          n > 0 ? "bg-fondo" : "bg-primario-suave text-primario"
                        }`}
                      >
                        <span>{etiquetaTipo(t)}</span>
                        <span className="font-semibold tabular-nums">
                          {n === 0 ? (
                            <>
                              <span aria-hidden="true">✓</span>
                              <span className="sr-only">: ninguna vez</span>
                            </>
                          ) : (
                            <>
                              <span className="sr-only">: </span>
                              {n}
                              <span className="sr-only">{n === 1 ? " día" : " días"}</span>
                            </>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Seccion>

          <p className="text-xs text-tinta-suave text-pretty">
            Lo que se come antes de las {String(HORA_CORTE_DIA).padStart(2, "0")}:00 cuenta para el
            día anterior. Los días sin nada cargado no cuentan como comidas salteadas.
          </p>
        </>
      )}

      <Link href="/semana" className={`${ui.botonSecundario} w-full`}>
        Ver semana para imprimir
      </Link>
    </div>
  );
}

function Seccion({
  id,
  titulo,
  tarjeta = false,
  children,
}: {
  id: string;
  titulo: string;
  tarjeta?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="font-semibold">
        {titulo}
      </h2>
      {tarjeta ? <div className={ui.tarjeta}>{children}</div> : children}
    </section>
  );
}

function Metrica({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: ReactNode;
  detalle: string;
}) {
  return (
    <div className={`${ui.tarjeta} flex flex-col`}>
      <dt className="text-sm text-tinta-suave">{titulo}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{valor}</dd>
      <dd className="mt-1 text-xs text-tinta-suave text-pretty">{detalle}</dd>
    </div>
  );
}
