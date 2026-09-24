"use server";

import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { mensajeComun, registrarError } from "@/app/auth/_compartido/errores";
import { clave, errorDeClave } from "@/app/auth/_compartido/validacion";

export type EstadoNuevaClave = {
  error?: string;
  // Sin sesión (link viejo o sesión vencida): hay que pedir un link nuevo.
  sinSesion?: boolean;
  listo?: boolean;
};

const SESION_VENCIDA: EstadoNuevaClave = {
  error: "Tu sesión venció. Pedí un link nuevo para cambiar la contraseña.",
  sinSesion: true,
};

export async function cambiarClave(
  _previo: EstadoNuevaClave,
  formData: FormData,
): Promise<EstadoNuevaClave> {
  const password = clave(formData.get("password"));
  const repetida = clave(formData.get("confirmacion"));

  const errorClave = errorDeClave(password);
  if (errorClave) return { error: errorClave };
  if (password !== repetida) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return SESION_VENCIDA;

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return mensajeNuevaClave(error);

  return { listo: true };
}

function mensajeNuevaClave(error: AuthError): EstadoNuevaClave {
  switch (error.code) {
    case "same_password":
      return { error: "Esa es tu contraseña actual. Elegí una distinta." };
    case "reauthentication_needed":
    case "reauthentication_not_valid":
    case "session_not_found":
    case "session_expired":
      return SESION_VENCIDA;
  }

  const comun = mensajeComun(error);
  if (comun) return { error: comun };

  registrarError("nueva-clave", error);
  return { error: "No pudimos cambiar la contraseña. Probá de nuevo en un rato." };
}
