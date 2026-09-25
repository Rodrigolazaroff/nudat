import type { Viewport } from "next";
import Link from "next/link";
import { obtenerPerfil } from "@/lib/perfil";
import { NavInferior } from "@/components/comidas/nav-inferior";

// viewport-fit=cover habilita env(safe-area-inset-*) en iOS (barra inferior y botón fijo).
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const perfil = await obtenerPerfil();

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-fondo text-tinta">
      <header className="sticky top-0 z-20 border-b border-borde bg-fondo/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4">
          <Link
            href="/"
            className="-mx-2 rounded-lg px-2 py-2 text-xl font-semibold tracking-tight text-primario"
          >
            nudat
          </Link>
          <div className="flex min-w-0 items-center gap-1">
            {perfil.nombre && (
              <span className="truncate text-sm text-tinta-suave">{perfil.nombre}</span>
            )}
            <form action="/auth/cerrar-sesion" method="post">
              <button
                type="submit"
                className="h-12 rounded-xl px-3 text-sm font-medium text-tinta hover:bg-superficie"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* El ancho lo define cada grupo: (angosto) para cargar desde el celu, /semana ancho. */}
      <main className="w-full flex-1 pt-4">{children}</main>

      <NavInferior />
    </div>
  );
}
