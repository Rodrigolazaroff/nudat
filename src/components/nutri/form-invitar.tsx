"use client";

import { useActionState } from "react";
import { crearInvitacion, type EstadoInvitacion } from "@/app/nutri/acciones";
import { BotonCopiar } from "./boton-copiar";
import { linkWhatsApp } from "./invitacion";
import { ui } from "./ui";

const inicial: EstadoInvitacion = { estado: "inicial" };

export function FormInvitar() {
  const [estado, accion, pendiente] = useActionState(crearInvitacion, inicial);
  const conError = estado.estado === "error";

  return (
    <div className="flex flex-col gap-4">
      {estado.estado === "ok" ? (
        <LinkGenerado key={estado.id} nombre={estado.nombre} link={estado.link} />
      ) : null}

      <form action={accion} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invitar-nombre" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="invitar-nombre"
            name="nombre"
            required
            maxLength={120}
            autoComplete="off"
            defaultValue={conError ? estado.nombre : ""}
            className={ui.input}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="invitar-email" className="text-sm font-medium">
            Email <span className="font-normal text-tinta-suave">(opcional)</span>
          </label>
          <input
            id="invitar-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            maxLength={254}
            defaultValue={conError ? estado.email : ""}
            aria-describedby="invitar-email-ayuda"
            className={ui.input}
          />
          <p id="invitar-email-ayuda" className="text-xs text-tinta-suave text-pretty">
            Si lo completás, solo esa dirección puede usar el link.
          </p>
        </div>

        {conError ? (
          <p role="alert" className={ui.error}>
            {estado.mensaje}
          </p>
        ) : null}

        <button type="submit" disabled={pendiente} className={`${ui.botonPrimario} w-full`}>
          {pendiente ? "Generando link…" : "Generar link"}
        </button>
      </form>
    </div>
  );
}

function LinkGenerado({ nombre, link }: { nombre: string; link: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-primario-suave p-4">
      <p role="status" className="text-sm text-pretty">
        <span className="font-medium">Listo, este es el link para {nombre}.</span> Vence en 7 días
        y sirve para crear una sola cuenta.
      </p>
      <input
        readOnly
        value={link}
        aria-label={`Link de invitación para ${nombre}`}
        onFocus={(e) => e.currentTarget.select()}
        className="h-11 w-full rounded-xl border border-borde bg-superficie px-3 text-sm text-tinta-suave outline-none focus:border-primario focus:ring-2 focus:ring-primario/20"
      />
      <div className="flex flex-col gap-2">
        <BotonCopiar texto={link} className={`${ui.botonSecundario} w-full`} />
        <a
          href={linkWhatsApp(nombre, link)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ui.botonPrimario} w-full`}
        >
          Enviar por WhatsApp
        </a>
      </div>
    </div>
  );
}
