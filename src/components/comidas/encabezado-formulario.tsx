import Link from "next/link";
import { IconoVolver } from "@/components/comidas/iconos";

// Encabezado de los formularios: volver (círculo con bisel) + título display en la misma
// fila. En una sola línea deja más alto libre para el formulario sobre la isla de Guardar.
export function EncabezadoFormulario({ titulo, volverA }: { titulo: string; volverA: string }) {
  return (
    <div className="entrar mb-5 flex items-center gap-3">
      <Link href={volverA} aria-label="Volver sin guardar" className="boton-circulo foco">
        <IconoVolver className="size-5" />
      </Link>
      <h1 className="titulo-pantalla min-w-0 text-[clamp(1.875rem,8.5vw,2.5rem)] text-balance">
        {titulo}
      </h1>
    </div>
  );
}
