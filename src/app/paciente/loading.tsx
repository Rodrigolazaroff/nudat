// Esqueleto neutro para todas las pantallas del paciente mientras llegan los datos.
export default function Cargando() {
  return (
    <div role="status" aria-label="Cargando" className="animate-pulse">
      <div className="mx-auto h-6 w-32 rounded-lg bg-borde/70" />
      <div className="mx-auto mt-2 h-4 w-48 rounded-lg bg-borde/50" />
      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 rounded-2xl border border-borde bg-superficie p-4">
            <div className="size-18 shrink-0 rounded-xl bg-borde/60" />
            <div className="flex-1 pt-1">
              <div className="h-4 w-24 rounded bg-borde/70" />
              <div className="mt-2 h-3 w-full rounded bg-borde/50" />
              <div className="mt-1.5 h-3 w-2/3 rounded bg-borde/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
