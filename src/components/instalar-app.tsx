"use client";

import { useState, useSyncExternalStore } from "react";
import { IconoCerrar } from "@/components/comidas/iconos";
import { Isotipo } from "@/components/logo";

// Tarjeta "Instalar nudat".
// - Chrome/Edge en Android (y escritorio) disparan `beforeinstallprompt` cuando la app
//   es instalable (manifest + HTTPS; desde Chrome 108 no hace falta service worker).
//   Guardamos el evento y lo usamos cuando la persona toca "Instalar".
// - iOS no tiene ese evento: en Safari mostramos cómo agregarla desde Compartir.
// - No se muestra si ya corre instalada, si se instaló recién o si la descartó.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Estado = {
  evento: BeforeInstallPromptEvent | null;
  instalada: boolean;
  iosSafari: boolean;
  descartada: boolean;
};

const CLAVE_DESCARTE = "nudat:instalar-descartado";

// Estado en el servidor y durante la hidratación: no mostrar nada.
const ESTADO_SERVIDOR: Estado = { evento: null, instalada: true, iosSafari: false, descartada: true };

// --- Store a nivel módulo: el evento puede llegar antes de que React monte la tarjeta. ---

let evento: BeforeInstallPromptEvent | null = null;
let recienInstalada = false;
let descartadaEnSesion = false;
let estado: Estado | null = null;
const suscriptores = new Set<() => void>();

function leerDescarte(): boolean {
  if (descartadaEnSesion) return true;
  try {
    return window.localStorage.getItem(CLAVE_DESCARTE) === "1";
  } catch {
    return false;
  }
}

function corriendoInstalada(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari en iOS, instalada desde "Agregar a inicio".
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function esIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  // Chrome, Firefox, Edge, etc. en iOS: el menú es distinto, mejor no dar instrucciones.
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|Instagram|FBAN|FBAV/.test(ua);
}

function calcular(): Estado {
  const nuevo: Estado = {
    evento,
    instalada: recienInstalada || corriendoInstalada(),
    iosSafari: esIosSafari(),
    descartada: leerDescarte(),
  };
  // Misma referencia si nada cambió (lo pide useSyncExternalStore).
  if (
    estado &&
    estado.evento === nuevo.evento &&
    estado.instalada === nuevo.instalada &&
    estado.iosSafari === nuevo.iosSafari &&
    estado.descartada === nuevo.descartada
  ) {
    return estado;
  }
  return nuevo;
}

function avisar() {
  estado = calcular();
  suscriptores.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Evita la mini barra de Chrome: la instalación la ofrece nuestra tarjeta.
    e.preventDefault();
    evento = e as BeforeInstallPromptEvent;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    evento = null;
    recienInstalada = true;
    avisar();
  });
}

function suscribir(fn: () => void) {
  suscriptores.add(fn);
  estado = calcular(); // por si cambió algo desde el último montaje (p. ej. el descarte)
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", avisar);
  return () => {
    suscriptores.delete(fn);
    mq.removeEventListener("change", avisar);
  };
}

function leerEstado(): Estado {
  if (!estado) estado = calcular();
  return estado;
}

function descartar() {
  try {
    window.localStorage.setItem(CLAVE_DESCARTE, "1");
  } catch {
    // Sin storage (modo privado, bloqueado): queda oculta hasta recargar.
  }
  descartadaEnSesion = true;
  avisar();
}

async function instalar() {
  const e = evento;
  if (!e) return;
  // El evento sirve una sola vez; si la persona cancela, Chrome puede volver a dispararlo.
  evento = null;
  try {
    await e.prompt();
    await e.userChoice;
  } finally {
    avisar();
  }
}

// --- UI ---

export function InstalarApp() {
  const { evento: eventoActual, instalada, iosSafari, descartada } = useSyncExternalStore(
    suscribir,
    leerEstado,
    () => ESTADO_SERVIDOR,
  );

  if (instalada || descartada) return null;
  if (!eventoActual && !iosSafari) return null;

  return <Tarjeta conBoton={eventoActual !== null} />;
}

// Al descartar se va con un fundido corto (más rápido que la entrada) y recién ahí se oculta.
function Tarjeta({ conBoton }: { conBoton: boolean }) {
  const [saliendo, setSaliendo] = useState(false);

  function alDescartar() {
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSaliendo(true);
    window.setTimeout(descartar, reducido ? 0 : 150);
  }

  return (
    <section
      aria-labelledby="instalar-app-titulo"
      // Aparece recién después de hidratar: entra con un fundido corto en vez de "saltar".
      className={`bisel relative mt-5 transition-[opacity,translate,scale] ease-premium starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none ${
        saliendo ? "pointer-events-none scale-[0.97] opacity-0 duration-150" : "duration-300"
      }`}
    >
      <div className="bisel-nucleo p-4">
        <div className="flex items-center gap-3.5 pr-10">
          <Isotipo className="size-12 shrink-0 drop-shadow-[0_6px_10px_rgb(23_54_40/0.25)]" />
          <div className="min-w-0">
            <h2 id="instalar-app-titulo" className="font-display text-lg font-bold tracking-tight">
              Instalar nudat
            </h2>
            {conBoton ? null : (
              <p className="mt-0.5 text-sm text-pretty text-tinta-suave">
                Tocá Compartir y después “Agregar a inicio”.
              </p>
            )}
          </div>
        </div>

        {conBoton ? (
          <button type="button" onClick={instalar} className="boton boton-primario foco mt-4 w-full">
            Instalar app
          </button>
        ) : null}

        <button
          type="button"
          onClick={alDescartar}
          aria-label="No mostrar más"
          title="No mostrar más"
          className="foco absolute top-3 right-3 flex size-11 items-center justify-center rounded-full text-tinta-suave transition-[background-color,color,scale] duration-150 ease-premium hover:bg-hundido hover:text-tinta active:scale-94 active:bg-hundido motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <IconoCerrar className="size-5" />
        </button>
      </div>
    </section>
  );
}
