import { redirect } from "next/navigation";
import { obtenerPerfil } from "@/lib/perfil";

// Entrada de la app: cada rol tiene su home. Sin sesión, obtenerPerfil manda a /login.
export default async function Inicio() {
  const perfil = await obtenerPerfil();
  redirect(perfil.rol === "nutri" ? "/nutri" : "/paciente");
}
