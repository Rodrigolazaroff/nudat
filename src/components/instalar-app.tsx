"use client";

import { useSyncExternalStore } from "react";
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

const foco =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario";

export function InstalarApp() {
  const { evento: eventoActual, instalada, iosSafari, descartada } = useSyncExternalStore(
    suscribir,
    leerEstado,
    () => ESTADO_SERVIDOR,
  );

  if (instalada || descartada) return null;
  if (!eventoActual && !iosSafari) return null;

  return (
    <section
      aria-labelledby="instalar-app-titulo"
      // Aparece recién después de hidratar: entra con un fundido corto en vez de "saltar".
      className="relative mt-4 rounded-2xl border border-borde bg-superficie p-4 transition-opacity duration-200 ease-out starting:opacity-0 motion-reduce:transition-none"
    >
      <div className="flex items-start gap-3 pr-10">
        <Isotipo className="size-12 shrink-0" />
        <div className="min-w-0">
          <h2 id="instalar-app-titulo" className="font-medium">
            Instalar nudat
          </h2>
          <p className="mt-0.5 text-sm text-pretty text-tinta-suave">
            {eventoActual
              ? "Agregala a tu pantalla de inicio para cargar más rápido."
              : "Tocá Compartir y después “Agregar a inicio” para tenerla a mano."}
          </p>
        </div>
      </div>

      {eventoActual ? (
        <button
          type="button"
          onClick={instalar}
          className={`mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primario px-5 font-medium text-sobre-primario transition-colors hover:bg-primario-hover active:bg-primario-hover ${foco}`}
        >
          Instalar app
        </button>
      ) : null}

      <button
        type="button"
        onClick={descartar}
        aria-label="No mostrar más"
        title="No mostrar más"
        className={`absolute top-2 right-2 flex size-11 items-center justify-center rounded-full text-tinta-suave transition-colors hover:bg-fondo hover:text-tinta active:bg-borde/60 ${foco}`}
      >
        <IconoCerrar className="size-5" />
      </button>
    </section>
  );
}
