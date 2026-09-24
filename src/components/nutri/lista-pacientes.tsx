import Link from "next/link";
import { diferenciaDias } from "@/lib/resumen";
import { haceCuanto } from "./formato";
import { ui } from "./ui";

export type PacienteFila = {
  id: string;
  nombre: string;
  /** Fecha (Argentina) de la última comida cargada, o null si nunca cargó. */
  ultimaCarga: string | null;
  comidasSemana: number;
};

// Más de estos días sin cargar → se marca para que la nutri lo vea.
const DIAS_SIN_CARGAR_AVISO = 2;

export function ListaPacientes({ pacientes, hoy }: { pacientes: PacienteFila[]; hoy: string }) {
  if (pacientes.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-borde bg-superficie px-6 py-10 text-center">
        <p className="font-medium">Todavía no tenés pacientes</p>
        <p className="mt-1 max-w-sm text-sm text-tinta-suave text-pretty">
          Generá un link de invitación y mandáselo. Cuando se registre va a aparecer acá y vas a
          poder ver todo lo que carga.
        </p>
        <a href="#invitar" className={`${ui.botonPrimario} mt-5`}>
          Invitar paciente
        </a>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {pacientes.map((p) => {
        const nombre = p.nombre || "Sin nombre";
        const dias = p.ultimaCarga ? diferenciaDias(p.ultimaCarga, hoy) : null;
        const aviso = dias === null || dias > DIAS_SIN_CARGAR_AVISO;
        return (
          <li key={p.id}>
            <Link
              href={`/nutri/pacientes/${p.id}`}
              className={`group flex items-center gap-3 rounded-2xl border border-borde bg-superficie p-4 transition-colors hover:border-primario sm:gap-4 ${ui.foco}`}
            >
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-primario-suave font-semibold text-primario uppercase"
              >
                {nombre.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{nombre}</span>
                <span className="mt-0.5 flex items-start gap-1.5 text-sm text-tinta-suave">
                  {aviso ? (
                    <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-acento" />
                  ) : null}
                  <span>
                    {p.ultimaCarga
                      ? `Última carga ${haceCuanto(p.ultimaCarga, hoy)}`
                      : "Todavía no cargó comidas"}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-xl font-semibold tabular-nums">
                  {p.comidasSemana}
                  <span className="sr-only"> comidas</span>
                </span>
                <span className="block text-xs text-tinta-suave">en 7 días</span>
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5 shrink-0 text-tinta-suave transition-colors group-hover:text-primario"
              >
                <path
                  fillRule="evenodd"
                  d="M7.2 14.8a.75.75 0 0 1 0-1.06L10.94 10 7.2 6.26a.75.75 0 1 1 1.06-1.06l4.27 4.27a.75.75 0 0 1 0 1.06L8.26 14.8a.75.75 0 0 1-1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
