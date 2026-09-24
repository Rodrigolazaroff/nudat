import { headers } from "next/headers";

// Origen público del request (https://nudat.vercel.app, http://localhost:3000...)
// para armar los links de invitación. Solo en Server Components y Server Actions.
export async function obtenerOrigen(): Promise<string> {
  const h = await headers();

  // En un POST (Server Action) el navegador manda Origin.
  const origin = h.get("origin");
  if (origin && /^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(origin)) return origin;

  const host = primero(h.get("x-forwarded-host")) ?? primero(h.get("host"));
  if (!host || !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return "https://nudat.vercel.app";

  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = primero(h.get("x-forwarded-proto")) ?? (local ? "http" : "https");
  return `${proto === "http" ? "http" : "https"}://${host}`;
}

function primero(valor: string | null): string | null {
  const limpio = valor?.split(",")[0]?.trim();
  return limpio ? limpio : null;
}
