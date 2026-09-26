import Link from "next/link";
import { IconoVolver } from "@/components/comidas/iconos";

export function EncabezadoFormulario({ titulo, volverA }: { titulo: string; volverA: string }) {
  return (
    <div className="mb-4 flex items-center gap-1">
      <Link
        href={volverA}
        aria-label="Volver sin guardar"
        className="-ml-3 flex size-12 shrink-0 items-center justify-center rounded-full text-tinta outline-none transition-colors hover:bg-superficie focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario active:bg-borde/60 motion-reduce:transition-none"
      >
        <IconoVolver className="size-6" />
      </Link>
      <h1 className="min-w-0 truncate text-xl font-semibold">{titulo}</h1>
    </div>
  );
}
