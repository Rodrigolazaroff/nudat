import type { Metadata } from "next";
import type { CSSProperties } from "react";
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
  IconoVolver,
} from "@/components/comidas/iconos";

export const metadata: Metadata = { title: "Hoy" };

/** "3 comidas", "2 bebidas": una pastilla por grupo (solo los que hay). */
function conteo(tipos: string[]) {
  const bebidas = tipos.filter((t) => t === "bebida").length;
  const comidas = tipos.length - bebidas;
  return {
    comidas: comidas > 0 ? `${comidas} ${comidas === 1 ? "comida" : "comidas"}` : null,
    bebidas: bebidas > 0 ? `${bebidas} ${bebidas === 1 ? "bebida" : "bebidas"}` : null,
  };
}

const escalon = (i: number) => ({ "--i": i }) as CSSProperties;

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

  const { comidas: textoComidas, bebidas: textoBebidas } = conteo(comidas.map((c) => c.tipo));

  return (
    <div className="pb-24">
      {/* ── Día: título grande a la izquierda, flechas a la derecha ── */}
      <div className="entrar flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="titulo-pantalla text-[clamp(2.5rem,12vw,3.5rem)]">
            {nombreDia(fecha, hoy)}
          </h1>
          <p className="mt-2 truncate font-medium text-tinta-suave first-letter:uppercase">
            {fechaLarga(fecha, hoy)}
          </p>
        </div>

        <div className="flex shrink-0 gap-2 pt-1">
          <Link
            href={`/?fecha=${anterior}`}
            aria-label={`Ver ${nombreDia(anterior, hoy).toLowerCase()}`}
            className="boton-circulo foco"
          >
            <IconoIzquierda className="size-5" />
          </Link>
          {esHoy ? (
            <span aria-hidden="true" className="boton-circulo text-tinta-suave opacity-40 shadow-none">
              <IconoDerecha className="size-5" />
            </span>
          ) : (
            <Link
              href={`/?fecha=${siguiente}`}
              aria-label={`Ver ${nombreDia(siguiente, hoy).toLowerCase()}`}
              className="boton-circulo foco"
            >
              <IconoDerecha className="size-5" />
            </Link>
          )}
        </div>
      </div>

      {/* ── Conteo del día + volver a hoy ── */}
      {(comidas.length > 0 || !esHoy) && (
        <div className="entrar mt-5 flex flex-wrap items-center gap-2" style={escalon(1)}>
          {textoComidas ? <span className="pastilla">{textoComidas}</span> : null}
          {textoBebidas ? (
            <span className="pastilla bg-acento-suave text-acento-tinta">{textoBebidas}</span>
          ) : null}
          {!esHoy && (
            <Link
              href="/"
              className="foco ml-auto inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-primario transition-colors duration-300 ease-premium hover:bg-primario-suave"
            >
              <IconoVolver className="size-4" />
              Volver a hoy
            </Link>
          )}
        </div>
      )}

      <InstalarApp />

      {comidas.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-3">
          {comidas.map((comida, i) => (
            <li key={comida.id} className="entrar" style={escalon(Math.min(i + 2, 8))}>
              <TarjetaComida
                comida={comida}
                fotoUrl={comida.foto_path ? (urls.get(comida.foto_path) ?? null) : null}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="bisel entrar mt-6" style={escalon(2)}>
          <div className="bisel-nucleo flex flex-col items-center px-6 py-10 text-center">
            <div className="flex size-18 items-center justify-center rounded-full bg-primario-suave text-primario shadow-[inset_0_0_0_6px_var(--superficie),0_0_0_1px_var(--borde)]">
              <IconoPlato className="size-8" />
            </div>
            <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-balance">
              {esHoy ? "Todavía no cargaste nada hoy" : "No hay nada cargado este día"}
            </h2>
          </div>
        </div>
      )}

      {/* Botón fijo, apoyado sobre la barra de navegación flotante (4rem + 0.75rem + zona
          segura). El degradé cubre también detrás de la barra para que el contenido se funda. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-linear-to-t from-fondo from-50% via-fondo/85 to-transparent px-4 pt-10 pb-[calc(5.5rem_+_env(safe-area-inset-bottom))] print:hidden">
        <Link
          href={`/nueva?fecha=${fecha}`}
          className="boton boton-primario foco group pointer-events-auto mx-auto flex h-15 w-full max-w-[calc(32rem_-_2rem)] justify-between pr-2.5 pl-6 text-[1.0625rem]"
        >
          Agregar comida o bebida
          <span aria-hidden="true" className="boton-icono">
            <IconoMas className="size-5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
