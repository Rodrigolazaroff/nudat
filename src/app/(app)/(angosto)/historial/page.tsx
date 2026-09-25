import type { Metadata } from "next";
import Link from "next/link";
import { obtenerPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { etiquetaTipo, horaActual, hoyISO } from "@/lib/comidas";
import type { TipoComida } from "@/lib/database.types";
import { diaYMes, nombreDia, sumarDias } from "@/components/comidas/fechas";
import { IconoDerecha } from "@/components/comidas/iconos";

export const metadata: Metadata = { title: "Historial" };

const DIAS = 14;

// "Faltan" mira solo las cuatro comidas principales: media mañana y colación son opcionales
// para mucha gente y marcarlas como faltantes todos los días sería puro ruido.
// Para hoy, una comida recién "falta" cuando ya pasó su franja horaria (ver sugerirTipo).
const PRINCIPALES: { tipo: TipoComida; terminaALas: number }[] = [
  { tipo: "desayuno", terminaALas: 10 },
  { tipo: "almuerzo", terminaALas: 16 },
  { tipo: "merienda", terminaALas: 20 },
  { tipo: "cena", terminaALas: 26 }, // hasta las 2 del día siguiente: hoy nunca falta
];

export default async function PaginaHistorial() {
  const perfil = await obtenerPerfil();
  const hoy = hoyISO();
  const horaHoy = Number(horaActual().slice(0, 2));
  const desde = sumarDias(hoy, -(DIAS - 1));

  const supabase = await createClient();
  const { data: comidas, error } = await supabase
    .from("comidas")
    .select("fecha, tipo")
    .eq("usuario_id", perfil.id)
    .gte("fecha", desde)
    .lte("fecha", hoy);
  if (error) throw new Error(`No se pudo cargar el historial: ${error.message}`);

  const porDia = new Map<string, { cantidad: number; tipos: Set<TipoComida> }>();
  for (const c of comidas) {
    const dia = porDia.get(c.fecha) ?? { cantidad: 0, tipos: new Set<TipoComida>() };
    dia.cantidad++;
    dia.tipos.add(c.tipo);
    porDia.set(c.fecha, dia);
  }

  const dias = Array.from({ length: DIAS }, (_, i) => {
    const fecha = sumarDias(hoy, -i);
    const dia = porDia.get(fecha);
    const faltan = PRINCIPALES.filter(
      ({ tipo, terminaALas }) =>
        !dia?.tipos.has(tipo) && (fecha !== hoy || horaHoy >= terminaALas),
    ).map(({ tipo }) => etiquetaTipo(tipo).toLowerCase());
    return { fecha, cantidad: dia?.cantidad ?? 0, faltan };
  });
  const diasConComidas = dias.filter((d) => d.cantidad > 0).length;

  return (
    <div className="pb-6">
      <h1 className="text-xl font-semibold">Historial</h1>
      <p className="mt-1 text-sm text-tinta-suave">
        Cargaste algo en {diasConComidas} de los últimos {DIAS} días.
      </p>

      <ul className="mt-4 divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
        {dias.map(({ fecha, cantidad, faltan }) => (
          <li key={fecha}>
            <Link
              href={`/?fecha=${fecha}`}
              className="flex min-h-16 items-center gap-3 px-4 py-3 outline-none hover:bg-fondo focus-visible:bg-primario-suave"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  <span className="font-medium">{nombreDia(fecha, hoy)}</span>
                  <span className="text-tinta-suave"> · {diaYMes(fecha)}</span>
                </p>
                <Estado fecha={fecha} hoy={hoy} cantidad={cantidad} faltan={faltan} />
              </div>
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums ${
                  cantidad > 0 ? "bg-primario-suave text-primario" : "bg-fondo text-tinta-suave"
                }`}
              >
                {cantidad}
                <span className="sr-only">{cantidad === 1 ? " registro" : " registros"}</span>
              </span>
              <IconoDerecha className="size-5 shrink-0 text-tinta-suave/60" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Estado({
  fecha,
  hoy,
  cantidad,
  faltan,
}: {
  fecha: string;
  hoy: string;
  cantidad: number;
  faltan: string[];
}) {
  if (cantidad === 0) {
    return fecha === hoy ? (
      <p className="text-sm text-tinta-suave">Todavía no cargaste nada</p>
    ) : (
      <p className="text-sm text-acento">Sin nada cargado</p>
    );
  }
  if (faltan.length === 0) {
    return (
      <p className="text-sm text-primario">
        {fecha === hoy ? "Vas al día" : "Están las 4 comidas principales"}
      </p>
    );
  }
  return (
    <p className="text-sm text-tinta-suave">
      {faltan.length === 1 ? "Falta" : "Faltan"}:{" "}
      <span className="text-acento">{unirConY(faltan)}</span>
    </p>
  );
}

function unirConY(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}
