"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconoImprimir } from "@/components/comidas/iconos";

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

export function BotonImprimir({
  firmadoEn,
  variante = "primario",
}: {
  firmadoEn: number;
  /** Primario salvo cuando la pantalla tiene otra acción principal (semana vacía). */
  variante?: "primario" | "secundario";
}) {
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
      className={`boton boton-${variante} foco group min-h-13 pr-1.5 pl-5 disabled:opacity-70 print:hidden`}
    >
      {ocupado ? "Preparando fotos" : "Imprimir"}
      <span aria-hidden="true" className="boton-icono">
        <IconoImprimir className="size-5" />
      </span>
    </button>
  );
}
