import {
  HORA_CORTE_DIA,
  formatearDuracion,
  formatearMinutos,
  type Estadistica,
} from "@/lib/resumen";

// El eje va de las 05:00 a las 05:00 del día siguiente (el "día alimentario"),
// así una última comida pasada la medianoche queda a la derecha y no al principio.
const INICIO = HORA_CORTE_DIA * 60;
const LARGO = 24 * 60;
const MARCAS = [6, 12, 18, 24]; // horas; 24 = medianoche

const posicion = (minutos: number) =>
  Math.min(100, Math.max(0, ((minutos - INICIO) * 100) / LARGO));

/** "entre 07:30 y 09:15"; con un solo valor o todos iguales, lo dice así. */
function rango(e: Estadistica, formato: (m: number) => string): string | null {
  const minimo = formato(e.minimo);
  const maximo = formato(e.maximo);
  if (minimo === maximo) return null;
  return `entre ${minimo} y ${maximo}`;
}

export function Horarios({
  primera,
  ultima,
  ayuno,
}: {
  primera: Estadistica | null;
  ultima: Estadistica | null;
  ayuno: Estadistica | null;
}) {
  if (!primera) {
    return (
      <p className="py-1 text-sm text-tinta-suave text-pretty">
        Todavía no hay comidas cargadas.
      </p>
    );
  }

  const desde = posicion(primera.promedio);
  const hasta = ultima ? posicion(ultima.promedio) : desde;

  return (
    <div className="flex flex-col gap-3">
      {/* Dibujo de la ventana de comidas: decorativo, los valores están abajo en texto. */}
      <div aria-hidden="true">
        <div className="relative h-4 overflow-hidden rounded-full bg-hundido shadow-[inset_0_1px_2px_rgb(20_32_26_/_0.08)]">
          <span
            className="absolute inset-y-0 rounded-full bg-primario shadow-[inset_0_1px_0_rgb(255_255_255_/_0.25)]"
            style={{ left: `${desde}%`, width: `max(1rem, ${hasta - desde}%)` }}
          />
        </div>
        <div className="relative mt-1.5 h-4 text-xs font-medium text-tinta-suave tabular-nums">
          {MARCAS.map((h) => (
            <span
              key={h}
              className="absolute -translate-x-1/2"
              style={{ left: `${posicion(h * 60)}%` }}
            >
              {String(h % 24).padStart(2, "0")}
            </span>
          ))}
        </div>
      </div>

      <dl className="-mb-1.5 flex flex-col divide-y divide-borde">
        <Fila
          titulo="Primera comida"
          valor={formatearMinutos(primera.promedio)}
          rango={rango(primera, formatearMinutos)}
        />
        <Fila
          titulo="Última comida"
          valor={ultima ? formatearMinutos(ultima.promedio) : null}
          rango={ultima ? rango(ultima, formatearMinutos) : null}
        />
        <Fila
          titulo="Ayuno nocturno"
          valor={ayuno ? formatearDuracion(ayuno.promedio) : null}
          rango={ayuno ? rango(ayuno, formatearDuracion) : null}
        />
      </dl>
    </div>
  );
}

function Fila({
  titulo,
  valor,
  rango,
}: {
  titulo: string;
  valor: string | null;
  rango: string | null;
}) {
  return (
    <div className="flex min-h-13 items-center justify-between gap-4 py-2.5">
      <dt className="text-[0.9375rem] font-medium text-tinta-suave">{titulo}</dt>
      <dd className="text-right">
        {valor === null ? (
          <span className="text-sm text-tinta-suave">Sin datos</span>
        ) : (
          <>
            <span className="font-display text-xl leading-none font-bold tracking-tight tabular-nums">
              {valor}
            </span>
            {rango ? (
              <span className="mt-1 block text-xs font-medium text-tinta-suave tabular-nums">
                {rango}
              </span>
            ) : null}
          </>
        )}
      </dd>
    </div>
  );
}
