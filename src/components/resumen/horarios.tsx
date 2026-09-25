import {
  HORA_CORTE_DIA,
  formatearDuracion,
  formatearMinutos,
  type Estadistica,
} from "@/lib/resumen";
import { plural } from "@/components/semana/formato";

// El eje va de las 05:00 a las 05:00 del día siguiente (el "día alimentario"),
// así una última comida pasada la medianoche queda a la derecha y no al principio.
const INICIO = HORA_CORTE_DIA * 60;
const LARGO = 24 * 60;
const MARCAS = [6, 12, 18, 24]; // horas; 24 = medianoche

const posicion = (minutos: number) =>
  Math.min(100, Math.max(0, ((minutos - INICIO) * 100) / LARGO));

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
      <p className="text-sm text-tinta-suave">
        Todavía no hay comidas cargadas en este período (las bebidas no cuentan para los horarios).
      </p>
    );
  }

  const desde = posicion(primera.promedio);
  const hasta = ultima ? posicion(ultima.promedio) : desde;

  return (
    <div className="flex flex-col gap-4">
      {/* Dibujo de la ventana de comidas: decorativo, los valores están abajo en texto. */}
      <div aria-hidden="true">
        <div className="relative h-4 overflow-hidden rounded-full bg-fondo">
          <span
            className="absolute inset-y-0 rounded-full bg-primario"
            style={{ left: `${desde}%`, width: `max(1rem, ${hasta - desde}%)` }}
          />
        </div>
        <div className="relative mt-1 h-4 text-[0.7rem] text-tinta-suave tabular-nums">
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

      <dl className="grid grid-cols-3 gap-2 text-center">
        <Valor titulo="Primera comida" valor={formatearMinutos(primera.promedio)} />
        <Valor titulo="Última comida" valor={ultima ? formatearMinutos(ultima.promedio) : "—"} />
        <Valor titulo="Ayuno nocturno" valor={ayuno ? formatearDuracion(ayuno.promedio) : "—"} />
      </dl>

      <p className="text-xs text-tinta-suave text-pretty">
        Promedios.{" "}
        {ayuno
          ? `El ayuno sale de ${plural(ayuno.cantidad, "noche", "noches")} entre dos días con comidas.`
          : "Para el ayuno hacen falta dos días seguidos con comidas."}
      </p>
    </div>
  );
}

function Valor({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex flex-col-reverse gap-0.5">
      <dt className="text-xs text-tinta-suave">{titulo}</dt>
      <dd className="text-lg font-semibold tracking-tight tabular-nums">{valor}</dd>
    </div>
  );
}
