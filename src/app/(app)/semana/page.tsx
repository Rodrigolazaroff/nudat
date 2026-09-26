import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerPerfil } from "@/lib/perfil";
import { horaActual, hoyISO } from "@/lib/comidas";
import {
  calcularResumen,
  diaAlimentario,
  esFechaValida,
  sumarDias,
  ubicarComidas,
} from "@/lib/resumen";
import { firmarFotos } from "@/components/comidas/firmar-fotos";
import { IconoMas, IconoSemana, IconoVolver } from "@/components/comidas/iconos";
import { BotonImprimir } from "@/components/semana/boton-imprimir";
import {
  fechaNumerica,
  horaCorta,
  rangoFechas,
  rangoFechasConAnio,
  rangoFechasCorto,
} from "@/components/semana/formato";
import { GrillaSemana, type DiaGrilla } from "@/components/semana/grilla-semana";
import { HojaDias } from "@/components/semana/hoja-dias";
import { papel } from "@/components/semana/papel";
import { ResumenSemana } from "@/components/semana/resumen-semana";
import { SelectorSemana } from "@/components/semana/selector-semana";
import { Voz } from "@/components/semana/voz";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const escalon = (i: number) => ({ "--i": i }) as CSSProperties;

/** Período: 7 días. Por defecto, los últimos 7 terminando hoy; nunca más adelante. */
function periodo(consulta: Record<string, string | string[] | undefined>) {
  const hoyCalendario = hoyISO();
  // Día alimentario, igual que /resumen: de madrugada "hoy" sigue siendo ayer.
  const hoy = diaAlimentario(hoyCalendario, horaActual())?.dia ?? hoyCalendario;
  const desdeUltimos = sumarDias(hoy, -6);
  const pedido = Array.isArray(consulta.desde) ? consulta.desde[0] : consulta.desde;
  const desde = pedido && esFechaValida(pedido) && pedido < desdeUltimos ? pedido : desdeUltimos;
  return { hoy, hoyCalendario, desdeUltimos, desde, hasta: sumarDias(desde, 6) };
}

// Momento en que se firmaron las URLs de las fotos (duran 1 hora).
function ahora() {
  return Date.now();
}

// El título es el nombre sugerido al guardar en PDF: "Registro alimentario 15 al 21 sep 2026 · Martín".
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [perfil, consulta] = await Promise.all([obtenerPerfil(), searchParams]);
  const { desde, hasta } = periodo(consulta);
  const nombre = perfil.nombre ? ` · ${perfil.nombre}` : "";
  return { title: { absolute: `Registro alimentario ${rangoFechasCorto(desde, hasta)}${nombre}` } };
}

export default async function PaginaSemana({ searchParams }: Props) {
  const [perfil, consulta] = await Promise.all([obtenerPerfil(), searchParams]);
  const { hoy, hoyCalendario, desdeUltimos, desde, hasta } = periodo(consulta);

  const supabase = await createClient();
  // Hasta el día siguiente: lo comido de madrugada cuenta para el último día del período.
  const { data: comidas, error } = await supabase
    .from("comidas")
    .select("*")
    .eq("usuario_id", perfil.id)
    .gte("fecha", desde)
    .lte("fecha", sumarDias(hasta, 1))
    .order("fecha")
    .order("hora");
  if (error) throw new Error(`comidas: ${error.message}`);

  const dias = ubicarComidas(comidas, desde, hasta);
  const firmadoEn = ahora();
  const fotos = await firmarFotos(
    supabase,
    dias.flatMap((d) => d.comidas.map((u) => u.comida.foto_path)),
  );
  const resumen = calcularResumen(comidas, desde, hasta, { hoy });

  const grilla: DiaGrilla[] = dias.map((d) => ({
    fecha: d.fecha,
    comidas: d.comidas.map(({ comida, madrugada }) => {
      const fotoUrl = comida.foto_path ? (fotos.get(comida.foto_path) ?? null) : null;
      return {
        id: comida.id,
        tipo: comida.tipo,
        fecha: comida.fecha,
        hora: horaCorta(comida.hora),
        descripcion: comida.descripcion,
        fotoUrl,
        fotoError: Boolean(comida.foto_path) && !fotoUrl,
        madrugada,
      };
    }),
  }));

  const href = (d: string) => (d === desdeUltimos ? "/semana" : `/semana?desde=${d}`);
  const siguiente = sumarDias(desde, 7);
  const vacia = resumen.totalRegistros === 0;

  return (
    // Al imprimir, la página es una tabla: el encabezado (table-header-group) se repite
    // arriba de cada hoja, así ninguna queda sin nombre ni período.
    <div className="flex flex-col gap-8 pb-6 print:table print:w-full print:pb-0">
      {/* A4 vertical: la hoja impresa es una lista por día, no la grilla de 7 columnas. */}
      <style>{"@media print { @page { size: A4 portrait; margin: 12mm 12mm 14mm; } }"}</style>

      <div className="hidden print:table-header-group">
        <div className="print:table-row">
          <div className="print:table-cell print:pb-4">
            <div className="flex items-end justify-between gap-4 border-b border-tinta pb-2">
              <div className="min-w-0">
                <p className="font-display text-xl font-bold tracking-tight">
                  Registro alimentario{perfil.nombre ? ` de ${perfil.nombre}` : ""}
                </p>
                <p className="text-sm">Del {rangoFechasConAnio(desde, hasta)}</p>
              </div>
              <p className="shrink-0 text-right text-xs text-tinta-suave">
                Generado el {fechaNumerica(hoyCalendario)} con nudat
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pantalla: título grande + flechas; abajo, período y acción principal ── */}
      <div className="flex flex-col gap-5 print:hidden">
        <div className="entrar flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="titulo-pantalla text-[clamp(2.5rem,11vw,3.5rem)]">Mi semana</h1>
            <p className="mt-2 font-medium text-pretty text-tinta-suave">Del {rangoFechas(desde, hasta)}</p>
          </div>
          <SelectorSemana
            hrefAnterior={href(sumarDias(desde, -7))}
            hrefSiguiente={
              desde < desdeUltimos ? href(siguiente < desdeUltimos ? siguiente : desdeUltimos) : null
            }
          />
        </div>

        <div className="entrar flex flex-wrap items-center justify-between gap-3" style={escalon(1)}>
          {desde < desdeUltimos ? (
            <Link
              href="/semana"
              scroll={false}
              className="foco -ml-3 inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-primario transition-[background-color,scale] duration-150 ease-premium select-none hover:bg-primario-suave active:scale-95 active:bg-primario-suave motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              <IconoVolver className="size-4" />
              Ir a los últimos 7 días
            </Link>
          ) : (
            <span className="pastilla">Últimos 7 días</span>
          )}
          <BotonImprimir firmadoEn={firmadoEn} variante={vacia ? "secundario" : "primario"} />
        </div>
      </div>

      <div className="print:table-row-group">
        <div className="print:table-row">
          <div className="print:table-cell">
            {vacia ? (
              <div className={`bisel entrar ${papel.bisel}`} style={escalon(2)}>
                <div
                  className={`bisel-nucleo flex flex-col items-center px-6 py-10 text-center print:py-6 ${papel.nucleo}`}
                >
                  <div className="flex size-18 items-center justify-center rounded-full bg-primario-suave text-primario shadow-[inset_0_0_0_6px_var(--superficie),0_0_0_1px_var(--borde)] print:hidden">
                    <IconoSemana className="size-8" />
                  </div>
                  <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-balance print:mt-0 print:font-sans print:text-base print:font-medium">
                    <Voz
                      pantalla="No cargaste nada en estos días"
                      impresion="No hay registros en estos días."
                    />
                  </h2>
                  <Link
                    href="/nueva"
                    className="boton boton-primario foco group mt-6 min-h-13 pr-1.5 pl-5 print:hidden"
                  >
                    Cargar algo
                    <span aria-hidden="true" className="boton-icono">
                      <IconoMas className="size-5" />
                    </span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-8 print:gap-6">
                <ResumenSemana resumen={resumen} />
                <section aria-labelledby="titulo-grilla" className="flex flex-col gap-3">
                  <h2
                    id="titulo-grilla"
                    className="entrar font-display text-xl font-bold tracking-tight break-after-avoid"
                    style={escalon(4)}
                  >
                    Día por día
                  </h2>
                  <GrillaSemana key={desde} dias={grilla} diaEnCurso={resumen.diaEnCurso} />
                  <HojaDias dias={grilla} diaEnCurso={resumen.diaEnCurso} />
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
