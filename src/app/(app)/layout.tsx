import type { Viewport } from "next";
import Link from "next/link";
import { obtenerPerfil } from "@/lib/perfil";
import { NavInferior } from "@/components/comidas/nav-inferior";
import { Logo } from "@/components/logo";

// viewport-fit=cover habilita env(safe-area-inset-*) en iOS (barra inferior y botón fijo).
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const perfil = await obtenerPerfil();
  const inicial = perfil.nombre.trim().charAt(0).toUpperCase() ?? "";

  return (
    // Sin fondo propio: deja ver la atmósfera del body (resplandor + grano de globals.css).
    <div className="group/app flex min-h-dvh flex-1 flex-col text-tinta print:min-h-0 print:bg-superficie">
      {/* Isla flotante: se despega del borde y del contenido, vidrio sobre lo que scrollea. */}
      <header className="sticky top-0 z-20 px-3 pt-[calc(env(safe-area-inset-top)_+_0.625rem)] print:hidden">
        {/* Se alinea al contenido: angosto por defecto, ancho si la página lo pide (/semana). */}
        <div className="isla mx-auto flex h-15 max-w-lg items-center justify-between gap-3 rounded-full pr-1.5 pl-5 group-has-[[data-ancho=completo]]/app:max-w-5xl">
          <Link href="/" aria-label="nudat, ir a Hoy" className="foco -mx-2 flex rounded-full px-2 py-2">
            <Logo className="text-[1.3rem]" />
          </Link>
          <div className="flex min-w-0 items-center gap-1.5">
            {perfil.nombre ? (
              <span className="flex min-w-0 items-center gap-2 pr-1">
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primario-suave font-display text-sm font-bold text-primario"
                >
                  {inicial}
                </span>
                <span className="hidden truncate text-sm font-medium text-tinta-suave min-[380px]:inline">
                  {perfil.nombre}
                </span>
              </span>
            ) : null}
            <form action="/auth/cerrar-sesion" method="post">
              <button
                type="submit"
                className="foco h-12 rounded-full px-4 text-sm font-semibold text-tinta transition-colors duration-300 ease-premium hover:bg-hundido"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* El ancho lo define cada grupo: (angosto) para cargar desde el celu, /semana ancho. */}
      <main className="w-full flex-1 pt-6 print:pt-0">{children}</main>

      <NavInferior />
    </div>
  );
}
