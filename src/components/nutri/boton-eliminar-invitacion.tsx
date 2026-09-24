"use client";

import { useActionState } from "react";
import { eliminarInvitacion, type EstadoEliminar } from "@/app/nutri/acciones";
import { ui } from "./ui";

const inicial: EstadoEliminar = { error: null };

export function BotonEliminarInvitacion({ id, quien }: { id: string; quien: string }) {
  const [estado, accion, pendiente] = useActionState(eliminarInvitacion, inicial);

  return (
    <form
      action={accion}
      onSubmit={(e) => {
        // Si ya se lo mandó, el link deja de andar: mejor preguntar.
        if (!window.confirm(`¿Eliminar la invitación de ${quien}? El link deja de funcionar.`)) {
          e.preventDefault();
        }
      }}
      className="contents"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pendiente}
        className={ui.botonChicoPeligro}
      >
        {pendiente ? "Eliminando…" : "Eliminar"}
      </button>
      {estado.error ? (
        <p role="alert" className="w-full text-sm text-peligro">
          {estado.error}
        </p>
      ) : null}
    </form>
  );
}
