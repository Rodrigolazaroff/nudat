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
    <div className="mt-10 flex flex-col items-center px-4 text-center">
      <h1 className="text-xl font-semibold">Algo no salió bien</h1>
      <p className="mt-2 max-w-xs text-sm text-tinta-suave">
        No pudimos cargar esta pantalla. Revisá la conexión y probá de nuevo.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 h-12 w-full max-w-xs rounded-xl bg-primario px-5 font-medium text-sobre-primario hover:bg-primario-hover disabled:opacity-50"
      >
        Reintentar
      </button>
      <Link href="/" className="mt-2 inline-flex h-12 items-center px-3 text-sm font-medium text-primario">
        Ir a hoy
      </Link>
    </div>
  );
}
