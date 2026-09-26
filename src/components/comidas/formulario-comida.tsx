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
import { BotonDictar } from "@/components/comidas/boton-dictar";
import {
  IconoCamara,
  IconoCerrar,
  IconoGaleria,
  IconoListo,
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

// Clases del sistema (globals.css / DESIGN.md): .campo, .boton, .chip, .bisel, .foco.
// Fecha y hora: el valor nativo alineado a la izquierda, sin el estilo del navegador.
const claseFechaHora =
  "campo min-w-0 appearance-none [&::-webkit-date-and-time-value]:text-left";

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
              <div role="status" className="bisel">
                <div className="bisel-nucleo flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 text-sm font-medium text-tinta-suave">
                  <span
                    aria-hidden="true"
                    className="size-6 animate-spin rounded-full border-2 border-primario border-t-transparent motion-reduce:animate-none"
                  />
                  Preparando la foto…
                </div>
              </div>
            ) : foto ? (
              <div className="bisel relative">
                {foto.url ? (
                  // Vista previa local (blob:) o URL firmada: <img> simple, sin next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={foto.url}
                    alt="Foto del plato"
                    className="aspect-[4/3] w-full rounded-nucleo bg-hundido object-cover shadow-suave"
                  />
                ) : (
                  <div className="bisel-nucleo flex aspect-[4/3] w-full items-center justify-center px-6 text-center text-sm text-tinta-suave">
                    No pudimos mostrar la foto, pero está guardada.
                  </div>
                )}
                <button
                  type="button"
                  onClick={quitarFoto}
                  aria-label="Quitar foto"
                  className="foco absolute top-3.5 right-3.5 flex size-12 items-center justify-center rounded-full bg-tinta/65 text-sobre-primario shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] transition-[background-color,transform] duration-300 ease-premium hover:bg-tinta/80 active:scale-95 motion-reduce:transition-none"
                >
                  <IconoCerrar className="size-5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => inputCamara.current?.click()}
                  className="boton boton-primario foco h-40 flex-col gap-3 rounded-caja px-3"
                >
                  <span className="flex size-14 items-center justify-center rounded-full bg-white/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]">
                    <IconoCamara className="size-7" />
                  </span>
                  Sacar foto
                </button>
                <button
                  type="button"
                  onClick={() => inputGaleria.current?.click()}
                  className="boton boton-secundario foco h-40 flex-col gap-3 rounded-caja px-3 text-center"
                >
                  <span className="flex size-14 items-center justify-center rounded-full bg-primario-suave text-primario">
                    <IconoGaleria className="size-7" />
                  </span>
                  Elegir de la galería
                </button>
              </div>
            )}

            {cuando.antesDeLaFoto && (
              <div
                role="status"
                className="mt-3 flex items-center gap-3 rounded-2xl bg-primario-suave py-1 pr-1 pl-4 text-sm font-medium text-primario transition-opacity duration-300 ease-premium starting:opacity-0 motion-reduce:transition-none"
              >
                <IconoReloj className="size-5 shrink-0" />
                <p className="flex-1 py-2">
                  Usamos la fecha y hora de la foto: {cuandoLegible(cuando.fecha, cuando.hora, hoy)}.
                </p>
                <button
                  type="button"
                  onClick={() => despachar({ accion: "deshacerFechaDeFoto" })}
                  className="foco h-12 shrink-0 rounded-xl px-3 font-semibold underline underline-offset-2 transition-colors duration-300 ease-premium hover:bg-primario/10"
                >
                  Deshacer
                </button>
              </div>
            )}
          </section>

          {/* ── Tipo ── */}
          <fieldset className="min-w-0">
            <legend className="etiqueta mb-3">Tipo</legend>
            <div className="flex flex-wrap gap-2">
              {TIPOS_COMIDA.map(({ valor, etiqueta }) => {
                const elegido = cuando.tipo === valor;
                return (
                  <label
                    key={valor}
                    // Chip de 44px. Elegido: verde lleno y en negrita (no solo el color).
                    className={`chip cursor-pointer select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primario ${
                      elegido ? "chip-activo" : "hover:bg-primario-suave"
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
              <span className="etiqueta mb-2 block">Fecha</span>
              <input
                type="date"
                required
                max={hoy}
                value={cuando.fecha}
                onChange={(e) => {
                  setError(null);
                  despachar({ accion: "fecha", valor: e.target.value });
                }}
                className={claseFechaHora}
              />
            </label>
            <label className="block min-w-0">
              <span className="etiqueta mb-2 block">Hora</span>
              <input
                type="time"
                required
                value={cuando.hora}
                onChange={(e) => {
                  setError(null);
                  despachar({ accion: "hora", valor: e.target.value });
                }}
                className={claseFechaHora}
              />
            </label>
          </div>

          {/* ── Descripción ── */}
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label htmlFor="descripcion" className="etiqueta">
                Descripción{" "}
                {foto && <span className="font-normal text-tinta-suave">(opcional)</span>}
              </label>
              <BotonDictar
                texto={descripcion}
                onTexto={(t) => {
                  setError(null);
                  setDescripcion(t.slice(0, 2000));
                }}
                onError={setError}
                className="foco -mr-1"
              />
            </div>
            <textarea
              id="descripcion"
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
              className="campo min-h-28 resize-y"
            />
          </div>
        </fieldset>

        {/* ── Guardar (siempre a mano) ── */}
        {/* Isla flotante: se despega del borde de abajo, vidrio sobre el formulario. */}
        <div className="sticky bottom-0 z-10 mt-8 pt-2 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
          {error && (
            <p
              role="alert"
              className="mb-3 rounded-2xl bg-peligro-suave px-4 py-3 text-sm font-medium text-peligro shadow-suave"
            >
              {error}
            </p>
          )}
          {/* Mientras guarda no se "apaga": sigue sólido y con spinner, para que se lea como progreso. */}
          <div className="isla rounded-full p-1.5">
            <button
              type="submit"
              disabled={ocupado || procesandoFoto}
              className={`boton boton-primario foco group w-full justify-between px-2 text-[1.0625rem] ${
                guardandoAhora ? "" : "disabled:opacity-50"
              }`}
            >
              <span aria-hidden="true" className="size-10 shrink-0" />
              {textoBoton}
              <span aria-hidden="true" className="boton-icono">
                {guardandoAhora ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-sobre-primario border-t-transparent motion-reduce:animate-none" />
                ) : (
                  <IconoListo className="size-5" />
                )}
              </span>
            </button>
          </div>
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
              className="rounded-caja bg-peligro-suave p-5 shadow-[inset_0_0_0_1px_rgb(179_38_30/0.15)]"
            >
              <p id="confirmar-borrado" className="font-display text-lg font-bold tracking-tight text-peligro">
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
                  className="boton boton-secundario foco px-4 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={eliminar}
                  disabled={ocupado}
                  className="boton boton-peligro px-4 outline-none hover:bg-peligro/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peligro disabled:opacity-70"
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
              className="boton w-full px-4 text-peligro outline-none hover:bg-peligro-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peligro active:bg-peligro-suave disabled:opacity-50"
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
