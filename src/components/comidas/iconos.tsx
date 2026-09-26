import type { SVGProps } from "react";

// Íconos de trazo (24×24, currentColor). Decorativos: siempre acompañan un texto o un aria-label.
function Icono({ children, className = "size-6", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const IconoCamara = (p: P) => (
  <Icono {...p}>
    <path d="M14.5 4h-5L7.5 6.5H5A2 2 0 0 0 3 8.5v9A2 2 0 0 0 5 19.5h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2.5z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icono>
);

export const IconoGaleria = (p: P) => (
  <Icono {...p}>
    <rect x="3" y="3.5" width="18" height="17" rx="2" />
    <circle cx="9" cy="9" r="1.8" />
    <path d="m21 15.5-4.5-4.5L6 20.5" />
  </Icono>
);

export const IconoPlato = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
  </Icono>
);

export const IconoIzquierda = (p: P) => (
  <Icono {...p}>
    <path d="m15 18-6-6 6-6" />
  </Icono>
);

export const IconoDerecha = (p: P) => (
  <Icono {...p}>
    <path d="m9 18 6-6-6-6" />
  </Icono>
);

export const IconoVolver = (p: P) => (
  <Icono {...p}>
    <path d="M19 12H5m6-6-6 6 6 6" />
  </Icono>
);

export const IconoMas = (p: P) => (
  <Icono {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icono>
);

export const IconoCerrar = (p: P) => (
  <Icono {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icono>
);

export const IconoHoy = (p: P) => (
  <Icono {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 10h17M8 3v4m8-4v4" />
    <rect x="7.5" y="13" width="4" height="4" rx="0.5" />
  </Icono>
);

export const IconoHistorial = (p: P) => (
  <Icono {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3.5 4v4h4" />
    <path d="M12 7.5V12l3 2" />
  </Icono>
);

export const IconoReloj = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icono>
);

export const IconoMicrofono = (p: P) => (
  <Icono {...p}>
    <rect x="9" y="3.5" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
    <path d="M12 18v2.5" />
  </Icono>
);

// Barras: el resumen de la semana.
export const IconoSemana = (p: P) => (
  <Icono {...p}>
    <path d="M4 20h16" />
    <path d="M7 16v-5" />
    <path d="M12 16V7" />
    <path d="M17 16v-3" />
  </Icono>
);

// Torta con una porción separada: el resumen / dashboard.
export const IconoResumen = (p: P) => (
  <Icono {...p}>
    <path d="M11 4.05A8 8 0 1 0 19.95 13H11z" />
    <path d="M14.5 3.3a7.5 7.5 0 0 1 6.2 6.2h-6.2z" />
  </Icono>
);

// Luna creciente: registros de madrugada (antes de las 05:00, cuentan para el día anterior).
export const IconoLuna = (p: P) => (
  <Icono {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </Icono>
);

// Impresora: acciones de imprimir o guardar en PDF.
export const IconoImprimir = (p: P) => (
  <Icono {...p}>
    <path d="M7 9V3.5h10V9" />
    <path d="M7 17.5H5a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2h-2" />
    <rect x="7" y="14" width="10" height="6.5" rx="1" />
  </Icono>
);
