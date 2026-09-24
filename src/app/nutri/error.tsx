"use client";

import { useEffect } from "react";
import { ui } from "@/components/nutri/ui";

export default function ErrorNutri({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold">No pudimos cargar esta pantalla</h1>
      <p className="text-tinta-suave text-pretty">
        Puede ser un problema de conexión. Probá de nuevo en unos segundos.
      </p>
      <button type="button" onClick={() => retry()} className={ui.botonPrimario}>
        Reintentar
      </button>
    </div>
  );
}
