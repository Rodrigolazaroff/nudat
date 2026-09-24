"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BotonEnviar } from "@/app/auth/_compartido/boton-enviar";
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

export type InvitacionVigente = {
  token: string;
  nutriNombre: string;
  email: string | null;
  nombre: string | null;
};

const inicial: EstadoRegistro = {};

// Sin `invitacion` es el registro de nutricionista.
export function FormRegistro({ invitacion }: { invitacion?: InvitacionVigente }) {
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
  const pie = (
    <p>
      ¿Ya tenés cuenta?{" "}
      <Link href="/login" className={clases.link}>
        Ingresá
      </Link>
    </p>
  );

  return (
    <PantallaAuth
      titulo={invitacion ? "Creá tu cuenta" : "Registro de nutricionista"}
      bajada={
        invitacion ? undefined : (
          <p>
            Solo para nutricionistas con acceso habilitado. Si sos paciente, pedile el link
            de invitación a tu nutri.
          </p>
        )
      }
      pie={pie}
    >
      {invitacion ? (
        <div className="rounded-2xl bg-primario-suave p-4">
          <p className="text-sm text-tinta-suave">Te invitó</p>
          <p className="text-lg font-semibold text-primario">{invitacion.nutriNombre}</p>
          <p className="mt-1 text-sm text-tinta">
            para que registres tus comidas en nudat.
          </p>
        </div>
      ) : null}

      <Tarjeta>
        <form action={accion} className="flex flex-col gap-4">
          {invitacion ? <input type="hidden" name="invitacion" value={invitacion.token} /> : null}

          <Campo
            name="nombre"
            etiqueta={invitacion ? "Tu nombre" : "Nombre y apellido"}
            ayuda={invitacion ? undefined : "Así te van a ver tus pacientes."}
            autoComplete="name"
            autoCapitalize="words"
            maxLength={NOMBRE_MAX}
            required
            defaultValue={valores?.nombre ?? invitacion?.nombre ?? ""}
          />

          {invitacion?.email ? (
            <Campo
              name="email"
              etiqueta="Email"
              ayuda="Es el email que cargó tu nutri en la invitación."
              autoComplete="email"
              readOnly
              defaultValue={invitacion.email}
              {...propsEmail}
            />
          ) : (
            <Campo
              name="email"
              etiqueta="Email"
              autoComplete="email"
              required
              defaultValue={valores?.email}
              {...propsEmail}
            />
          )}

          <CampoClave
            name="password"
            etiqueta="Contraseña"
            ayuda={`Mínimo ${CLAVE_MIN} caracteres.`}
            autoComplete="new-password"
            minLength={CLAVE_MIN}
            maxLength={CLAVE_MAX}
            required
          />

          {invitacion ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde p-4">
              <input
                type="checkbox"
                name="consentimiento"
                required
                defaultChecked={valores?.consentimiento ?? false}
                className="mt-0.5 size-5 shrink-0 accent-primario"
              />
              <span className="text-sm">
                <span className="font-medium">
                  Acepto que mi nutricionista vea las comidas y fotos que cargue.
                </span>{" "}
                <span className="text-tinta-suave">
                  Son datos de salud: solo los ven vos y tu nutri.
                </span>
              </span>
            </label>
          ) : null}

          {estado.error ? <MensajeError>{estado.error}</MensajeError> : null}

          <BotonEnviar pendiente="Creando la cuenta…">Crear cuenta</BotonEnviar>
        </form>
      </Tarjeta>
    </PantallaAuth>
  );
}
