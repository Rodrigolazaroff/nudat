import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerPerfil } from "@/lib/perfil";
import { hoyISO } from "@/lib/comidas";
import { calcularResumen, esFechaValida, sumarDias, ubicarComidas } from "@/lib/resumen";
import { firmarFotos } from "@/components/comidas/firmar-fotos";
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
import { ResumenSemana } from "@/components/semana/resumen-semana";
import { SelectorSemana } from "@/components/semana/selector-semana";
import { ui } from "@/components/semana/ui";
import { Voz } from "@/components/semana/voz";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Período: 7 días. Por defecto, los últimos 7 terminando hoy; nunca más adelante. */
function periodo(consulta: Record<string, string | string[] | undefined>) {
  const hoy = hoyISO();
  const desdeUltimos = sumarDias(hoy, -6);
  const pedido = Array.isArray(consulta.desde) ? consulta.desde[0] : consulta.desde;
  const desde = pedido && esFechaValida(pedido) && pedido < desdeUltimos ? pedido : desdeUltimos;
  return { hoy, desdeUltimos, desde, hasta: sumarDias(desde, 6) };
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
  const { hoy, desdeUltimos, desde, hasta } = periodo(consulta);

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

  return (
    // Al imprimir, la página es una tabla: el encabezado (table-header-group) se repite
    // arriba de cada hoja, así ninguna queda sin nombre ni período.
    <div className="flex flex-col gap-6 pb-6 print:table print:w-full print:pb-0">
      {/* A4 vertical: la hoja impresa es una lista por día, no la grilla de 7 columnas. */}
      <style>{"@media print { @page { size: A4 portrait; margin: 12mm 12mm 14mm; } }"}</style>

      <div className="hidden print:table-header-group">
        <div className="print:table-row">
          <div className="print:table-cell print:pb-4">
            <div className="flex items-end justify-between gap-4 border-b border-tinta pb-2">
              <div className="min-w-0">
                <p className="text-lg font-semibold">
                  Registro alimentario{perfil.nombre ? ` de ${perfil.nombre}` : ""}
                </p>
                <p className="text-sm">Del {rangoFechasConAnio(desde, hasta)}</p>
              </div>
              <p className="shrink-0 text-right text-xs text-tinta-suave">
                Generado el {fechaNumerica(hoy)} con nudat
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 print:hidden">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">Mi semana</h1>
            <p className="mt-1 text-tinta-suave">Del {rangoFechas(desde, hasta)}</p>
          </div>
          <BotonImprimir firmadoEn={firmadoEn} />
        </div>

        <SelectorSemana
          desde={desde}
          hasta={hasta}
          hrefAnterior={href(sumarDias(desde, -7))}
          hrefSiguiente={desde < desdeUltimos ? href(siguiente < desdeUltimos ? siguiente : desdeUltimos) : null}
          hrefUltimos={desde < desdeUltimos ? "/semana" : null}
        />
      </div>

      <div className="print:table-row-group">
        <div className="print:table-row">
          <div className="print:table-cell">
            {resumen.totalRegistros === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-borde bg-superficie px-6 py-12 text-center print:border-tinta-suave">
                <p className="font-medium">
                  <Voz
                    pantalla="No cargaste nada en estos días"
                    impresion="No hay registros en estos días."
                  />
                </p>
                <p className="mt-1 max-w-md text-sm text-tinta-suave text-pretty print:hidden">
                  Cuando cargues tus comidas y bebidas, acá vas a ver el resumen de la semana y lo vas a
                  poder imprimir o guardar en PDF para llevárselo a tu nutri.
                </p>
                <Link href="/nueva" className={`${ui.botonPrimario} mt-5 print:hidden`}>
                  Cargar algo
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <ResumenSemana resumen={resumen} />
                <section aria-labelledby="titulo-grilla" className="flex flex-col gap-3">
                  <h2 id="titulo-grilla" className="text-lg font-semibold tracking-tight break-after-avoid">
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
