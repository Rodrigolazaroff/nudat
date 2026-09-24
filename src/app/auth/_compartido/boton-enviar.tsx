"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { clases } from "./ui";

// Botón primario de submit con estado de carga. Tiene que ir adentro del <form>.
export function BotonEnviar({
  children,
  pendiente,
}: {
  children: ReactNode;
  pendiente: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={clases.botonPrimario}>
      {pending ? (
        <>
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
          />
          {pendiente}
        </>
      ) : (
        children
      )}
    </button>
  );
}
