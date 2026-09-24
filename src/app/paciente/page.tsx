import type { Metadata } from "next";
import Link from "next/link";
import { exigirRol } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/comidas";
import { fechaDeParam, fechaLarga, nombreDia, sumarDias } from "@/components/paciente/fechas";
import { firmarFotos } from "@/components/paciente/firmar-fotos";
import { TarjetaComida } from "@/components/paciente/tarjeta-comida";
import {
  IconoDerecha,
  IconoIzquierda,
  IconoMas,
  IconoPlato,
} from "@/components/paciente/iconos";

export const metadata: Metadata = { title: "Mis comidas · nudat" };

const botonDia =
  "flex size-12 shrink-0 items-center justify-center rounded-full border border-borde bg-superficie text-tinta";

export default async function PaginaHoy({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const perfil = await exigirRol("paciente");
  const hoy = hoyISO();
  const fecha = fechaDeParam((await searchParams).fecha, hoy);
  const esHoy = fecha === hoy;

  const supabase = await createClient();
  const { data: comidas, error } = await supabase
    .from("comidas")
    .select("id, hora, tipo, descripcion, foto_path")
    .eq("paciente_id", perfil.id)
    .eq("fecha", fecha)
    .order("hora")
    .order("created_at");
  if (error) throw new Error(`No se pudieron cargar las comidas: ${error.message}`);

  const urls = await firmarFotos(
    supabase,
    comidas.map((c) => c.foto_path),
  );

  const anterior = sumarDias(fecha, -1);
  const siguiente = sumarDias(fecha, 1);

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/paciente?fecha=${anterior}`}
          aria-label={`Ver ${nombreDia(anterior, hoy).toLowerCase()}`}
          className={`${botonDia} hover:border-primario/40`}
        >
          <IconoIzquierda className="size-5" />
        </Link>

        <div className="min-w-0 text-center">
          <h1 className="text-xl font-semibold">{nombreDia(fecha, hoy)}</h1>
          <p className="truncate text-sm text-tinta-suave">{fechaLarga(fecha, hoy)}</p>
        </div>

        {esHoy ? (
          <span aria-hidden="true" className={`${botonDia} opacity-40`}>
            <IconoDerecha className="size-5" />
          </span>
        ) : (
          <Link
            href={`/paciente?fecha=${siguiente}`}
            aria-label={`Ver ${nombreDia(siguiente, hoy).toLowerCase()}`}
            className={`${botonDia} hover:border-primario/40`}
          >
            <IconoDerecha className="size-5" />
          </Link>
        )}
      </div>

      {!esHoy && (
        <div className="mt-2 text-center">
          <Link
            href="/paciente"
            className="inline-flex h-12 items-center px-3 text-sm font-medium text-primario"
          >
            Volver a hoy
          </Link>
        </div>
      )}

      {comidas.length > 0 ? (
        <>
          <p className="mt-5 mb-2 text-sm text-tinta-suave">
            {comidas.length === 1 ? "1 comida cargada" : `${comidas.length} comidas cargadas`}
          </p>
          <ul className="flex flex-col gap-3">
            {comidas.map((comida) => (
              <li key={comida.id}>
                <TarjetaComida
                  comida={comida}
                  fotoUrl={comida.foto_path ? (urls.get(comida.foto_path) ?? null) : null}
                />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-8 flex flex-col items-center px-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primario-suave text-primario">
            <IconoPlato className="size-8" />
          </div>
          <h2 className="mt-4 font-medium">
            {esHoy ? "Todavía no cargaste comidas hoy" : "No hay comidas cargadas este día"}
          </h2>
          <p className="mt-1 max-w-xs text-sm text-tinta-suave">
            {esHoy
              ? "Sacale una foto al plato antes de empezar: cargarla te lleva unos segundos."
              : "Si te olvidaste de alguna, podés agregarla ahora."}
          </p>
        </div>
      )}

      {/* Botón fijo arriba de la barra de navegación. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem_+_env(safe-area-inset-bottom))] z-20 bg-linear-to-t from-fondo via-fondo/90 to-transparent pt-4 pb-3">
        <div className="mx-auto max-w-lg px-4">
          <Link
            href={`/paciente/nueva?fecha=${fecha}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primario px-5 font-medium text-sobre-primario shadow-sm hover:bg-primario-hover"
          >
            <IconoMas className="size-5" />
            Agregar comida
          </Link>
        </div>
      </div>
    </div>
  );
}
