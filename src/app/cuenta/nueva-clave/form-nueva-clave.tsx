"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BotonEnviar } from "@/app/auth/_compartido/boton-enviar";
import { CampoClave } from "@/app/auth/_compartido/campo-clave";
import {
  MensajeAviso,
  MensajeError,
  PantallaAuth,
  Tarjeta,
  clases,
} from "@/app/auth/_compartido/ui";
import { CLAVE_MAX, CLAVE_MIN } from "@/app/auth/_compartido/validacion";
import { cambiarClave, type EstadoNuevaClave } from "./actions";

const inicial: EstadoNuevaClave = {};

export function FormNuevaClave({ email }: { email: string }) {
  const [estado, accion] = useActionState(cambiarClave, inicial);

  if (estado.listo) {
    return (
      <PantallaAuth titulo="Listo, cambiaste tu contraseña">
        <MensajeAviso>
          <p>La próxima vez que ingreses, usá la contraseña nueva.</p>
        </MensajeAviso>
        <Link href="/" className={clases.botonPrimario}>
          Ir a nudat
        </Link>
      </PantallaAuth>
    );
  }

  return (
    <PantallaAuth
      titulo="Elegí una contraseña nueva"
      bajada={
        email ? (
          <p>
            Para la cuenta <strong className="font-medium break-all text-tinta">{email}</strong>.
          </p>
        ) : undefined
      }
      pie={
        <Link href="/" className={`${clases.link} inline-flex min-h-12 items-center`}>
          Volver
        </Link>
      }
    >
      <Tarjeta>
        <form action={accion} className="flex flex-col gap-4">
          {/* Para que el gestor de contraseñas asocie la clave nueva a esta cuenta. */}
          {email ? (
            <input type="email" autoComplete="username" value={email} readOnly hidden />
          ) : null}

          <CampoClave
            name="password"
            etiqueta="Contraseña nueva"
            ayuda={`Mínimo ${CLAVE_MIN} caracteres.`}
            autoComplete="new-password"
            minLength={CLAVE_MIN}
            maxLength={CLAVE_MAX}
            required
          />
          <CampoClave
            name="confirmacion"
            etiqueta="Repetila"
            autoComplete="new-password"
            minLength={CLAVE_MIN}
            maxLength={CLAVE_MAX}
            required
          />

          {estado.error ? (
            <MensajeError>
              <p>{estado.error}</p>
              {estado.sinSesion ? (
                <Link
                  href="/login/recuperar"
                  className="mt-1 inline-flex min-h-12 items-center font-medium underline underline-offset-4"
                >
                  Pedir un link nuevo
                </Link>
              ) : null}
            </MensajeError>
          ) : null}

          <BotonEnviar pendiente="Guardando…">Guardar contraseña</BotonEnviar>
        </form>
      </Tarjeta>
    </PantallaAuth>
  );
}
