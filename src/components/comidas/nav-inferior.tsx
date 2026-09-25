"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { IconoHistorial, IconoHoy, IconoSemana } from "@/components/comidas/iconos";

// En los formularios (nueva / editar) la barra se oculta: abajo va el botón Guardar.
const RUTAS_SIN_NAV = ["/nueva", "/comida/"];

export function NavInferior() {
  const pathname = usePathname();
  if (RUTAS_SIN_NAV.some((ruta) => pathname.startsWith(ruta))) return null;

  return (
    <>
      {/* Reserva el alto de la barra fija para que no tape el final del contenido. */}
      <div aria-hidden="true" className="h-[calc(4rem_+_env(safe-area-inset-bottom))] shrink-0" />
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex h-16 max-w-lg">
          <ItemNav href="/" activo={pathname === "/"} icono={<IconoHoy />}>
            Hoy
          </ItemNav>
          <ItemNav href="/semana" activo={pathname.startsWith("/semana")} icono={<IconoSemana />}>
            Semana
          </ItemNav>
          <ItemNav
            href="/historial"
            activo={pathname.startsWith("/historial")}
            icono={<IconoHistorial />}
          >
            Historial
          </ItemNav>
        </div>
      </nav>
    </>
  );
}

function ItemNav({
  href,
  activo,
  icono,
  children,
}: {
  href: string;
  activo: boolean;
  icono: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium outline-none focus-visible:bg-primario-suave ${
        activo ? "text-primario" : "text-tinta-suave hover:text-tinta"
      }`}
    >
      {icono}
      {children}
    </Link>
  );
}
