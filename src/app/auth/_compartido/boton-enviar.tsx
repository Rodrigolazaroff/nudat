"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { IconoAvanzar } from "@/components/comidas/iconos";
import { clases } from "./ui";

// Botón primario de submit con estado de carga. Tiene que ir adentro del <form>.
// Flecha anidada en su propio círculo (a la derecha) y un hueco igual a la izquierda
// para que el texto quede centrado.
export function BotonEnviar({
  children,
  pendiente,
}: {
  children: ReactNode;
  pendiente: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${clases.botonPrimario} group justify-between px-2`}
    >
      <span aria-hidden="true" className="size-10 shrink-0" />
      <span className="flex items-center gap-2">
        {pending ? (
          <>
            <span
              aria-hidden
              className="girar size-4 rounded-full border-2 border-current border-r-transparent"
            />
            {pendiente}
          </>
        ) : (
          children
        )}
      </span>
      <span aria-hidden="true" className="boton-icono">
        <IconoAvanzar className="size-5" />
      </span>
    </button>
  );
}
