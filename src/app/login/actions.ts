"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mensajeComun, registrarError } from "@/app/auth/_compartido/errores";
import { clave, texto } from "@/app/auth/_compartido/validacion";

export type EstadoLogin = {
  error?: string;
  // Se devuelve para que el form no pierda el email al fallar (React resetea el form).
  email?: string;
};

export async function ingresar(_previo: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = texto(formData.get("email")).toLowerCase();
  const password = clave(formData.get("password"));

  if (!email || !password) {
    return { error: "Completá tu email y tu contraseña.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: mensajeLogin(error), email };
  }

  redirect("/");
}

function mensajeLogin(error: Parameters<typeof mensajeComun>[0]): string {
  switch (error.code) {
    case "invalid_credentials":
      return "El email o la contraseña no son correctos.";
    case "email_not_confirmed":
      return "Todavía no confirmaste tu email. Buscá el mail que te mandamos (fijate también en spam).";
    case "user_banned":
      return "Esta cuenta está suspendida.";
  }

  const comun = mensajeComun(error);
  if (comun) return comun;

  registrarError("login", error);
  return "No pudimos ingresar. Probá de nuevo en un rato.";
}
