import type { Metadata } from "next";
import Link from "next/link";
import { obtenerPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/comidas";
import { fechaDeParam, fechaLarga, nombreDia, sumarDias } from "@/components/comidas/fechas";
import { firmarFotos } from "@/components/comidas/firmar-fotos";
import { TarjetaComida } from "@/components/comidas/tarjeta-comida";
import { InstalarApp } from "@/components/instalar-app";
import {
  IconoDerecha,
  IconoIzquierda,
  IconoMas,
  IconoPlato,
} from "@/components/comidas/iconos";

export const metadata: Metadata = { title: "Hoy" };

// Foco de teclado visible y consistente (el mismo anillo que la tarjeta de instalar).
const foco =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario";

const botonDia = `flex size-12 shrink-0 items-center justify-center rounded-full border border-borde bg-superficie text-tinta transition-colors ${foco}`;

/** "1 comida" · "3 comidas y 2 bebidas" · "1 bebida". */
function conteo(tipos: string[]): string {
  const bebidas = tipos.filter((t) => t === "bebida").length;
  const comidas = tipos.length - bebidas;
  const partes = [
    comidas > 0 ? `${comidas} ${comidas === 1 ? "comida" : "comidas"}` : null,
    bebidas > 0 ? `${bebidas} ${bebidas === 1 ? "bebida" : "bebidas"}` : null,
  ].filter(Boolean);
  return partes.join(" y ");
}

export default async function PaginaHoy({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const perfil = await obtenerPerfil();
  const hoy = hoyISO();
  const fecha = fechaDeParam((await searchParams).fecha, hoy);
  const esHoy = fecha === hoy;

  const supabase = await createClient();
  const { data: comidas, error } = await supabase
    .from("comidas")
    .select("id, hora, tipo, descripcion, foto_path")
    .eq("usuario_id", perfil.id)
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
          href={`/?fecha=${anterior}`}
          aria-label={`Ver ${nombreDia(anterior, hoy).toLowerCase()}`}
          className={`${botonDia} hover:border-primario/40 active:bg-primario-suave`}
        >
          <IconoIzquierda className="size-5" />
        </Link>

        <div className="min-w-0 text-center">
          <h1 className="text-xl font-semibold text-balance">{nombreDia(fecha, hoy)}</h1>
          <p className="truncate text-sm text-tinta-suave">{fechaLarga(fecha, hoy)}</p>
        </div>

        {esHoy ? (
          <span aria-hidden="true" className={`${botonDia} text-tinta-suave opacity-40`}>
            <IconoDerecha className="size-5" />
          </span>
        ) : (
          <Link
            href={`/?fecha=${siguiente}`}
            aria-label={`Ver ${nombreDia(siguiente, hoy).toLowerCase()}`}
            className={`${botonDia} hover:border-primario/40 active:bg-primario-suave`}
          >
            <IconoDerecha className="size-5" />
          </Link>
        )}
      </div>

      {!esHoy && (
        <div className="mt-2 text-center">
          <Link
            href="/"
            className={`inline-flex h-12 items-center rounded-xl px-3 text-sm font-medium text-primario underline-offset-4 hover:underline ${foco}`}
          >
            Volver a hoy
          </Link>
        </div>
      )}

      <InstalarApp />

      {comidas.length > 0 ? (
        <>
          <p className="mt-5 mb-2 text-sm text-tinta-suave">
            {conteo(comidas.map((c) => c.tipo))}
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
          <h2 className="mt-4 font-medium text-balance">
            {esHoy ? "Todavía no cargaste nada hoy" : "No hay nada cargado este día"}
          </h2>
          <p className="mt-1 max-w-xs text-sm text-pretty text-tinta-suave">
            {esHoy
              ? "Sacale una foto al plato antes de empezar y anotá también lo que tomás. Cargarlo te lleva unos segundos."
              : "Si te olvidaste de algo, podés agregarlo ahora con la fecha de este día."}
          </p>
        </div>
      )}

      {/* Botón fijo arriba de la barra de navegación. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem_+_env(safe-area-inset-bottom))] z-20 bg-linear-to-t from-fondo via-fondo/90 to-transparent pt-4 pb-3">
        <div className="mx-auto max-w-lg px-4">
          <Link
            href={`/nueva?fecha=${fecha}`}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primario px-5 font-medium text-sobre-primario shadow-sm transition-[background-color,scale] duration-150 ease-out hover:bg-primario-hover active:scale-[0.98] active:bg-primario-hover motion-reduce:transition-none motion-reduce:active:scale-100 ${foco}`}
          >
            <IconoMas className="size-5" />
            Agregar comida o bebida
          </Link>
        </div>
      </div>
    </div>
  );
}
