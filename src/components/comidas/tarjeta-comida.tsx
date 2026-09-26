import Link from "next/link";
import type { Comida } from "@/lib/database.types";
import { etiquetaTipo } from "@/lib/comidas";
import { HORA_CORTE_DIA, minutosDeHora } from "@/lib/resumen";
import { IconoDerecha, IconoLuna, IconoPlato, IconoVaso } from "@/components/comidas/iconos";

type Props = {
  comida: Pick<Comida, "id" | "hora" | "tipo" | "descripcion" | "foto_path">;
  fotoUrl: string | null;
};

// Tarjeta de un registro en Hoy: bisel doble (bandeja + núcleo), foto o ícono del tipo,
// tipo y hora arriba (la hora en display), descripción abajo.
export function TarjetaComida({ comida, fotoUrl }: Props) {
  const tipo = etiquetaTipo(comida.tipo);
  const esBebida = comida.tipo === "bebida";
  const hora = comida.hora.slice(0, 5);
  const descripcion = comida.descripcion.trim();
  // Antes de las 05:00: en el resumen y en la semana cuenta para el día anterior.
  const minutos = minutosDeHora(comida.hora);
  const deMadrugada = minutos !== null && minutos < HORA_CORTE_DIA * 60;

  return (
    <Link
      href={`/comida/${comida.id}`}
      className="bisel foco group block transition-[scale] duration-150 ease-premium select-none active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <div className="bisel-nucleo flex items-center gap-4 p-2.5 pr-3 transition-shadow duration-200 ease-premium group-hover:shadow-flotante">
        {fotoUrl ? (
          // URL firmada de Supabase: <img> simple (next/image necesitaría remotePatterns).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-20 shrink-0 rounded-xl bg-hundido object-cover"
          />
        ) : (
          <div
            className={`flex size-20 shrink-0 items-center justify-center rounded-xl ${
              esBebida ? "bg-acento-suave text-acento-tinta" : "bg-primario-suave text-primario"
            }`}
          >
            {esBebida ? <IconoVaso className="size-8" /> : <IconoPlato className="size-8" />}
          </div>
        )}

        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-semibold tracking-tight">{tipo}</span>
            <span className="shrink-0 font-display text-lg leading-none font-bold tracking-tight tabular-nums">
              {hora}
            </span>
          </div>
          {deMadrugada ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-tinta-suave">
              <IconoLuna className="size-3.5" />
              Cuenta para el día anterior
            </p>
          ) : null}
          {descripcion ? (
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-tinta-suave">{descripcion}</p>
          ) : (
            <p className="mt-1 text-sm text-tinta-suave italic">Sin descripción</p>
          )}
        </div>

        <IconoDerecha className="size-5 shrink-0 text-tinta-suave/50 transition-transform duration-200 ease-premium group-hover:translate-x-0.5 motion-reduce:transition-none" />
      </div>
    </Link>
  );
}
