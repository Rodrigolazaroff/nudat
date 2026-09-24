import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Perfil, Rol } from "@/lib/database.types";

// Perfil del usuario logueado (una vez por request). Sin sesión → /login.
export const obtenerPerfil = cache(async (): Promise<Perfil> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (!perfil) redirect("/login?error=sin-perfil");

  return perfil;
});

// Para usar al principio de cada layout/página protegida.
export async function exigirRol(rol: Rol): Promise<Perfil> {
  const perfil = await obtenerPerfil();
  if (perfil.rol !== rol) redirect(perfil.rol === "nutri" ? "/nutri" : "/paciente");
  return perfil;
}
