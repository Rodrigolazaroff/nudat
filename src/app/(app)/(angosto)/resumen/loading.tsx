// Esqueleto con la forma del resumen (encabezado, tira, datos, secciones) mientras
// llegan los datos. El pulso solo corre si la persona no pidió reducir el movimiento.
export default function CargandoResumen() {
  return (
    <div role="status" aria-label="Cargando" className="flex flex-col gap-6 motion-safe:animate-pulse">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="h-6 w-28 rounded-lg bg-borde/70" />
            <div className="mt-2 h-4 w-44 rounded-lg bg-borde/50" />
          </div>
          <div className="h-11 w-36 rounded-xl border border-borde bg-superficie" />
        </div>
        <div className="h-13 rounded-2xl border border-borde bg-superficie" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-6 w-56 rounded-lg bg-borde/70" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="h-14 rounded-xl bg-borde/50" />
          ))}
        </div>
        <div className="h-10 rounded-lg bg-borde/40" />
      </div>
      <div className="h-36 rounded-2xl border border-borde bg-superficie" />
      <div className="h-64 rounded-2xl border border-borde bg-superficie" />
      <div className="h-56 rounded-2xl border border-borde bg-superficie" />
    </div>
  );
}
