import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormNuevaClave } from "./form-nueva-clave";

export const metadata: Metadata = {
  title: "Contraseña nueva",
};

// Se llega desde el mail de recuperación (vía /auth/confirm, que ya abrió la sesión)
// o desde la app estando logueado. El proxy ya manda a /login si no hay sesión.
export default async function NuevaClavePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const email = typeof data.claims.email === "string" ? data.claims.email : "";

  return <FormNuevaClave email={email} />;
}
