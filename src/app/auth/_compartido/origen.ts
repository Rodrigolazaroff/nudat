import { headers } from "next/headers";

// Origen público del request (https://nudat.vercel.app, http://localhost:3000...)
// para armar los links de los mails. Solo en Server Actions / Route Handlers.
// Si alguien falsea el header no pasa nada: Supabase solo acepta redirects que
// estén en su lista de Redirect URLs y si no, usa el Site URL.
export async function obtenerOrigen(): Promise<string> {
  const h = await headers();

  const origin = h.get("origin");
  if (origin && /^https?:\/\/[^/\s]+$/.test(origin)) return origin;

  const host = primero(h.get("x-forwarded-host")) ?? primero(h.get("host")) ?? "localhost:3000";
  const proto =
    primero(h.get("x-forwarded-proto")) ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

function primero(valor: string | null): string | null {
  const limpio = valor?.split(",")[0]?.trim();
  return limpio ? limpio : null;
}
