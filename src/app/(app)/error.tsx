"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorApp({
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
    <div className="entrar mx-auto mt-6 w-full max-w-lg px-4">
      <div className="bisel">
        <div className="bisel-nucleo flex flex-col items-center px-6 py-10 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-balance">
            Algo no salió bien
          </h1>
          <p className="mt-2 max-w-xs text-tinta-suave text-pretty">
            Revisá la conexión y probá de nuevo.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="boton boton-primario foco mt-8 w-full max-w-xs"
          >
            Reintentar
          </button>
          <Link href="/" className="boton boton-fantasma foco mt-2 w-full max-w-xs">
            Ir a hoy
          </Link>
        </div>
      </div>
    </div>
  );
}
