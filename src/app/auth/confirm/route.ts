import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registrarError } from "../_compartido/errores";
import { rutaInterna } from "../_compartido/ruta-interna";

// Destino de los links de los mails de Supabase (confirmar cuenta, recuperar contraseña).
//
// Soporta los dos formatos:
//  - ?token_hash=...&type=...  → plantillas de mail propias (funciona aunque el mail
//    se abra en otro navegador/dispositivo).
//  - ?code=...                 → plantillas por defecto con PKCE (solo funciona en el
//    mismo navegador donde se pidió, porque necesita la cookie del code verifier).
//
// Opcional: ?next=/ruta-interna. Si no viene, recovery va a /cuenta/nueva-clave y el
// resto a / (que redirige según el rol).

const TIPOS: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function esTipo(valor: string): valor is EmailOtpType {
  return (TIPOS as readonly string[]).includes(valor);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const tipo = params.get("type");
  const code = params.get("code");

  const destino =
    rutaInterna(params.get("next")) ?? (tipo === "recovery" ? "/cuenta/nueva-clave" : "/");

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && tipo && esTipo(tipo)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
    if (error) registrarError("confirm/verifyOtp", error);
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) registrarError("confirm/exchangeCodeForSession", error);
    ok = !error;
  }

  // Las cookies de sesión que escribió el cliente de Supabase se agregan solas
  // a esta respuesta (Next mergea las de cookies() en los Route Handlers).
  return redirigir(ok ? destino : "/login?error=link-invalido");
}

function redirigir(ruta: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: ruta, "Cache-Control": "no-store" },
  });
}
