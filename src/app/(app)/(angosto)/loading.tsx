// Esqueleto para las pantallas angostas mientras llegan los datos. Copia la estructura de Hoy
// (la más visitada): título grande + fecha, flechas, pastilla de conteo y tarjetas con bisel,
// así no salta al cargar. El brillo (.esqueleto) se apaga con prefers-reduced-motion.
export default function Cargando() {
  return (
    <div role="status">
      <span className="sr-only">Cargando…</span>
      <div aria-hidden="true">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="esqueleto h-[clamp(2.5rem,12vw,3.5rem)] w-32 rounded-2xl" />
            <div className="esqueleto mt-2 h-5 w-48 rounded-full" />
          </div>
          <div className="flex gap-2 pt-1">
            <div className="boton-circulo" />
            <div className="boton-circulo opacity-40 shadow-none" />
          </div>
        </div>
        <div className="esqueleto mt-5 h-7 w-24 rounded-full" />
        <div className="mt-5 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bisel">
              <div className="bisel-nucleo flex items-center gap-4 p-2.5 pr-3">
                <div className="esqueleto size-20 shrink-0 rounded-xl" />
                <div className="flex-1 py-1">
                  <div className="flex justify-between gap-2">
                    <div className="esqueleto h-4 w-24 rounded-full" />
                    <div className="esqueleto h-4 w-12 rounded-full" />
                  </div>
                  <div className="esqueleto mt-3 h-3 w-full rounded-full" />
                  <div className="esqueleto mt-2 h-3 w-2/3 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
