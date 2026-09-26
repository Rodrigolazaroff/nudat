"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { TipoComida } from "@/lib/database.types";
import { BUCKET_FOTOS, TIPOS_COMIDA, sugerirTipo } from "@/lib/comidas";
import { comprimirImagen, leerFechaFoto, rutaFoto, type FechaHora } from "@/lib/fotos";
import { diaYMes, esFechaValida, nombreDia, sumarDias } from "@/components/comidas/fechas";
import {
  IconoCamara,
  IconoCerrar,
  IconoGaleria,
  IconoReloj,
} from "@/components/comidas/iconos";

// ─── Estado de fecha / hora / tipo ────────────────────────────────────────────
// Van juntos en un reducer porque se afectan entre sí: la foto puede traer fecha y hora,
// y el tipo se re-sugiere con cada hora nueva mientras la persona no lo elija a mano.

type Cuando = {
  fecha: string;
  hora: string;
  tipo: TipoComida;
  tipoElegido: boolean; // la persona tocó un chip: no lo pisamos más
  antesDeLaFoto: { fecha: string; hora: string } | null; // no null = se usó la fecha de la foto
};

type Accion =
  | { accion: "fecha"; valor: string }
  | { accion: "hora"; valor: string }
  | { accion: "tipo"; valor: TipoComida }
  | { accion: "fechaDeFoto"; tomada: FechaHora | null }
  | { accion: "deshacerFechaDeFoto" };

const RE_HORA = /^\d{2}:\d{2}/;

function conHora(s: Cuando, hora: string): Cuando {
  const tipo = !s.tipoElegido && RE_HORA.test(hora) ? sugerirTipo(hora) : s.tipo;
  return { ...s, hora, tipo };
}

function deshacer(s: Cuando): Cuando {
  if (!s.antesDeLaFoto) return s;
  const { fecha, hora } = s.antesDeLaFoto;
  return conHora({ ...s, fecha, antesDeLaFoto: null }, hora);
}

function reducir(s: Cuando, a: Accion): Cuando {
  switch (a.accion) {
    case "fecha":
      return { ...s, fecha: a.valor, antesDeLaFoto: null };
    case "hora":
      return conHora({ ...s, antesDeLaFoto: null }, a.valor);
    case "tipo":
      return { ...s, tipo: a.valor, tipoElegido: true };
    case "fechaDeFoto":
      if (a.tomada) {
        // Si ya habíamos usado la fecha de otra foto, "deshacer" vuelve a lo de antes de ambas.
        const antes = s.antesDeLaFoto ?? { fecha: s.fecha, hora: s.hora };
        return conHora({ ...s, fecha: a.tomada.fecha, antesDeLaFoto: antes }, a.tomada.hora);
      }
      // Esta foto no trae fecha: si la anterior había puesto la suya, la sacamos.
      return deshacer(s);
    case "deshacerFechaDeFoto":
      return deshacer(s);
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

type Foto =
  | { origen: "guardada"; path: string; url: string | null }
  | { origen: "nueva"; blob: Blob; url: string };

type Fase = "editando" | "subiendo" | "guardando" | "eliminando" | "listo";

export type FormularioComidaProps = {
  usuarioId: string;
  hoy: string;
  valores: { fecha: string; hora: string; tipo: TipoComida | null; descripcion: string };
  /** Solo al editar. */
  comida?: { id: string; fotoPath: string | null; fotoUrl: string | null };
};

class ErrorVisible extends Error {}

const MENSAJE_GUARDAR = "No pudimos guardar el registro. Revisá la conexión y probá de nuevo.";

const claseInput =
  "h-12 w-full rounded-xl border border-borde bg-superficie px-4 text-base outline-none placeholder:text-tinta-suave focus:border-primario focus:ring-2 focus:ring-primario/20";

// Foco de teclado visible y consistente en botones (el mismo anillo en toda la app).
const foco =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario";

// Respuesta al toque en los botones grandes: se hunden apenas. Sin movimiento si se pide.
const presion =
  "transition-[background-color,border-color,scale] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

export function FormularioComida({ usuarioId, hoy, valores, comida }: FormularioComidaProps) {
  const router = useRouter();
  const [navegando, startTransition] = useTransition();

  const [cuando, despachar] = useReducer(reducir, null, (): Cuando => ({
    fecha: valores.fecha,
    hora: valores.hora,
    tipo: valores.tipo ?? sugerirTipo(valores.hora),
    tipoElegido: valores.tipo !== null,
    antesDeLaFoto: null,
  }));
  const [descripcion, setDescripcion] = useState(valores.descripcion);
  const [foto, setFoto] = useState<Foto | null>(
    comida?.fotoPath ? { origen: "guardada", path: comida.fotoPath, url: comida.fotoUrl } : null,
  );
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [fase, setFase] = useState<Fase>("editando");
  const [error, setError] = useState<string | null>(null);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  const inputCamara = useRef<HTMLInputElement>(null);
  const inputGaleria = useRef<HTMLInputElement>(null);
  const botonCancelarBorrado = useRef<HTMLButtonElement>(null);
  const botonEliminar = useRef<HTMLButtonElement>(null);
  const volverFocoAEliminar = useRef(false); // al cancelar, el foco vuelve a "Eliminar registro"
  const ultimaFotoPedida = useRef(0); // si elige otra foto mientras procesamos la anterior
  const enviando = useRef(false); // evita doble envío por doble toque

  const ocupado = fase !== "editando" || navegando;

  // Liberar el object URL de la vista previa cuando se reemplaza o se sale de la pantalla.
  const urlVistaPrevia = foto?.origen === "nueva" ? foto.url : null;
  useEffect(() => {
    if (!urlVistaPrevia) return;
    return () => URL.revokeObjectURL(urlVistaPrevia);
  }, [urlVistaPrevia]);

  useEffect(() => {
    if (confirmandoBorrado) {
      botonCancelarBorrado.current?.focus();
    } else if (volverFocoAEliminar.current) {
      volverFocoAEliminar.current = false;
      botonEliminar.current?.focus();
    }
  }, [confirmandoBorrado]);

  function cancelarBorrado() {
    volverFocoAEliminar.current = true;
    setConfirmandoBorrado(false);
  }

  async function alElegirFoto(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;

    const pedido = ++ultimaFotoPedida.current;
    setError(null);
    setProcesandoFoto(true);
    try {
      // Primero el EXIF, sobre el archivo original: el JPEG recomprimido ya no lo trae.
      const tomada = await leerFechaFoto(archivo);
      const blob = await comprimirImagen(archivo);
      if (pedido !== ultimaFotoPedida.current) return;
      setFoto({ origen: "nueva", blob, url: URL.createObjectURL(blob) });
      despachar({
        accion: "fechaDeFoto",
        // Un reloj de cámara mal configurado puede dar fechas futuras: esas no se usan.
        tomada: tomada && tomada.fecha <= hoy ? tomada : null,
      });
    } catch (err) {
      if (pedido !== ultimaFotoPedida.current) return;
      console.error(err);
      setError("No pudimos abrir esa foto. Probá con otra o sacala de nuevo.");
    } finally {
      if (pedido === ultimaFotoPedida.current) setProcesandoFoto(false);
    }
  }

  function quitarFoto() {
    setFoto(null);
    setError(null);
    // La fecha que puso esta foto se va con ella.
    despachar({ accion: "deshacerFechaDeFoto" });
  }

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando.current || procesandoFoto) return;

    const desc = descripcion.trim();
    const { fecha, hora, tipo } = cuando;
    if (!foto && !desc) return setError("Agregá una foto o escribí qué comiste.");
    if (!esFechaValida(fecha)) return setError("Revisá la fecha.");
    if (fecha > hoy) return setError("La fecha no puede ser posterior a hoy.");
    if (!RE_HORA.test(hora)) return setError("Revisá la hora.");
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return setError("Estás sin conexión. Conectate y probá de nuevo.");
    }

    enviando.current = true;
    setError(null);
    const supabase = createClient();
    let fotoSubida: string | null = null;

    try {
      if (foto?.origen === "nueva") {
        setFase("subiendo");
        const path = rutaFoto(usuarioId);
        const { error: errorSubida } = await supabase.storage
          .from(BUCKET_FOTOS)
          .upload(path, foto.blob, { contentType: "image/jpeg", upsert: false });
        if (errorSubida) {
          console.error(errorSubida);
          throw new ErrorVisible("No pudimos subir la foto. Revisá la conexión y probá de nuevo.");
        }
        fotoSubida = path;
      }

      setFase("guardando");
      const fotoPath = !foto ? null : foto.origen === "guardada" ? foto.path : fotoSubida;
      // usuario_id no se manda: lo pone la base (default auth.uid()).
      const datos = { fecha, hora, tipo, descripcion: desc, foto_path: fotoPath };

      if (comida) {
        const { data, error: errorDb } = await supabase
          .from("comidas")
          .update(datos)
          .eq("id", comida.id)
          .select("id");
        if (errorDb) throw errorDeBase(errorDb);
        if (data.length === 0) {
          throw new ErrorVisible("No encontramos este registro. Puede que ya lo hayas eliminado.");
        }
        // Ya no la usa nadie: se reemplazó o se quitó.
        if (comida.fotoPath && comida.fotoPath !== fotoPath) {
          await borrarFoto(supabase, comida.fotoPath);
        }
      } else {
        const { error: errorDb } = await supabase.from("comidas").insert(datos);
        if (errorDb) throw errorDeBase(errorDb);
      }

      setFase("listo");
      startTransition(() => router.replace(`/?fecha=${fecha}`));
    } catch (err) {
      // La comida no se guardó: que la foto recién subida no quede huérfana.
      if (fotoSubida) await borrarFoto(supabase, fotoSubida);
      if (!(err instanceof ErrorVisible)) console.error(err);
      setError(err instanceof ErrorVisible ? err.message : MENSAJE_GUARDAR);
      setFase("editando");
      enviando.current = false;
    }
  }

  async function eliminar() {
    if (!comida || enviando.current) return;
    enviando.current = true;
    setError(null);
    setFase("eliminando");

    const supabase = createClient();
    const { data, error: errorDb } = await supabase
      .from("comidas")
      .delete()
      .eq("id", comida.id)
      .select("id");
    if (errorDb) {
      console.error(errorDb);
      setError("No pudimos eliminar el registro. Revisá la conexión y probá de nuevo.");
      setFase("editando");
      enviando.current = false;
      return;
    }
    // Primero la fila y después el archivo: nunca queda una comida apuntando a una foto borrada.
    if (data.length > 0 && comida.fotoPath) await borrarFoto(supabase, comida.fotoPath);

    setFase("listo");
    startTransition(() => router.replace(`/?fecha=${valores.fecha}`));
  }

  const guardandoAhora =
    fase === "subiendo" || fase === "guardando" || (fase === "listo" && !confirmandoBorrado);
  const textoBoton =
    fase === "subiendo"
      ? "Subiendo foto…"
      : guardandoAhora
        ? "Guardando…"
        : procesandoFoto
          ? "Esperando la foto…"
          : comida
            ? "Guardar cambios"
            : cuando.tipo === "bebida"
              ? "Guardar bebida"
              : "Guardar comida";

  return (
    <>
      <form onSubmit={guardar} noValidate aria-busy={ocupado}>
        <fieldset disabled={ocupado} className="flex min-w-0 flex-col gap-6">
          {/* ── Foto ── */}
          <section aria-label="Foto del plato">
            <input
              ref={inputCamara}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              tabIndex={-1}
              onChange={alElegirFoto}
            />
            <input
              ref={inputGaleria}
              type="file"
              accept="image/*"
              className="hidden"
              tabIndex={-1}
              onChange={alElegirFoto}
            />

            {procesandoFoto ? (
              <div
                role="status"
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-borde bg-superficie text-sm text-tinta-suave"
              >
                <span
                  aria-hidden="true"
                  className="size-6 animate-spin rounded-full border-2 border-primario border-t-transparent"
                />
                Preparando la foto…
              </div>
            ) : foto ? (
              <div className="relative">
                {foto.url ? (
                  // Vista previa local (blob:) o URL firmada: <img> simple, sin next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={foto.url}
                    alt="Foto del plato"
                    className="aspect-[4/3] w-full rounded-2xl bg-superficie object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-borde bg-superficie px-6 text-center text-sm text-tinta-suave">
                    No pudimos mostrar la foto, pero está guardada.
                  </div>
                )}
                <button
                  type="button"
                  onClick={quitarFoto}
                  aria-label="Quitar foto"
                  className={`absolute top-2 right-2 flex size-12 items-center justify-center rounded-full bg-tinta/70 text-sobre-primario backdrop-blur hover:bg-tinta/85 active:bg-tinta/90 ${foco}`}
                >
                  <IconoCerrar className="size-5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => inputCamara.current?.click()}
                  className={`flex h-32 flex-col items-center justify-center gap-2 rounded-2xl bg-primario px-3 font-medium text-sobre-primario hover:bg-primario-hover active:bg-primario-hover ${presion} ${foco}`}
                >
                  <IconoCamara className="size-8" />
                  Sacar foto
                </button>
                <button
                  type="button"
                  onClick={() => inputGaleria.current?.click()}
                  className={`flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-borde bg-superficie px-3 text-center font-medium text-tinta hover:border-primario/40 active:border-primario/60 ${presion} ${foco}`}
                >
                  <IconoGaleria className="size-8 text-primario" />
                  Elegir de la galería
                </button>
              </div>
            )}

            {cuando.antesDeLaFoto && (
              <div
                role="status"
                className="mt-3 flex items-center gap-3 rounded-xl bg-primario-suave py-1 pr-1 pl-4 text-sm text-primario transition-opacity duration-200 ease-out starting:opacity-0 motion-reduce:transition-none"
              >
                <IconoReloj className="size-5 shrink-0" />
                <p className="flex-1 py-2">
                  Usamos la fecha y hora de la foto: {cuandoLegible(cuando.fecha, cuando.hora, hoy)}.
                </p>
                <button
                  type="button"
                  onClick={() => despachar({ accion: "deshacerFechaDeFoto" })}
                  className={`h-12 shrink-0 rounded-lg px-3 font-medium underline underline-offset-2 hover:bg-primario/10 ${foco}`}
                >
                  Deshacer
                </button>
              </div>
            )}
          </section>

          {/* ── Tipo ── */}
          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-medium">Tipo</legend>
            <div className="flex flex-wrap gap-x-2 gap-y-3">
              {TIPOS_COMIDA.map(({ valor, etiqueta }) => {
                const elegido = cuando.tipo === valor;
                return (
                  <label
                    key={valor}
                    // El ::after agranda el área táctil a 48 px sin cambiar el chip.
                    // Elegido: borde doble (ring interno) además del color, sin cambiar el ancho.
                    className={`relative cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors select-none after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[''] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primario motion-reduce:transition-none ${
                      elegido
                        ? "border-primario bg-primario-suave text-primario ring-1 ring-primario ring-inset"
                        : "border-borde bg-superficie text-tinta hover:border-primario/40 active:bg-primario-suave"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={valor}
                      checked={elegido}
                      onChange={() => despachar({ accion: "tipo", valor })}
                      className="sr-only"
                    />
                    {etiqueta}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* ── Fecha y hora ── */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block min-w-0">
              <span className="mb-1.5 block text-sm font-medium">Fecha</span>
              <input
                type="date"
                required
                max={hoy}
                value={cuando.fecha}
                onChange={(e) => {
                  setError(null);
                  despachar({ accion: "fecha", valor: e.target.value });
                }}
                className={`${claseInput} min-w-0 appearance-none [&::-webkit-date-and-time-value]:text-left`}
              />
            </label>
            <label className="block min-w-0">
              <span className="mb-1.5 block text-sm font-medium">Hora</span>
              <input
                type="time"
                required
                value={cuando.hora}
                onChange={(e) => {
                  setError(null);
                  despachar({ accion: "hora", valor: e.target.value });
                }}
                className={`${claseInput} min-w-0 appearance-none [&::-webkit-date-and-time-value]:text-left`}
              />
            </label>
          </div>

          {/* ── Descripción ── */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Descripción{" "}
              {foto && <span className="font-normal text-tinta-suave">(opcional)</span>}
            </span>
            <textarea
              rows={3}
              maxLength={2000}
              value={descripcion}
              onChange={(e) => {
                setError(null);
                setDescripcion(e.target.value);
              }}
              autoCapitalize="sentences"
              placeholder={
                cuando.tipo === "bebida"
                  ? "¿Qué tomaste? Ej: 1 vaso de agua, café con leche, 2 cervezas"
                  : "¿Qué comiste? Ej: 2 tostadas con queso y café con leche"
              }
              className="block min-h-24 w-full resize-y rounded-xl border border-borde bg-superficie px-4 py-3 text-base outline-none placeholder:text-tinta-suave focus:border-primario focus:ring-2 focus:ring-primario/20"
            />
          </label>
        </fieldset>

        {/* ── Guardar (siempre a mano) ── */}
        <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-borde bg-fondo/95 px-4 pt-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] backdrop-blur">
          {error && (
            <p role="alert" className="mb-3 rounded-xl bg-peligro-suave px-4 py-3 text-sm text-peligro">
              {error}
            </p>
          )}
          {/* Mientras guarda no se "apaga": sigue sólido y con spinner, para que se lea como progreso. */}
          <button
            type="submit"
            disabled={ocupado || procesandoFoto}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primario px-5 font-medium text-sobre-primario hover:bg-primario-hover disabled:cursor-default ${
              guardandoAhora ? "" : "active:bg-primario-hover disabled:opacity-50"
            } ${presion} ${foco}`}
          >
            {guardandoAhora && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-sobre-primario border-t-transparent"
              />
            )}
            {textoBoton}
          </button>
        </div>
      </form>

      {comida && (
        <div className="mt-2 pb-[calc(1.5rem_+_env(safe-area-inset-bottom))]">
          {confirmandoBorrado ? (
            <div
              role="group"
              aria-labelledby="confirmar-borrado"
              onKeyDown={(e) => {
                if (e.key === "Escape" && !ocupado) cancelarBorrado();
              }}
              className="rounded-2xl border border-peligro/25 bg-peligro-suave p-4"
            >
              <p id="confirmar-borrado" className="font-medium text-peligro">
                ¿Eliminar este registro?
              </p>
              <p className="mt-1 text-sm text-tinta">
                {comida.fotoPath ? "Se borra también la foto. " : ""}No se puede deshacer.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  ref={botonCancelarBorrado}
                  type="button"
                  onClick={cancelarBorrado}
                  disabled={ocupado}
                  className={`h-12 rounded-xl border border-borde bg-superficie px-4 font-medium hover:border-tinta-suave/40 disabled:opacity-50 ${presion} ${foco}`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={eliminar}
                  disabled={ocupado}
                  className={`h-12 rounded-xl bg-peligro px-4 font-medium text-sobre-primario outline-none hover:bg-peligro/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peligro disabled:opacity-70 ${presion}`}
                >
                  {fase === "eliminando" || fase === "listo" ? "Eliminando…" : "Eliminar registro"}
                </button>
              </div>
            </div>
          ) : (
            <button
              ref={botonEliminar}
              type="button"
              onClick={() => setConfirmandoBorrado(true)}
              disabled={ocupado}
              className="h-12 w-full rounded-xl px-4 font-medium text-peligro outline-none transition-colors hover:bg-peligro-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peligro active:bg-peligro-suave disabled:opacity-50 motion-reduce:transition-none"
            >
              Eliminar registro
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ─── Auxiliares ───────────────────────────────────────────────────────────────

type ClienteNavegador = ReturnType<typeof createClient>;

/** Borrado "de mejor esfuerzo": si falla queda un archivo huérfano, pero no frenamos a la persona. */
async function borrarFoto(supabase: ClienteNavegador, path: string) {
  try {
    const { error } = await supabase.storage.from(BUCKET_FOTOS).remove([path]);
    if (error) console.error("No se pudo borrar la foto", path, error.message);
  } catch (err) {
    console.error("No se pudo borrar la foto", path, err);
  }
}

function errorDeBase(error: PostgrestError): ErrorVisible {
  console.error(error);
  if (error.code === "23514") return new ErrorVisible("Agregá una foto o escribí qué comiste.");
  if (error.code === "42501") {
    return new ErrorVisible("Tu sesión no tiene permiso para guardar. Salí y volvé a entrar.");
  }
  return new ErrorVisible(MENSAJE_GUARDAR);
}

/** "hoy, 13:05" · "ayer, 21:30" · "lunes, 08:10" · "3 de septiembre, 12:00". */
function cuandoLegible(fecha: string, hora: string, hoy: string): string {
  const dia =
    fecha >= sumarDias(hoy, -6) ? nombreDia(fecha, hoy).toLowerCase() : diaYMes(fecha);
  return `${dia}, ${hora}`;
}
