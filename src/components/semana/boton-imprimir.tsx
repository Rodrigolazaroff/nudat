"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ui } from "./ui";

// Las URL firmadas de las fotos duran 1 hora (firmar-fotos.ts). Pasados 50 minutos se
// piden de nuevo al server antes de imprimir, así no salen rotas en la hoja.
const VIGENCIA_MS = 50 * 60 * 1000;
// Cuánto se espera como máximo a que carguen las fotos antes de abrir el diálogo.
const ESPERA_FOTOS_MS = 8000;

function vigente(firmadoEn: number) {
  return Date.now() - firmadoEn < VIGENCIA_MS;
}

/** Espera a que terminen de cargar (o fallen) las fotos de la hoja impresa. */
function esperarFotos(): Promise<void> {
  const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("#hoja-dias img"));
  const cargas = imgs.map((img) =>
    img.complete
      ? Promise.resolve()
      : new Promise<void>((listo) => {
          img.addEventListener("load", () => listo(), { once: true });
          img.addEventListener("error", () => listo(), { once: true });
        }),
  );
  return Promise.race([
    Promise.all(cargas).then(() => undefined),
    new Promise<void>((listo) => setTimeout(listo, ESPERA_FOTOS_MS)),
  ]);
}

export function BotonImprimir({ firmadoEn }: { firmadoEn: number }) {
  const router = useRouter();
  const [refrescando, startTransition] = useTransition();
  const [preparando, setPreparando] = useState(false);
  // Imprimir cuando llegue la página con firmas nuevas.
  const imprimirAlRefrescar = useRef(false);

  // Si la pestaña queda abierta mucho tiempo, se renuevan las firmas solas (también cubre
  // imprimir con Ctrl+P sin pasar por el botón).
  useEffect(() => {
    function renovarSiVencio() {
      if (document.visibilityState === "visible" && !vigente(firmadoEn)) {
        startTransition(() => router.refresh());
      }
    }
    const faltan = Math.max(0, firmadoEn + VIGENCIA_MS - Date.now());
    const timer = window.setTimeout(renovarSiVencio, faltan);
    document.addEventListener("visibilitychange", renovarSiVencio);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", renovarSiVencio);
    };
  }, [firmadoEn, router]);

  // Terminó el refresco pedido desde el botón: se imprime con lo que haya (si el refresco
  // falló, las fotos vencidas muestran "Foto no disponible" en vez de salir en blanco).
  useEffect(() => {
    if (!imprimirAlRefrescar.current || refrescando) return;
    imprimirAlRefrescar.current = false;
    esperarFotos().then(() => {
      setPreparando(false);
      window.print();
    });
  }, [refrescando]);

  function imprimir() {
    setPreparando(true);
    if (vigente(firmadoEn)) {
      esperarFotos().then(() => {
        setPreparando(false);
        window.print();
      });
      return;
    }
    imprimirAlRefrescar.current = true;
    startTransition(() => router.refresh());
  }

  const ocupado = preparando || refrescando;

  return (
    <button
      type="button"
      onClick={imprimir}
      disabled={ocupado}
      aria-busy={ocupado}
      className={`${ui.botonSecundario} print:hidden`}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5">
        <path
          fillRule="evenodd"
          d="M5 2.75A.75.75 0 0 1 5.75 2h8.5a.75.75 0 0 1 .75.75V6h.25A2.75 2.75 0 0 1 18 8.75v4.5A1.75 1.75 0 0 1 16.25 15H15v2.25a.75.75 0 0 1-.75.75h-8.5a.75.75 0 0 1-.75-.75V15H3.75A1.75 1.75 0 0 1 2 13.25v-4.5A2.75 2.75 0 0 1 4.75 6H5V2.75ZM13.5 6V3.5h-7V6h7Zm-7 7.5v3h7v-3h-7Z"
          clipRule="evenodd"
        />
      </svg>
      {ocupado ? "Preparando fotos" : "Imprimir"}
    </button>
  );
}
