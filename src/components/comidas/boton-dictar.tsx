"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { IconoMicrofono } from "@/components/comidas/iconos";
import { vibrar } from "@/components/tacto";

// Web Speech API: Chrome (Android) y Safari (iOS) la exponen con prefijo webkit.
// No está en los tipos de TS, así que se declara lo mínimo que se usa.
type ResultadoVoz = { isFinal: boolean; 0: { transcript: string } };
type EventoResultado = { results: ArrayLike<ResultadoVoz> };
type Reconocedor = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: EventoResultado) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type ConstructorReconocedor = new () => Reconocedor;

function constructorReconocedor(): ConstructorReconocedor | null {
  const w = window as unknown as {
    SpeechRecognition?: ConstructorReconocedor;
    webkitSpeechRecognition?: ConstructorReconocedor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const sinSuscripcion = () => () => {};

const MENSAJES_ERROR: Record<string, string> = {
  "not-allowed": "Permití el micrófono para dictar.",
  "service-not-allowed": "Permití el micrófono para dictar.",
  "audio-capture": "No encontramos un micrófono.",
  network: "Sin conexión para dictar.",
};

function unir(base: string, dictado: string): string {
  const texto = dictado.trim();
  if (!texto) return base;
  if (!base.trim()) return texto.charAt(0).toUpperCase() + texto.slice(1);
  return `${base.trimEnd()} ${texto}`;
}

export function BotonDictar({
  texto,
  onTexto,
  onError,
  className = "",
}: {
  texto: string;
  onTexto: (texto: string) => void;
  onError: (mensaje: string) => void;
  className?: string;
}) {
  const soportado = useSyncExternalStore(
    sinSuscripcion,
    () => constructorReconocedor() !== null,
    () => false,
  );
  const [escuchando, setEscuchando] = useState(false);
  const reconocedor = useRef<Reconocedor | null>(null);

  useEffect(() => () => reconocedor.current?.abort(), []);

  if (!soportado) return null;

  function empezar() {
    const Constructor = constructorReconocedor();
    if (!Constructor) return;
    const base = texto;
    const r = new Constructor();
    r.lang = "es-AR";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let dictado = "";
      for (let i = 0; i < e.results.length; i++) dictado += e.results[i][0].transcript;
      onTexto(unir(base, dictado));
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      onError(MENSAJES_ERROR[e.error] ?? "No se pudo dictar. Probá de nuevo.");
    };
    r.onend = () => {
      setEscuchando(false);
      reconocedor.current = null;
    };
    reconocedor.current = r;
    try {
      r.start();
      setEscuchando(true);
      vibrar(10);
    } catch {
      reconocedor.current = null;
      onError("No se pudo dictar. Probá de nuevo.");
    }
  }

  // Escuchando: se estira a píldora verde con la onda adentro y un halo que late alrededor
  // (el micrófono está abierto). El contenido cambia con un fundido corto, no de golpe.
  return (
    <button
      type="button"
      onClick={() => (escuchando ? reconocedor.current?.stop() : empezar())}
      aria-pressed={escuchando}
      aria-label={escuchando ? "Dejar de dictar" : "Dictar descripción"}
      className={`relative inline-flex h-11 items-center justify-center rounded-full transition-[background-color,width,color,box-shadow,scale] duration-200 ease-premium select-none active:scale-94 motion-reduce:transition-none motion-reduce:active:scale-100 ${
        escuchando
          ? "w-20 bg-primario text-sobre-primario shadow-boton"
          : "w-11 bg-primario-suave text-primario hover:bg-primario hover:text-sobre-primario"
      } ${className}`}
    >
      {escuchando ? (
        <span
          aria-hidden="true"
          className="halo-dictado pointer-events-none absolute inset-0 rounded-full bg-primario"
        />
      ) : null}
      <span key={escuchando ? "onda" : "micro"} className="cambiar relative flex">
        {escuchando ? <Onda /> : <IconoMicrofono className="size-5" />}
      </span>
    </button>
  );
}

// Barras que suben y bajan mientras escucha (decorativo). Duraciones distintas por barra:
// no se sincronizan y se ve como voz, no como un ecualizador.
const BARRAS = [
  { retraso: 0, duracion: 900 },
  { retraso: 180, duracion: 760 },
  { retraso: 60, duracion: 1040 },
  { retraso: 260, duracion: 820 },
  { retraso: 120, duracion: 960 },
];

function Onda() {
  return (
    <span aria-hidden="true" className="flex h-5 items-center gap-[3px]">
      {BARRAS.map(({ retraso, duracion }) => (
        <span
          key={retraso}
          className="onda-barra h-full w-[3px] rounded-full bg-sobre-primario"
          style={{ animationDelay: `${retraso}ms`, animationDuration: `${duracion}ms` }}
        />
      ))}
    </span>
  );
}
