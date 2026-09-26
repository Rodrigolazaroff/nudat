// Esqueleto con la forma del resumen (título, período, tira, datos, secciones) mientras
// llegan los datos. El brillo (.esqueleto) se apaga con prefers-reduced-motion.
export default function CargandoResumen() {
  return (
    <div role="status">
      <span className="sr-only">Cargando…</span>
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-5">
          <div>
            <div className="esqueleto h-[clamp(2.5rem,12vw,3.5rem)] w-44 rounded-2xl" />
            <div className="esqueleto mt-2 h-5 w-52 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="chip-activo h-11 rounded-full opacity-40 shadow-none" />
            <div className="h-11 rounded-full shadow-[0_0_0_1px_var(--borde)]" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="esqueleto h-6 w-60 rounded-full" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="esqueleto h-15 rounded-2xl" />
            ))}
          </div>
          <div className="esqueleto h-4 w-4/5 rounded-full" />
        </div>

        <Bloque alto="h-36" />
        <div className="flex flex-col gap-3">
          <div className="esqueleto h-6 w-28 rounded-full" />
          <Bloque alto="h-56" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="esqueleto h-6 w-36 rounded-full" />
          <Bloque alto="h-60" />
        </div>
      </div>
    </div>
  );
}

function Bloque({ alto }: { alto: string }) {
  return (
    <div className="bisel">
      <div className={`bisel-nucleo flex flex-col gap-3 px-5 py-4 ${alto}`}>
        <div className="esqueleto h-4 w-2/3 rounded-full" />
        <div className="esqueleto h-4 w-1/2 rounded-full" />
        <div className="esqueleto h-4 w-3/5 rounded-full" />
      </div>
    </div>
  );
}
