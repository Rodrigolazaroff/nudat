"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mensajeComun, registrarError } from "@/app/auth/_compartido/errores";
import { obtenerOrigen } from "@/app/auth/_compartido/origen";
import {
  NOMBRE_MAX,
  clave,
  errorDeClave,
  esEmail,
  esUuid,
  texto,
} from "@/app/auth/_compartido/validacion";

export type ValoresRegistro = {
  nombre: string;
  email: string;
  consentimiento: boolean;
};

export type EstadoRegistro = {
  error?: string;
  // Se devuelven para que el form no se vacíe al fallar (React resetea el form).
  valores?: ValoresRegistro;
  // Supabase pide confirmar el email: se muestra la pantalla "Revisá tu mail".
  emailPorConfirmar?: string;
};

const SIN_INVITACION = "Este registro necesita una invitación válida de tu nutri.";

export async function registrarse(
  _previo: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const nombre = texto(formData.get("nombre")).replace(/\s+/g, " ");
  let email = texto(formData.get("email")).toLowerCase();
  const password = clave(formData.get("password"));
  const token = texto(formData.get("invitacion")) || null;
  const consentimiento = formData.get("consentimiento") === "on";

  const valores: ValoresRegistro = { nombre, email, consentimiento };
  const fallar = (error: string): EstadoRegistro => ({ error, valores });

  if (!nombre) return fallar("Escribí tu nombre.");
  if (nombre.length > NOMBRE_MAX) {
    return fallar(`El nombre puede tener hasta ${NOMBRE_MAX} caracteres.`);
  }
  if (!esEmail(email)) return fallar("Revisá el email: no parece válido.");
  const errorClave = errorDeClave(password);
  if (errorClave) return fallar(errorClave);

  const supabase = await createClient();

  if (token !== null) {
    if (!esUuid(token)) return fallar(SIN_INVITACION);
    if (!consentimiento) {
      return fallar("Para crear la cuenta tenés que aceptar que tu nutri vea lo que cargás.");
    }

    // Se vuelve a validar acá (la página pudo quedar abierta días) y, si la invitación
    // trae email, se usa ese: el del form no se toma en cuenta.
    const { data, error } = await supabase.rpc("ver_invitacion", { p_token: token });
    if (error) {
      registrarError("registro/ver_invitacion", error);
      return fallar("No pudimos verificar la invitación. Probá de nuevo en un rato.");
    }
    const invitacion = data?.[0];
    if (!invitacion) {
      return fallar("Esta invitación venció o ya se usó. Pedile a tu nutri un link nuevo.");
    }
    if (invitacion.email) {
      email = invitacion.email;
      valores.email = email;
    }
  }

  const origen = await obtenerOrigen();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // El trigger privado.crear_perfil lee `nombre` e `invitacion`.
      // `consentimiento_salud` queda como constancia de cuándo aceptó compartir sus datos.
      data:
        token !== null
          ? { nombre, invitacion: token, consentimiento_salud: new Date().toISOString() }
          : { nombre },
      emailRedirectTo: `${origen}/auth/confirm`,
    },
  });

  if (error) return fallar(mensajeRegistro(error, token !== null));

  // Con "Confirm email" apagado Supabase ya devuelve la sesión: adentro.
  if (data.session) redirect("/");

  return { emailPorConfirmar: email };
}

function mensajeRegistro(error: AuthError, conInvitacion: boolean): string {
  // El trigger rechazó el alta (sin invitación válida / email de nutri no habilitado).
  // Supabase lo devuelve como un 500 genérico "Database error saving new user".
  if (
    error.code === "unexpected_failure" ||
    /database error saving new user/i.test(error.message)
  ) {
    return conInvitacion
      ? SIN_INVITACION
      : `${SIN_INVITACION} Si sos nutricionista, tu email todavía no está habilitado.`;
  }

  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return "Ya hay una cuenta con ese email. Probá ingresar o recuperar la contraseña.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Por ahora no se pueden crear cuentas nuevas. Probá más tarde.";
    case "validation_failed":
      return "Revisá el email y la contraseña: alguno no es válido.";
  }

  const comun = mensajeComun(error);
  if (comun) return comun;

  registrarError("registro/signUp", error);
  return "No pudimos crear la cuenta. Probá de nuevo en un rato.";
}
