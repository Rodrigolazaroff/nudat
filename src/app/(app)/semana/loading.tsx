// Mismo esqueleto que la pantalla: título + flechas, período e Imprimir, resumen y días.
export default function CargandoSemana() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="flex flex-col gap-8 pb-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="esqueleto h-12 w-52 rounded-2xl" />
            <div className="esqueleto h-5 w-44 rounded-full" />
          </div>
          <div className="flex shrink-0 gap-2 pt-1">
            <div className="esqueleto size-11 rounded-full" />
            <div className="esqueleto size-11 rounded-full" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="esqueleto h-7 w-32 rounded-full" />
          <div className="esqueleto h-13 w-36 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="esqueleto h-6 w-28 rounded-full" />
        <div className="bisel">
          <div className="esqueleto h-52 rounded-nucleo lg:h-28" />
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="bisel lg:col-span-2">
            <div className="esqueleto h-72 rounded-nucleo" />
          </div>
          <div className="bisel">
            <div className="esqueleto h-72 rounded-nucleo" />
          </div>
        </div>
      </div>
    </div>
  );
}
