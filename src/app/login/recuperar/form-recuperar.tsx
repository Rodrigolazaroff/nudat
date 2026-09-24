"use client";

import { useActionState } from "react";
import { BotonEnviar } from "@/app/auth/_compartido/boton-enviar";
import { Campo, MensajeAviso, MensajeError, propsEmail } from "@/app/auth/_compartido/ui";
import { pedirLinkRecuperacion, type EstadoRecuperar } from "./actions";

const inicial: EstadoRecuperar = {};

export function FormRecuperar() {
  const [estado, accion] = useActionState(pedirLinkRecuperacion, inicial);

  if (estado.enviado) {
    return (
      <MensajeAviso>
        <p>
          Si hay una cuenta con <strong className="font-medium break-all">{estado.email}</strong>,
          en unos minutos te llega un mail con un link para elegir una contraseña nueva.
        </p>
        <p className="mt-2 text-tinta-suave">¿No lo ves? Fijate en spam o correo no deseado.</p>
      </MensajeAviso>
    );
  }

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Campo
        name="email"
        etiqueta="Email de tu cuenta"
        autoComplete="email"
        required
        defaultValue={estado.email}
        {...propsEmail}
      />

      {estado.error ? <MensajeError>{estado.error}</MensajeError> : null}

      <BotonEnviar pendiente="Enviando…">Mandarme el link</BotonEnviar>
    </form>
  );
}
