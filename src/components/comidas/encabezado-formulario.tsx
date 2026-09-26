import Link from "next/link";
import { IconoVolver } from "@/components/comidas/iconos";

// Encabezado de los formularios: volver (círculo con bisel) + título grande en display.
export function EncabezadoFormulario({ titulo, volverA }: { titulo: string; volverA: string }) {
  return (
    <div className="entrar mb-6 flex flex-col items-start gap-4">
      <Link href={volverA} aria-label="Volver sin guardar" className="boton-circulo foco">
        <IconoVolver className="size-5" />
      </Link>
      <h1 className="titulo-pantalla min-w-0 text-[clamp(2.25rem,10vw,2.75rem)] text-balance">
        {titulo}
      </h1>
    </div>
  );
}
