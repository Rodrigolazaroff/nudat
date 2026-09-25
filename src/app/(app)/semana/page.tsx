import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerPerfil } from "@/lib/perfil";
import { hoyISO } from "@/lib/comidas";
import { calcularResumen, esFechaValida, sumarDias, ubicarComidas } from "@/lib/resumen";
import { firmarFotos } from "@/components/comidas/firmar-fotos";
import { BotonImprimir } from "@/components/semana/boton-imprimir";
import { horaCorta, rangoFechas } from "@/components/semana/formato";
import { GrillaSemana, type DiaGrilla } from "@/components/semana/grilla-semana";
import { ResumenSemana } from "@/components/semana/resumen-semana";
import { SelectorSemana } from "@/components/semana/selector-semana";
import { ui } from "@/components/semana/ui";

export const metadata: Metadata = { title: "Mi semana · nudat" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaginaSemana({ searchParams }: Props) {
  const [perfil, consulta] = await Promise.all([obtenerPerfil(), searchParams]);

  // Período: 7 días. Por defecto, los últimos 7 terminando hoy; nunca más adelante.
  const hoy = hoyISO();
  const desdeUltimos = sumarDias(hoy, -6);
  const pedido = Array.isArray(consulta.desde) ? consulta.desde[0] : consulta.desde;
  const desde = pedido && esFechaValida(pedido) && pedido < desdeUltimos ? pedido : desdeUltimos;
  const hasta = sumarDias(desde, 6);

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
    <div className="flex flex-col gap-6 pb-6">
      {/* Al imprimir: apaisado, así entra la grilla de 7 columnas. */}
      <style>{"@media print { @page { size: landscape; margin: 12mm; } }"}</style>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              <span className="print:hidden">Mi semana</span>
              <span className="hidden print:inline">
                Registro alimentario{perfil.nombre ? ` de ${perfil.nombre}` : ""}
              </span>
            </h1>
            <p className="mt-1 text-tinta-suave">Del {rangoFechas(desde, hasta)}</p>
          </div>
          <BotonImprimir />
        </div>

        <SelectorSemana
          desde={desde}
          hasta={hasta}
          hrefAnterior={href(sumarDias(desde, -7))}
          hrefSiguiente={desde < desdeUltimos ? href(siguiente < desdeUltimos ? siguiente : desdeUltimos) : null}
          hrefUltimos={desde < desdeUltimos ? "/semana" : null}
        />
      </div>

      {resumen.totalRegistros === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-borde bg-superficie px-6 py-12 text-center">
          <p className="font-medium">No cargaste nada en estos días</p>
          <p className="mt-1 max-w-md text-sm text-tinta-suave text-pretty">
            Cuando cargues tus comidas y bebidas, acá vas a ver el resumen de la semana y lo vas a
            poder imprimir o guardar en PDF para llevárselo a tu nutri.
          </p>
          <Link href="/nueva" className={`${ui.botonPrimario} mt-5 print:hidden`}>
            Cargar algo
          </Link>
        </div>
      ) : (
        <>
          <ResumenSemana resumen={resumen} />
          <section aria-labelledby="titulo-grilla" className="flex flex-col gap-3">
            <h2 id="titulo-grilla" className="text-lg font-semibold tracking-tight">
              Día por día
            </h2>
            <GrillaSemana key={desde} dias={grilla} diaEnCurso={resumen.diaEnCurso} />
          </section>
        </>
      )}
    </div>
  );
}
