"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import type { TipoComida } from "@/lib/database.types";
import { TIPOS_COMIDA, etiquetaTipo } from "@/lib/comidas";
import { COMIDAS_PRINCIPALES, esComidaPrincipal } from "@/lib/resumen";
import {
  IconoCerrar,
  IconoDerecha,
  IconoIzquierda,
  IconoLuna,
  IconoPlato,
  IconoVaso,
} from "@/components/comidas/iconos";
import { conteoDeDia, fechaCorta, fechaLarga, madrugadaDel } from "./formato";
import { Miniatura } from "./miniatura";

export type ComidaGrilla = {
  id: string;
  tipo: TipoComida;
  /** Fecha real en que se comió (puede ser el día siguiente si fue de madrugada). */
  fecha: string;
  /** "HH:MM" */
  hora: string;
  descripcion: string;
  /** URL firmada, o null si no tiene foto o no se pudo firmar. */
  fotoUrl: string | null;
  /** Tiene foto pero no se pudo generar la URL. */
  fotoError: boolean;
  /** Se comió pasada la medianoche y cuenta para el día anterior. */
  madrugada: boolean;
};

/** Un día alimentario, con sus comidas ordenadas por horario. */
export type DiaGrilla = { fecha: string; comidas: ComidaGrilla[] };

// La grilla entra después del resumen (escalones 0-4 en page.tsx y resumen-semana.tsx).
const escalon = (i: number) => ({ "--i": Math.min(i + 5, 10) }) as CSSProperties;

// Foco para filas dentro de un bloque: el anillo va adentro para que no lo recorte el borde.
const focoInterno =
  "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primario";

export function GrillaSemana({
  dias,
  diaEnCurso,
}: {
  dias: DiaGrilla[];
  diaEnCurso: string | null;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const presionEnFondo = useRef(false);
  const todas = useMemo(() => dias.flatMap((d) => d.comidas), [dias]);
  const [actual, setActual] = useState<number | null>(null);
  const comida = actual === null ? undefined : todas[actual];

  function abrir(id: string) {
    const i = todas.findIndex((c) => c.id === id);
    if (i < 0) return;
    setActual(i);
    if (!dialogo.current?.open) dialogo.current?.showModal();
  }

  function mover(delta: number) {
    setActual((i) => (i === null ? i : Math.min(Math.max(i + delta, 0), todas.length - 1)));
  }

  return (
    <>
      {/* Compu: tabla días × tipos de comida. Al imprimir se usa HojaDias (lista por día). */}
      <div className="bisel entrar hidden lg:block print:hidden" style={escalon(0)}>
        <div className="bisel-nucleo overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <caption className="sr-only">
                Comidas registradas por día y tipo. Las celdas vacías son comidas sin registro.
              </caption>
              <colgroup>
                <col className="w-32" />
                {TIPOS_COMIDA.map((t) => (
                  <col key={t.valor} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-borde bg-hundido/50">
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-tinta-suave">
                    Día
                  </th>
                  {TIPOS_COMIDA.map((t) => (
                    <th key={t.valor} scope="col" className="px-2 py-3 text-left font-semibold text-tinta-suave">
                      {t.etiqueta}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dias.map((dia) => {
                  const enCurso = dia.fecha === diaEnCurso;
                  return (
                    <tr key={dia.fecha} className="border-b border-borde align-top last:border-b-0">
                      <th scope="row" className="px-4 py-3.5 text-left align-top font-normal">
                        <span className="block font-display text-base font-bold tracking-tight capitalize">
                          {fechaCorta(dia.fecha)}
                        </span>
                        <span className="mt-0.5 block text-xs text-tinta-suave tabular-nums">
                          {conteoDeDia(dia.comidas)}
                        </span>
                        {enCurso ? <span className="pastilla mt-2">Hoy</span> : null}
                      </th>
                      {dia.comidas.length === 0 ? (
                        <td colSpan={TIPOS_COMIDA.length} className="p-2">
                          <div className="flex min-h-20 items-center justify-center rounded-2xl bg-hundido/60 text-tinta-suave">
                            {enCurso ? "Todavía no cargaste nada hoy." : "No cargaste nada este día."}
                          </div>
                        </td>
                      ) : (
                        TIPOS_COMIDA.map((t) => {
                          const deTipo = dia.comidas.filter((c) => c.tipo === t.valor);
                          return (
                            <td key={t.valor} className="p-2 align-top">
                              {deTipo.length > 0 ? (
                                <ul className="flex flex-col gap-2">
                                  {deTipo.map((c) => (
                                    <li key={c.id}>
                                      <TarjetaComida comida={c} onAbrir={abrir} />
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <CeldaVacia marcar={esComidaPrincipal(t.valor) && !enCurso} />
                              )}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Celular y tablet: un bloque por día. */}
      <div className="flex flex-col gap-3 lg:hidden print:hidden">
        {dias.map((dia, i) => {
          const enCurso = dia.fecha === diaEnCurso;
          const tipos = new Set(dia.comidas.map((c) => c.tipo));
          const faltan =
            dia.comidas.length > 0 && !enCurso
              ? COMIDAS_PRINCIPALES.filter((t) => !tipos.has(t))
              : [];
          return (
            <section key={dia.fecha} className="bisel entrar" style={escalon(i)}>
              <div className="bisel-nucleo">
                <header className="px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="min-w-0 font-display text-lg leading-tight font-bold tracking-tight first-letter:uppercase">
                      {fechaLarga(dia.fecha)}
                    </h3>
                    {enCurso ? <span className="pastilla shrink-0">Hoy</span> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-tinta-suave tabular-nums">{conteoDeDia(dia.comidas)}</p>
                </header>
                {dia.comidas.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-tinta-suave">
                    {enCurso ? "Todavía no cargaste nada hoy." : "No cargaste nada este día."}
                  </p>
                ) : (
                  <ul className="flex flex-col px-1.5 pb-1.5">
                    {dia.comidas.map((c) => (
                      <li key={c.id}>
                        <FilaComida comida={c} onAbrir={abrir} />
                      </li>
                    ))}
                  </ul>
                )}
                {faltan.length > 0 ? (
                  <p className="mx-4 flex items-center gap-2 border-t border-borde py-3 text-sm text-tinta-suave">
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-acento" />
                    Sin registro: {faltan.map((t) => etiquetaTipo(t).toLowerCase()).join(", ")}
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      <dialog
        ref={dialogo}
        aria-labelledby="detalle-comida-titulo"
        onClose={() => setActual(null)}
        onPointerDown={(e) => {
          presionEnFondo.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          // Click en el fondo oscuro: el target es el propio <dialog>. Se exige que también
          // haya empezado ahí, para no cerrar al arrastrar una selección de texto hacia afuera.
          if (presionEnFondo.current && e.target === e.currentTarget) e.currentTarget.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            mover(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            mover(-1);
          }
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-caja bg-superficie p-0 text-tinta shadow-flotante ring-1 ring-tinta/5 backdrop:bg-tinta/50 backdrop:backdrop-blur-sm modal print:hidden"
      >
        {comida && actual !== null ? (
          <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
            <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
              <div className="min-w-0">
                <h2 id="detalle-comida-titulo" className="font-display text-xl font-bold tracking-tight">
                  {etiquetaTipo(comida.tipo)}
                </h2>
                <p className="mt-0.5 text-sm font-medium text-tinta-suave tabular-nums first-letter:uppercase">
                  {fechaLarga(comida.fecha)} · {comida.hora}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dialogo.current?.close()}
                aria-label="Cerrar"
                className="boton-circulo foco"
              >
                <IconoCerrar className="size-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {comida.fotoUrl || comida.fotoError ? (
                <div className="px-3">
                  {comida.fotoUrl ? (
                    <FotoGrande
                      key={comida.fotoUrl}
                      url={comida.fotoUrl}
                      alt={`Foto: ${etiquetaTipo(comida.tipo).toLowerCase()} del ${fechaLarga(comida.fecha)}`}
                    />
                  ) : (
                    <SinFoto texto="No se pudo cargar la foto. Recargá la página para verla." />
                  )}
                </div>
              ) : null}
              <p className="px-5 py-4 whitespace-pre-wrap text-pretty">
                {comida.descripcion.trim() || (
                  <span className="text-tinta-suave">Sin descripción.</span>
                )}
              </p>
            </div>

            {todas.length > 1 ? (
              <footer className="flex items-center justify-between gap-2 border-t border-borde px-2 py-2">
                <button
                  type="button"
                  onClick={() => mover(-1)}
                  disabled={actual === 0}
                  className="boton boton-fantasma foco min-h-11 gap-1 px-3 text-sm disabled:opacity-40"
                >
                  <IconoIzquierda className="size-4" />
                  Anterior
                </button>
                <span className="text-sm text-tinta-suave tabular-nums">
                  {actual + 1} de {todas.length}
                </span>
                <button
                  type="button"
                  onClick={() => mover(1)}
                  disabled={actual === todas.length - 1}
                  className="boton boton-fantasma foco min-h-11 gap-1 px-3 text-sm disabled:opacity-40"
                >
                  Siguiente
                  <IconoDerecha className="size-4" />
                </button>
              </footer>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}

function TarjetaComida({ comida: c, onAbrir }: { comida: ComidaGrilla; onAbrir: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(c.id)}
      className="foco flex w-full flex-col gap-1.5 rounded-2xl bg-superficie p-1.5 text-left ring-1 ring-borde transition-[box-shadow,scale] duration-150 ease-premium hover:shadow-suave hover:ring-primario/30 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <span className="sr-only">{etiquetaTipo(c.tipo)}, </span>
      <Miniatura url={c.fotoUrl} error={c.fotoError} className="aspect-[4/3] w-full rounded-xl" />
      <span className="px-1 font-display text-sm font-bold tracking-tight tabular-nums">
        <Hora comida={c} />
      </span>
      {c.descripcion.trim() ? (
        <span className="line-clamp-3 px-1 pb-0.5 text-xs leading-snug text-tinta-suave">{c.descripcion}</span>
      ) : null}
    </button>
  );
}

function FilaComida({ comida: c, onAbrir }: { comida: ComidaGrilla; onAbrir: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(c.id)}
      className={`flex min-h-14 w-full items-start gap-3 rounded-[calc(var(--radio-nucleo)-0.375rem)] px-2.5 py-2.5 text-left transition-[background-color,scale] duration-150 ease-premium select-none hover:bg-hundido/60 active:scale-[0.98] active:bg-hundido/60 motion-reduce:transition-none motion-reduce:active:scale-100 ${focoInterno}`}
    >
      {/* Sin foto, el mismo ícono de tipo que en Hoy: plato verde o vaso naranja. */}
      {c.fotoUrl || c.fotoError ? (
        <Miniatura url={c.fotoUrl} error={c.fotoError} className="size-16 rounded-xl" />
      ) : (
        <IconoTipo tipo={c.tipo} />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-semibold tracking-tight">{etiquetaTipo(c.tipo)}</span>
          <span className="shrink-0 text-right font-display font-bold tracking-tight tabular-nums">
            <Hora comida={c} />
          </span>
        </span>
        {c.descripcion.trim() ? (
          <span className="mt-0.5 line-clamp-2 text-sm leading-snug text-tinta-suave">{c.descripcion}</span>
        ) : null}
      </span>
    </button>
  );
}

function IconoTipo({ tipo }: { tipo: TipoComida }) {
  const esBebida = tipo === "bebida";
  return (
    <span
      aria-hidden="true"
      className={`flex size-16 shrink-0 items-center justify-center rounded-xl ${
        esBebida ? "bg-acento-suave text-acento-tinta" : "bg-primario-suave text-primario"
      }`}
    >
      {esBebida ? <IconoVaso className="size-7" /> : <IconoPlato className="size-7" />}
    </span>
  );
}

/** Hora; si fue pasada la medianoche, con la fecha real abajo ("madrugada del mar 23/9"). */
function Hora({ comida }: { comida: ComidaGrilla }) {
  if (!comida.madrugada) return comida.hora;
  return (
    <>
      {comida.hora}
      <span className="mt-0.5 block font-sans text-xs font-medium tracking-normal text-tinta-suave">
        <IconoLuna className="mr-1 inline size-3.5 align-[-2px]" />
        {madrugadaDel(comida.fecha)}
      </span>
    </>
  );
}

function CeldaVacia({ marcar }: { marcar: boolean }) {
  if (marcar) {
    return (
      <div className="flex min-h-16 items-center justify-center gap-1.5 rounded-2xl bg-hundido/60 px-1 text-center text-xs font-medium text-tinta-suave">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-acento" />
        Sin registro
      </div>
    );
  }
  return (
    <div className="flex min-h-16 items-center justify-center">
      <span aria-hidden="true" className="h-px w-3 bg-borde" />
      <span className="sr-only">Sin registro</span>
    </div>
  );
}

// La foto aparece con un fundido cuando termina de bajar (no a pedazos sobre el gris).
function FotoGrande({ url, alt }: { url: string; alt: string }) {
  const [fallo, setFallo] = useState(false);
  const [cargada, setCargada] = useState(false);
  if (fallo) return <SinFoto texto="No se pudo cargar la foto. Recargá la página para verla." />;
  return (
    <div className="rounded-2xl bg-hundido">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={(el) => {
          // Ya estaba en caché: onLoad puede haber pasado antes de engancharse.
          if (el?.complete && el.naturalWidth > 0) setCargada(true);
        }}
        src={url}
        alt={alt}
        onLoad={() => setCargada(true)}
        onError={() => setFallo(true)}
        className={`max-h-[60dvh] w-full rounded-2xl object-contain transition-opacity duration-200 ease-premium motion-reduce:transition-none ${
          cargada ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

function SinFoto({ texto }: { texto: string }) {
  return (
    <div className="grid h-40 place-items-center rounded-2xl bg-hundido px-4 text-center text-sm text-tinta-suave">
      {texto}
    </div>
  );
}
