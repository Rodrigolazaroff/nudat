import Link from "next/link";
import { IconoVolver } from "@/components/paciente/iconos";

export function EncabezadoFormulario({ titulo, volverA }: { titulo: string; volverA: string }) {
  return (
    <div className="mb-4 flex items-center gap-1">
      <Link
        href={volverA}
        aria-label="Volver sin guardar"
        className="-ml-3 flex size-12 shrink-0 items-center justify-center rounded-full text-tinta hover:bg-superficie"
      >
        <IconoVolver className="size-6" />
      </Link>
      <h1 className="text-xl font-semibold">{titulo}</h1>
    </div>
  );
}
