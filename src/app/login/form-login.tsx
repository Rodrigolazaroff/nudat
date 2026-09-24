"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BotonEnviar } from "@/app/auth/_compartido/boton-enviar";
import { CampoClave } from "@/app/auth/_compartido/campo-clave";
import { Campo, MensajeError, clases, propsEmail } from "@/app/auth/_compartido/ui";
import { ingresar, type EstadoLogin } from "./actions";

const inicial: EstadoLogin = {};

export function FormLogin() {
  const [estado, accion] = useActionState(ingresar, inicial);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Campo
        name="email"
        etiqueta="Email"
        autoComplete="email"
        required
        defaultValue={estado.email}
        {...propsEmail}
      />
      <div className="flex flex-col">
        <CampoClave
          name="password"
          etiqueta="Contraseña"
          autoComplete="current-password"
          required
        />
        <Link
          href="/login/recuperar"
          className={`${clases.link} inline-flex min-h-12 items-center self-end text-sm`}
        >
          ¿Te olvidaste la contraseña?
        </Link>
      </div>

      {estado.error ? <MensajeError>{estado.error}</MensajeError> : null}

      <BotonEnviar pendiente="Ingresando…">Ingresar</BotonEnviar>
    </form>
  );
}
