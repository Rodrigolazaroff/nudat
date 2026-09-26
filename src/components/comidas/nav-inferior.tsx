"use client";

import Link, { useLinkStatus } from "next/link";
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
      {/* Reserva el alto de la barra fija (y un respiro) para que no tape el final. */}
      <div
        aria-hidden="true"
        className="h-[calc(6rem_+_env(safe-area-inset-bottom))] shrink-0 print:hidden"
      />
      {/* Cápsula flotante verde profundo, despegada de los bordes. */}
      <nav
        aria-label="Secciones"
        data-nav-inferior
        className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)_+_0.75rem)] print:hidden"
      >
        <div className="mx-auto flex h-16 max-w-lg gap-1 rounded-full bg-primario-profundo p-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_20px_40px_-12px_rgb(23_54_40/0.55)]">
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
  // Activo: píldora crema con texto verde (contraste fuerte, no solo color).
  // La barra ocupa 4rem + 0.75rem de margen + zona segura: lo fijo de arriba se apoya ahí.
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[0.6875rem] leading-none outline-none select-none transition-[background-color,color,scale] duration-200 ease-premium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-acento active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${
        activo
          ? "bg-fondo font-bold text-primario-profundo shadow-[inset_0_1px_0_rgb(255_255_255/0.9)]"
          : "font-medium text-sobre-profundo-suave hover:text-sobre-primario"
      }`}
    >
      {activo ? null : <Pendiente />}
      <span className="relative [&>svg]:size-[1.35rem]">{icono}</span>
      <span className="relative">{children}</span>
    </Link>
  );
}

// Mientras navega a otra sección: la píldora se aclara apenas, así el toque tiene respuesta
// aunque la pantalla nueva tarde. Con 80ms de espera para no parpadear si llega al toque.
function Pendiente() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-full bg-sobre-primario/12 transition-opacity ease-premium motion-reduce:transition-none ${
        pending ? "opacity-100 delay-80 duration-200" : "opacity-0 duration-150"
      }`}
    />
  );
}
