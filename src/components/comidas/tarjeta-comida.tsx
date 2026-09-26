import Link from "next/link";
import type { Comida } from "@/lib/database.types";
import { etiquetaTipo } from "@/lib/comidas";
import { IconoDerecha, IconoPlato } from "@/components/comidas/iconos";

type Props = {
  comida: Pick<Comida, "id" | "hora" | "tipo" | "descripcion" | "foto_path">;
  fotoUrl: string | null;
};

export function TarjetaComida({ comida, fotoUrl }: Props) {
  const tipo = etiquetaTipo(comida.tipo);
  const hora = comida.hora.slice(0, 5);
  const descripcion = comida.descripcion.trim();

  return (
    <Link
      href={`/comida/${comida.id}`}
      className="flex items-center gap-3 rounded-2xl border border-borde bg-superficie p-4 outline-none transition-colors hover:border-primario/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario active:bg-fondo motion-reduce:transition-none"
    >
      {fotoUrl ? (
        // URL firmada de Supabase: <img> simple (next/image necesitaría remotePatterns).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-18 shrink-0 rounded-xl bg-fondo object-cover"
        />
      ) : (
        <div className="flex size-18 shrink-0 items-center justify-center rounded-xl bg-primario-suave text-primario">
          <IconoPlato className="size-7" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium">{tipo}</span>
          <span className="shrink-0 text-sm tabular-nums text-tinta-suave">{hora}</span>
        </div>
        {descripcion ? (
          <p className="mt-0.5 line-clamp-2 text-sm text-tinta-suave">{descripcion}</p>
        ) : (
          <p className="mt-0.5 text-sm text-tinta-suave italic">Sin descripción</p>
        )}
      </div>

      <IconoDerecha className="size-5 shrink-0 text-tinta-suave/60" />
    </Link>
  );
}
