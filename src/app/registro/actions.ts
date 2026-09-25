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
  texto,
} from "@/app/auth/_compartido/validacion";

export type ValoresRegistro = {
  nombre: string;
  email: string;
};

export type EstadoRegistro = {
  error?: string;
  // Se devuelven para que el form no se vacíe al fallar (React resetea el form).
  valores?: ValoresRegistro;
  // Supabase pide confirmar el email: se muestra la pantalla "Revisá tu mail".
  emailPorConfirmar?: string;
};

export async function registrarse(
  _previo: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const nombre = texto(formData.get("nombre")).replace(/\s+/g, " ");
  const email = texto(formData.get("email")).toLowerCase();
  const password = clave(formData.get("password"));

  const valores: ValoresRegistro = { nombre, email };
  const fallar = (error: string): EstadoRegistro => ({ error, valores });

  if (!nombre) return fallar("Escribí tu nombre.");
  if (nombre.length > NOMBRE_MAX) {
    return fallar(`El nombre puede tener hasta ${NOMBRE_MAX} caracteres.`);
  }
  if (!esEmail(email)) return fallar("Revisá el email: no parece válido.");
  const errorClave = errorDeClave(password);
  if (errorClave) return fallar(errorClave);

  const supabase = await createClient();
  const origen = await obtenerOrigen();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // El trigger privado.crear_perfil toma `nombre` para el perfil.
      data: { nombre },
      emailRedirectTo: `${origen}/auth/confirm`,
    },
  });

  if (error) return fallar(mensajeRegistro(error));

  // Con "Confirm email" apagado Supabase ya devuelve la sesión: adentro.
  if (data.session) redirect("/");

  return { emailPorConfirmar: email };
}

function mensajeRegistro(error: AuthError): string {
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
