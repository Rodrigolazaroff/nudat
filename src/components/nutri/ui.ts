// Recetas de clases de la parte nutri (mismas que el resto de la app).

const foco =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario";

export const ui = {
  foco,
  botonPrimario: `inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primario px-5 font-medium text-sobre-primario transition-colors hover:bg-primario-hover disabled:opacity-50 ${foco}`,
  botonSecundario: `inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-borde bg-superficie px-5 font-medium text-tinta transition-colors hover:bg-fondo disabled:opacity-50 ${foco}`,
  // Variante compacta para acciones dentro de listas y del header.
  botonChico: `inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-borde bg-superficie px-3 text-sm font-medium text-tinta transition-colors hover:bg-fondo disabled:opacity-50 ${foco}`,
  botonChicoPeligro: `inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-borde bg-superficie px-3 text-sm font-medium text-peligro transition-colors hover:bg-peligro-suave disabled:opacity-50 ${foco}`,
  input:
    "h-12 w-full rounded-xl border border-borde bg-superficie px-4 text-base text-tinta outline-none focus:border-primario focus:ring-2 focus:ring-primario/20",
  tarjeta: "rounded-2xl border border-borde bg-superficie p-4",
  error: "rounded-xl bg-peligro-suave px-4 py-3 text-sm text-peligro",
};
