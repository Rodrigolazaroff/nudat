"use client";

import { useLinkStatus } from "next/link";

// Ruedita dentro de un <Link> mientras navega. Siempre ocupa lugar (sin saltos).
export function IndicadorLink() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`size-3 shrink-0 rounded-full border-2 border-current border-t-transparent transition-opacity ${
        pending ? "animate-spin opacity-100" : "opacity-0"
      }`}
    />
  );
}

// Para un .boton-circulo (con `relative`): un aro verde que gira alrededor mientras navega.
// Con movimiento reducido queda quieto, pero se sigue viendo.
export function IndicadorCirculo() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -inset-1 rounded-full border-2 border-primario border-t-transparent transition-opacity duration-300 ease-premium motion-reduce:animate-none ${
        pending ? "animate-spin opacity-100" : "opacity-0"
      }`}
    />
  );
}
