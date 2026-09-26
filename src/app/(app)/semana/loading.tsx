export default function CargandoSemana() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="flex flex-col gap-6 motion-safe:animate-pulse">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-20 rounded bg-borde" />
        <div className="h-8 w-56 rounded-lg bg-borde" />
        <div className="h-4 w-48 rounded bg-borde" />
        <div className="h-14 rounded-2xl border border-borde bg-superficie" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-borde bg-superficie" />
        ))}
      </div>
      <div className="h-96 rounded-2xl border border-borde bg-superficie" />
    </div>
  );
}
