export default function CargandoNutri() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="grid animate-pulse gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-3">
        <div className="h-8 w-40 rounded-lg bg-borde" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl border border-borde bg-superficie" />
        ))}
      </div>
      <div className="h-80 rounded-2xl border border-borde bg-superficie" />
    </div>
  );
}
