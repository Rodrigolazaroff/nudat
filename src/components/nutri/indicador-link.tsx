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
