"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BotonEnviar } from "@/app/auth/_compartido/boton-enviar";
import { BotonGoogle, SeparadorO } from "@/app/auth/_compartido/boton-google";
import { CampoClave } from "@/app/auth/_compartido/campo-clave";
import {
  Campo,
  MensajeAviso,
  MensajeError,
  PantallaAuth,
  Tarjeta,
  clases,
  propsEmail,
} from "@/app/auth/_compartido/ui";
import { CLAVE_MAX, CLAVE_MIN, NOMBRE_MAX } from "@/app/auth/_compartido/validacion";
import { registrarse, type EstadoRegistro } from "./actions";

const inicial: EstadoRegistro = {};

export function FormRegistro() {
  const [estado, accion] = useActionState(registrarse, inicial);

  if (estado.emailPorConfirmar) {
    return (
      <PantallaAuth
        titulo="Revisá tu mail"
        bajada={
          <p>
            Te mandamos un mail a{" "}
            <strong className="font-medium break-all text-tinta">{estado.emailPorConfirmar}</strong>{" "}
            para confirmar la cuenta. Tocá el link del mail y listo.
          </p>
        }
      >
        <MensajeAviso>
          <p>¿No te llegó? Fijate en spam o correo no deseado.</p>
          <p className="mt-2 text-tinta-suave">
            Si ya tenías una cuenta con ese email, ingresá directamente.
          </p>
        </MensajeAviso>
        <Link href="/login" className={clases.botonSecundario}>
          Ir a ingresar
        </Link>
      </PantallaAuth>
    );
  }

  const valores = estado.valores;

  return (
    <PantallaAuth
      titulo="Creá tu cuenta"
      bajada={<p>Anotá lo que comés y tomás cada día, con foto y horario.</p>}
      pie={
        <p>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className={clases.link}>
            Ingresá
          </Link>
        </p>
      }
    >
      <BotonGoogle />
      <SeparadorO />

      <Tarjeta>
        <form action={accion} className="flex flex-col gap-4">
          <Campo
            name="nombre"
            etiqueta="Tu nombre"
            autoComplete="name"
            autoCapitalize="words"
            maxLength={NOMBRE_MAX}
            required
            defaultValue={valores?.nombre ?? ""}
          />

          <Campo
            name="email"
            etiqueta="Email"
            autoComplete="email"
            required
            defaultValue={valores?.email}
            {...propsEmail}
          />

          <CampoClave
            name="password"
            etiqueta="Contraseña"
            ayuda={`Mínimo ${CLAVE_MIN} caracteres.`}
            autoComplete="new-password"
            minLength={CLAVE_MIN}
            maxLength={CLAVE_MAX}
            required
          />

          {estado.error ? <MensajeError>{estado.error}</MensajeError> : null}

          <BotonEnviar pendiente="Creando la cuenta…">Crear cuenta</BotonEnviar>
        </form>
      </Tarjeta>
    </PantallaAuth>
  );
}
