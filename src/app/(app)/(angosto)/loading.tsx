// Esqueleto para las pantallas angostas mientras llegan los datos. Copia la estructura de Hoy
// (la más visitada): botones de día, título, conteo y tarjetas, así no salta al cargar.
export default function Cargando() {
  return (
    <div role="status" className="animate-pulse motion-reduce:animate-none">
      <span className="sr-only">Cargando…</span>
      <div aria-hidden="true">
        <div className="flex items-center justify-between gap-2">
          <div className="size-12 shrink-0 rounded-full border border-borde bg-superficie" />
          {/* Mismo alto que el título (28px) + la fecha (20px) de Hoy. */}
          <div className="flex flex-col items-center">
            <div className="my-0.5 h-6 w-24 rounded-lg bg-borde/70" />
            <div className="my-0.5 h-4 w-40 rounded-lg bg-borde/50" />
          </div>
          <div className="size-12 shrink-0 rounded-full border border-borde bg-superficie" />
        </div>
        <div className="mt-5 mb-2 flex h-5 items-center">
          <div className="h-3.5 w-28 rounded bg-borde/50" />
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-borde bg-superficie p-4"
            >
              <div className="size-18 shrink-0 rounded-xl bg-borde/60" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded bg-borde/70" />
                <div className="mt-2 h-3 w-full rounded bg-borde/50" />
                <div className="mt-1.5 h-3 w-2/3 rounded bg-borde/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
