"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconoHistorial,
  IconoHoy,
  IconoResumen,
  IconoSemana,
} from "@/components/comidas/iconos";

// Orden: Hoy y Resumen primero (lo de todos los días: cargar y ver cómo vengo);
// Semana (para imprimir) e Historial (para buscar un día) son de consulta.
// En los formularios (nueva / editar) la barra se oculta: abajo va el botón Guardar.
const RUTAS_SIN_NAV = ["/nueva", "/comida/"];

export function NavInferior() {
  const pathname = usePathname();
  if (RUTAS_SIN_NAV.some((ruta) => pathname.startsWith(ruta))) return null;

  return (
    <>
      {/* Reserva el alto de la barra fija para que no tape el final del contenido. */}
      <div
        aria-hidden="true"
        className="h-[calc(4rem_+_env(safe-area-inset-bottom))] shrink-0 print:hidden"
      />
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)] print:hidden"
      >
        <div className="mx-auto flex h-16 max-w-lg">
          <ItemNav href="/" activo={pathname === "/"} icono={<IconoHoy />}>
            Hoy
          </ItemNav>
          <ItemNav
            href="/resumen"
            activo={pathname.startsWith("/resumen")}
            icono={<IconoResumen />}
          >
            Resumen
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
  // Activo: píldora detrás del ícono y label en semibold, no solo el color.
  // Foco: contorno verde por dentro del ítem (la barra está pegada al borde).
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`group flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-xs outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primario ${
        activo ? "font-semibold text-primario" : "font-medium text-tinta-suave hover:text-tinta"
      }`}
    >
      <span
        className={`flex h-7 w-14 items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${
          activo ? "bg-primario-suave" : "group-hover:bg-fondo"
        }`}
      >
        {icono}
      </span>
      {children}
    </Link>
  );
}
