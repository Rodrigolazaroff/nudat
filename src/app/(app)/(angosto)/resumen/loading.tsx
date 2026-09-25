// Esqueleto con la forma del resumen (tarjetas, tira, secciones) mientras llegan los datos.
export default function CargandoResumen() {
  return (
    <div role="status" aria-label="Cargando" className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div>
          <div className="h-6 w-28 rounded-lg bg-borde/70" />
          <div className="mt-2 h-4 w-44 rounded-lg bg-borde/50" />
        </div>
        <div className="h-13 rounded-2xl border border-borde bg-superficie" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-borde bg-superficie" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-14 rounded-xl bg-borde/50" />
        ))}
      </div>
      <div className="h-40 rounded-2xl border border-borde bg-superficie" />
      <div className="h-56 rounded-2xl border border-borde bg-superficie" />
    </div>
  );
}
