import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registrarError } from "../_compartido/errores";
import { rutaInterna } from "../_compartido/ruta-interna";

// Cerrar sesión. Contrato para el resto de la app:
//
//   <form action="/auth/cerrar-sesion" method="post">
//     <button type="submit">Cerrar sesión</button>
//   </form>
//
// Redirige a /login. Opcional: un <input type="hidden" name="next" value="/ruta">
// para volver a otra ruta interna (lo usa /registro para seguir con una invitación).
// Solo POST: un GET se podría disparar desde un <img> o un prefetch.

export async function POST(request: NextRequest) {
  let destino = "/login";
  try {
    const form = await request.formData();
    destino = rutaInterna(form.get("next")) ?? "/login";
  } catch {
    // Sin body o con otro content-type: va a /login.
  }

  const supabase = await createClient();
  // "local": cierra solo este dispositivo, no el celular de la paciente si cierra en la compu.
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    registrarError("cerrar-sesion", error);
    // Si Supabase no respondió, igual borramos las cookies de sesión de este navegador.
    const cookieStore = await cookies();
    for (const { name } of cookieStore.getAll()) {
      if (name.startsWith("sb-")) cookieStore.delete(name);
    }
  }

  // 303: el navegador sigue con GET (no reenvía el POST a /login).
  return new Response(null, {
    status: 303,
    headers: { Location: destino, "Cache-Control": "no-store" },
  });
}
