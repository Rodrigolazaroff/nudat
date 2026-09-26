"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Foto chica de un registro (URL firmada de Supabase, sin el optimizador de Next).
 * Si la URL no se pudo firmar o la imagen falla (p. ej. venció la firma), muestra
 * "Foto no disponible" en el mismo lugar. Sin foto, no muestra nada.
 */
export function Miniatura({
  url,
  error,
  className,
  eager = false,
}: {
  url: string | null;
  /** Tiene foto pero no se pudo firmar la URL. */
  error: boolean;
  /** Tamaño y forma; se aplica igual a la foto y al aviso. */
  className: string;
  /** Para lo que se imprime: una imagen lazy dentro de algo oculto nunca se descarga. */
  eager?: boolean;
}) {
  const img = useRef<HTMLImageElement>(null);
  // Se guarda qué URL falló: si la página se refresca y llega una firma nueva, se reintenta.
  const [falloEn, setFalloEn] = useState<string | null>(null);

  // Si la imagen falló antes de hidratar, onError no llega a correr.
  useEffect(() => {
    const el = img.current;
    if (url && el && el.complete && el.naturalWidth === 0) setFalloEn(url);
  }, [url]);

  if (!url && !error) return null;

  if (!url || falloEn === url) {
    return (
      <span
        className={`${className} grid shrink-0 place-items-center bg-hundido px-1 text-center text-[11px] leading-tight font-medium text-tinta-suave print:border print:border-dashed print:border-tinta-suave print:bg-transparent`}
      >
        Foto no disponible
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={img}
      src={url}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFalloEn(url)}
      className={`${className} shrink-0 bg-hundido object-cover print:bg-transparent`}
    />
  );
}
