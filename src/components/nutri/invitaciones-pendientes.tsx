import { BotonCopiar } from "./boton-copiar";
import { BotonEliminarInvitacion } from "./boton-eliminar-invitacion";
import { linkWhatsApp } from "./invitacion";
import { ui } from "./ui";

export type InvitacionPendiente = {
  id: string;
  nombre: string | null;
  email: string | null;
  link: string;
  /** "Vence en 6 días" */
  vence: string;
};

export function InvitacionesPendientes({ invitaciones }: { invitaciones: InvitacionPendiente[] }) {
  if (invitaciones.length === 0) return null;

  return (
    <section aria-labelledby="titulo-pendientes" className="flex flex-col gap-3">
      <h2 id="titulo-pendientes" className="text-lg font-semibold tracking-tight">
        Invitaciones pendientes{" "}
        <span className="font-normal text-tinta-suave tabular-nums">({invitaciones.length})</span>
      </h2>
      <ul className="flex flex-col gap-2">
        {invitaciones.map((inv) => {
          const quien = inv.nombre || inv.email || "sin nombre";
          return (
            <li key={inv.id} className={ui.tarjeta}>
              <p className="truncate font-medium">{inv.nombre || inv.email || "Sin nombre"}</p>
              {inv.nombre && inv.email ? (
                <p className="truncate text-sm text-tinta-suave">{inv.email}</p>
              ) : null}
              <p className="mt-1 text-xs text-tinta-suave tabular-nums">{inv.vence}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <BotonCopiar texto={inv.link} className={ui.botonChico} />
                <a
                  href={linkWhatsApp(inv.nombre, inv.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ui.botonChico}
                >
                  WhatsApp
                </a>
                <BotonEliminarInvitacion id={inv.id} quien={quien} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
