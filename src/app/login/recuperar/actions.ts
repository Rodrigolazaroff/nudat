"use server";

import { createClient } from "@/lib/supabase/server";
import { mensajeComun, registrarError } from "@/app/auth/_compartido/errores";
import { obtenerOrigen } from "@/app/auth/_compartido/origen";
import { esEmail, texto } from "@/app/auth/_compartido/validacion";

export type EstadoRecuperar = {
  error?: string;
  email?: string;
  enviado?: boolean;
};

export async function pedirLinkRecuperacion(
  _previo: EstadoRecuperar,
  formData: FormData,
): Promise<EstadoRecuperar> {
  const email = texto(formData.get("email")).toLowerCase();

  if (!esEmail(email)) {
    return { error: "Revisá el email: no parece válido.", email };
  }

  const supabase = await createClient();
  const origen = await obtenerOrigen();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origen}/auth/confirm?next=/cuenta/nueva-clave`,
  });

  if (error) {
    const comun = mensajeComun(error);
    if (comun) return { error: comun, email };
    registrarError("recuperar", error);
    return { error: "No pudimos mandar el mail. Probá de nuevo en un rato.", email };
  }

  // Supabase no dice si el email existe (evita que se pueda averiguar quién usa nudat).
  return { enviado: true, email };
}
