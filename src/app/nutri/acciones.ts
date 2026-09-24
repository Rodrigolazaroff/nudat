"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigirRol } from "@/lib/perfil";
import { linkInvitacion } from "@/components/nutri/invitacion";
import { obtenerOrigen } from "./origen";

// Server Actions de la nutri. La RLS ya limita todo a sus datos; igual se
// verifica el rol acá porque una action se puede llamar con un POST directo.

export type EstadoInvitacion =
  | { estado: "inicial" }
  | { estado: "error"; mensaje: string; nombre: string; email: string }
  | { estado: "ok"; id: string; nombre: string; link: string };

export type EstadoEliminar = { error: string | null };

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === "string" ? valor.trim() : "";
}

export async function crearInvitacion(
  _anterior: EstadoInvitacion,
  formData: FormData,
): Promise<EstadoInvitacion> {
  await exigirRol("nutri");

  const nombre = texto(formData.get("nombre")).replace(/\s+/g, " ");
  const email = texto(formData.get("email")).toLowerCase();
  const fallo = (mensaje: string): EstadoInvitacion => ({ estado: "error", mensaje, nombre, email });

  if (!nombre) return fallo("Escribí el nombre del paciente.");
  if (nombre.length > 120) return fallo("El nombre puede tener hasta 120 caracteres.");
  if (email && (email.length > 254 || !RE_EMAIL.test(email))) {
    return fallo("Revisá el email, no parece válido.");
  }

  const supabase = await createClient();
  // nutri_id, token y vencimiento los pone la base.
  const { data, error } = await supabase
    .from("invitaciones")
    .insert({ nombre, email: email || null })
    .select("id, token")
    .single();

  if (error || !data) {
    console.error("[nutri/crearInvitacion]", error?.message);
    return fallo("No pudimos crear la invitación. Probá de nuevo.");
  }

  revalidatePath("/nutri");
  return {
    estado: "ok",
    id: data.id,
    nombre,
    link: linkInvitacion(await obtenerOrigen(), data.token),
  };
}

export async function eliminarInvitacion(
  _anterior: EstadoEliminar,
  formData: FormData,
): Promise<EstadoEliminar> {
  const perfil = await exigirRol("nutri");

  const id = texto(formData.get("id"));
  if (!RE_UUID.test(id)) return { error: "Invitación inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("invitaciones")
    .delete()
    .eq("id", id)
    .eq("nutri_id", perfil.id)
    .is("usada_en", null);

  if (error) {
    console.error("[nutri/eliminarInvitacion]", error.message);
    return { error: "No pudimos eliminarla. Probá de nuevo." };
  }

  revalidatePath("/nutri");
  return { error: null };
}
