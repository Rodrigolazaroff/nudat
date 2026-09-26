"use client";

import { useMemo, useRef, useState } from "react";
import type { TipoComida } from "@/lib/database.types";
import { TIPOS_COMIDA, etiquetaTipo } from "@/lib/comidas";
import { COMIDAS_PRINCIPALES, esComidaPrincipal } from "@/lib/resumen";
import { conteoDeDia, fechaCorta, fechaLarga, madrugadaDel } from "./formato";
import { Miniatura } from "./miniatura";
import { ui } from "./ui";

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
      {/* Desktop: tabla días × tipos de comida. Al imprimir se usa HojaDias (lista por día). */}
      <div className="hidden overflow-x-auto rounded-2xl border border-borde bg-superficie lg:block print:hidden">
        <table className="w-full table-fixed border-collapse text-sm">
          <caption className="sr-only">
            Comidas registradas por día y tipo. Las celdas vacías son comidas sin registro.
          </caption>
          <colgroup>
            <col className="w-28" />
            {TIPOS_COMIDA.map((t) => (
              <col key={t.valor} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-borde bg-fondo">
              <th scope="col" className="px-3 py-2.5 text-left font-medium text-tinta-suave">
                Día
              </th>
              {TIPOS_COMIDA.map((t) => (
                <th key={t.valor} scope="col" className="px-2 py-2.5 text-left font-medium text-tinta-suave">
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
                  <th scope="row" className="px-3 py-3 text-left align-top font-normal">
                    <span className="block font-medium capitalize">{fechaCorta(dia.fecha)}</span>
                    <span className="block text-xs text-tinta-suave tabular-nums">{conteoDeDia(dia.comidas)}</span>
                    {enCurso ? (
                      <span className="mt-1 inline-block rounded-full bg-primario-suave px-2 py-0.5 text-xs font-medium text-primario">
                        Hoy
                      </span>
                    ) : null}
                  </th>
                  {dia.comidas.length === 0 ? (
                    <td colSpan={TIPOS_COMIDA.length} className="p-2">
                      <div className="flex min-h-20 items-center justify-center rounded-xl border border-dashed border-borde text-tinta-suave">
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

      {/* Celular y tablet: lista por día. */}
      <div className="flex flex-col gap-3 lg:hidden print:hidden">
        {dias.map((dia) => {
          const enCurso = dia.fecha === diaEnCurso;
          const tipos = new Set(dia.comidas.map((c) => c.tipo));
          const faltan =
            dia.comidas.length > 0 && !enCurso
              ? COMIDAS_PRINCIPALES.filter((t) => !tipos.has(t))
              : [];
          return (
            <section key={dia.fecha} className="overflow-hidden rounded-2xl border border-borde bg-superficie">
              <header className="flex items-baseline justify-between gap-3 border-b border-borde px-4 py-3">
                <h3 className="font-medium first-letter:uppercase">
                  {fechaLarga(dia.fecha)}
                  {enCurso ? <span className="font-normal text-tinta-suave"> · hoy</span> : null}
                </h3>
                <span className="shrink-0 text-sm text-tinta-suave tabular-nums">{conteoDeDia(dia.comidas)}</span>
              </header>
              {dia.comidas.length === 0 ? (
                <p className="px-4 py-4 text-sm text-tinta-suave">
                  {enCurso ? "Todavía no cargaste nada hoy." : "No cargaste nada este día."}
                </p>
              ) : (
                <ul className="divide-y divide-borde">
                  {dia.comidas.map((c) => (
                    <li key={c.id}>
                      <FilaComida comida={c} onAbrir={abrir} />
                    </li>
                  ))}
                </ul>
              )}
              {faltan.length > 0 ? (
                <p className="flex items-center gap-2 border-t border-borde px-4 py-3 text-sm text-tinta-suave">
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-acento" />
                  Sin registro: {faltan.map((t) => etiquetaTipo(t).toLowerCase()).join(", ")}
                </p>
              ) : null}
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
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border border-borde bg-superficie p-0 text-tinta shadow-xl backdrop:bg-tinta/60 print:hidden"
      >
        {comida && actual !== null ? (
          <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
            <header className="flex items-start justify-between gap-3 border-b border-borde px-4 py-3">
              <div className="min-w-0">
                <h2 id="detalle-comida-titulo" className="font-semibold">
                  {etiquetaTipo(comida.tipo)}
                </h2>
                <p className="text-sm text-tinta-suave tabular-nums first-letter:uppercase">
                  {fechaLarga(comida.fecha)} · {comida.hora}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dialogo.current?.close()}
                className={`grid size-10 shrink-0 place-items-center rounded-xl text-tinta-suave hover:bg-fondo hover:text-tinta ${ui.foco}`}
              >
                <span className="sr-only">Cerrar</span>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {comida.fotoUrl ? (
                <FotoGrande
                  key={comida.fotoUrl}
                  url={comida.fotoUrl}
                  alt={`Foto: ${etiquetaTipo(comida.tipo).toLowerCase()} del ${fechaLarga(comida.fecha)}`}
                />
              ) : comida.fotoError ? (
                <SinFoto texto="No se pudo cargar la foto. Recargá la página para verla." />
              ) : null}
              <p className="px-4 py-4 whitespace-pre-wrap text-pretty">
                {comida.descripcion.trim() || (
                  <span className="text-tinta-suave">Sin descripción.</span>
                )}
              </p>
            </div>

            {todas.length > 1 ? (
              <footer className="flex items-center justify-between gap-2 border-t border-borde px-4 py-3">
                <button
                  type="button"
                  onClick={() => mover(-1)}
                  disabled={actual === 0}
                  className={ui.botonChico}
                >
                  <span aria-hidden="true">‹</span> Anterior
                </button>
                <span className="text-sm text-tinta-suave tabular-nums">
                  {actual + 1} de {todas.length}
                </span>
                <button
                  type="button"
                  onClick={() => mover(1)}
                  disabled={actual === todas.length - 1}
                  className={ui.botonChico}
                >
                  Siguiente <span aria-hidden="true">›</span>
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
      className={`flex w-full flex-col gap-1.5 rounded-xl border border-borde bg-superficie p-1.5 text-left transition-colors hover:border-primario ${ui.foco}`}
    >
      <span className="sr-only">{etiquetaTipo(c.tipo)}, </span>
      <Miniatura url={c.fotoUrl} error={c.fotoError} className="aspect-[4/3] w-full rounded-lg" />
      <span className="px-1 text-xs font-medium tabular-nums">
        <Hora comida={c} />
      </span>
      {c.descripcion.trim() ? (
        <span className="line-clamp-3 px-1 pb-0.5 text-xs text-tinta-suave">{c.descripcion}</span>
      ) : null}
    </button>
  );
}

function FilaComida({ comida: c, onAbrir }: { comida: ComidaGrilla; onAbrir: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(c.id)}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-fondo focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primario"
    >
      {/* Sin foto no se reserva el recuadro: la fila arranca con el texto. */}
      <Miniatura url={c.fotoUrl} error={c.fotoError} className="size-16 rounded-lg" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-medium">{etiquetaTipo(c.tipo)}</span>
          <span className="shrink-0 text-right text-sm text-tinta-suave tabular-nums">
            <Hora comida={c} />
          </span>
        </span>
        {c.descripcion.trim() ? (
          <span className="mt-0.5 line-clamp-2 text-sm text-tinta-suave">{c.descripcion}</span>
        ) : null}
      </span>
    </button>
  );
}

/** Hora; si fue pasada la medianoche, con la fecha real abajo ("madrugada del mar 23/9"). */
function Hora({ comida }: { comida: ComidaGrilla }) {
  if (!comida.madrugada) return comida.hora;
  return (
    <>
      {comida.hora}
      <span className="block text-xs font-normal text-tinta-suave">{madrugadaDel(comida.fecha)}</span>
    </>
  );
}

function CeldaVacia({ marcar }: { marcar: boolean }) {
  if (marcar) {
    return (
      <div className="flex min-h-16 items-center justify-center gap-1.5 rounded-xl border border-dashed border-borde px-1 text-center text-xs text-tinta-suave">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-acento" />
        Sin registro
      </div>
    );
  }
  return (
    <div className="flex min-h-16 items-center justify-center text-tinta-suave">
      <span aria-hidden="true">–</span>
      <span className="sr-only">Sin registro</span>
    </div>
  );
}

function FotoGrande({ url, alt }: { url: string; alt: string }) {
  const [fallo, setFallo] = useState(false);
  if (fallo) return <SinFoto texto="No se pudo cargar la foto. Recargá la página para verla." />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      onError={() => setFallo(true)}
      className="max-h-[60dvh] w-full bg-fondo object-contain"
    />
  );
}

function SinFoto({ texto }: { texto: string }) {
  return (
    <div className="grid h-40 place-items-center bg-fondo px-4 text-center text-sm text-tinta-suave">
      {texto}
    </div>
  );
}
