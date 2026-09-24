import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { exigirRol } from "@/lib/perfil";
import { BUCKET_FOTOS, hoyISO } from "@/lib/comidas";
import { calcularResumen, esFechaValida, sumarDias, ubicarComidas } from "@/lib/resumen";
import { BotonImprimir } from "@/components/nutri/boton-imprimir";
import { horaCorta, rangoFechas } from "@/components/nutri/formato";
import { GrillaSemana, type DiaGrilla } from "@/components/nutri/grilla-semana";
import { ResumenSemana } from "@/components/nutri/resumen-semana";
import { SelectorSemana } from "@/components/nutri/selector-semana";
import { ui } from "@/components/nutri/ui";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIGENCIA_FOTOS_SEGUNDOS = 60 * 60;

// Una vez por request (la usan generateMetadata y la página).
// Si no es paciente de esta nutri, la RLS no lo devuelve → null.
const obtenerPaciente = cache(async (id: string) => {
  if (!RE_UUID.test(id)) return null;
  const perfil = await exigirRol("nutri");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre")
    .eq("id", id)
    .eq("nutri_id", perfil.id)
    .eq("rol", "paciente")
    .maybeSingle();
  if (error) throw new Error(`perfiles: ${error.message}`);
  return data;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const paciente = await obtenerPaciente(id);
  return { title: paciente ? paciente.nombre || "Paciente" : "Paciente no encontrado" };
}

async function firmarFotos(supabase: Supabase, rutas: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  const unicas = [...new Set(rutas)];
  if (unicas.length === 0) return urls;

  const { data, error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .createSignedUrls(unicas, VIGENCIA_FOTOS_SEGUNDOS);
  if (error) {
    console.error("[nutri/firmarFotos]", error.message);
    return urls;
  }
  for (const f of data) {
    if (f.path && f.signedUrl && !f.error) urls.set(f.path, f.signedUrl);
  }
  return urls;
}

export default async function PaginaPaciente({ params, searchParams }: Props) {
  const [{ id }, consulta] = await Promise.all([params, searchParams]);
  const paciente = await obtenerPaciente(id);
  if (!paciente) notFound();

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
    .eq("paciente_id", paciente.id)
    .gte("fecha", desde)
    .lte("fecha", sumarDias(hasta, 1))
    .order("fecha")
    .order("hora");
  if (error) throw new Error(`comidas: ${error.message}`);

  const dias = ubicarComidas(comidas, desde, hasta);
  const fotos = await firmarFotos(
    supabase,
    dias.flatMap((d) => d.comidas.flatMap((u) => (u.comida.foto_path ? [u.comida.foto_path] : []))),
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

  const base = `/nutri/pacientes/${paciente.id}`;
  const href = (d: string) => (d === desdeUltimos ? base : `${base}?desde=${d}`);
  const siguiente = sumarDias(desde, 7);
  const nombre = paciente.nombre || "Paciente sin nombre";

  return (
    <div className="flex flex-col gap-6">
      {/* Al imprimir: apaisado, así entra la grilla de 7 columnas. */}
      <style>{"@media print { @page { size: landscape; margin: 12mm; } }"}</style>

      <div className="flex flex-col gap-4">
        <Link
          href="/nutri"
          className={`self-start rounded text-sm font-medium text-tinta-suave hover:text-tinta print:hidden ${ui.foco}`}
        >
          <span aria-hidden="true">←</span> Pacientes
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight break-words">{nombre}</h1>
            <p className="mt-1 text-tinta-suave">Registro del {rangoFechas(desde, hasta)}</p>
          </div>
          <BotonImprimir />
        </div>

        <SelectorSemana
          desde={desde}
          hasta={hasta}
          hrefAnterior={href(sumarDias(desde, -7))}
          hrefSiguiente={desde < desdeUltimos ? href(siguiente < desdeUltimos ? siguiente : desdeUltimos) : null}
          hrefUltimos={desde < desdeUltimos ? base : null}
        />
      </div>

      {resumen.totalRegistros === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-borde bg-superficie px-6 py-12 text-center">
          <p className="font-medium">No hay comidas registradas en estos días</p>
          <p className="mt-1 max-w-md text-sm text-tinta-suave text-pretty">
            Probá con la semana anterior o recordale a {paciente.nombre || "tu paciente"} que cargue
            lo que come.
          </p>
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
