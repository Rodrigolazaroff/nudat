"use client";

import { useLinkStatus } from "next/link";

// Aparece con 100ms de espera: si la pantalla llega enseguida, no parpadea.
const ESPERA = "opacity-100 delay-100 duration-200";

// Ruedita dentro de un <Link> mientras navega. Siempre ocupa lugar (sin saltos).
export function IndicadorLink({ className = "" }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`size-3 shrink-0 rounded-full border-2 border-current border-t-transparent transition-opacity ease-premium ${
        pending ? `girar ${ESPERA}` : "opacity-0 duration-150"
      } ${className}`}
    />
  );
}

// Para un .boton-circulo (con `relative`): un aro verde que gira alrededor mientras navega.
// Con movimiento reducido gira más lento (globals.css, .girar).
export function IndicadorCirculo() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -inset-1 rounded-full border-2 border-primario border-t-transparent transition-opacity ease-premium ${
        pending ? `girar ${ESPERA}` : "opacity-0 duration-150"
      }`}
    />
  );
}
