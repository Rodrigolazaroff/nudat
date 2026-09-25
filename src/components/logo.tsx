import type { SVGProps } from "react";

// Marca de nudat: un cuaderno con espiral y un brote (hoja verde + hoja naranja).
// Los hex son los de la paleta (globals.css): primario, fondo crema y acento.
// Si cambia el dibujo, regenerar también src/app/icon.svg, src/app/apple-icon.png,
// src/app/favicon.ico y los PNG de public/ (icon-192, icon-512, icon-maskable-512).

const VERDE = "#2f6b4f";
const CREMA = "#f7f5f0";
const NARANJA = "#d9822b";

type PropsSvg = Omit<SVGProps<SVGSVGElement>, "viewBox" | "role">;

/**
 * Ícono de la app: cuadrado verde redondeado con el cuaderno crema adentro.
 * Por defecto es decorativo; pasá `titulo` si va solo y tiene que anunciarse.
 */
export function Isotipo({ className = "size-10", titulo, ...props }: PropsSvg & { titulo?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      focusable="false"
      {...(titulo ? { role: "img", "aria-label": titulo } : { "aria-hidden": true })}
      {...props}
    >
      <rect width="100" height="100" rx="22" fill={VERDE} />
      <rect x="16" y="28.5" width="20" height="7" rx="3.5" fill={CREMA} />
      <rect x="16" y="46.5" width="20" height="7" rx="3.5" fill={CREMA} />
      <rect x="16" y="64.5" width="20" height="7" rx="3.5" fill={CREMA} />
      <rect x="26" y="17" width="58" height="66" rx="10" fill={CREMA} />
      <path d="M56 83V58" stroke={VERDE} strokeWidth="5" strokeLinecap="round" />
      <path d="M56 71C50 60 39 59 35 64C39 72 49 75 56 71Z" fill={VERDE} />
      <path d="M56 60C55 48 63 40 76 38C77 51 69 59 56 60Z" fill={NARANJA} />
    </svg>
  );
}

/** El cuaderno en línea (sin fondo), para usar sobre fondos claros. Decorativo. */
export function IsotipoLinea({ className = "size-8", ...props }: PropsSvg) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false" {...props}>
      <rect x="8" y="23" width="26" height="9" rx="4.5" fill={VERDE} />
      <rect x="8" y="45.5" width="26" height="9" rx="4.5" fill={VERDE} />
      <rect x="8" y="68" width="26" height="9" rx="4.5" fill={VERDE} />
      <rect
        x="21.5"
        y="7.5"
        width="67"
        height="85"
        rx="13"
        fill="none"
        stroke={VERDE}
        strokeWidth="7"
      />
      <path d="M56 89V60" stroke={VERDE} strokeWidth="6" strokeLinecap="round" />
      <path d="M56 75C49 62 36 61 31 67C36 77 48 80 56 75Z" fill={VERDE} />
      <path d="M56 62C55 48 64 39 79 36C80 51 71 61 56 62Z" fill={NARANJA} />
    </svg>
  );
}

/**
 * Logo horizontal: cuaderno en línea + "nudat". El tamaño sale del font-size
 * (className, p. ej. "text-2xl"); el dibujo acompaña con 1.25em.
 */
export function Logo({ className = "text-2xl" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.3em] font-bold tracking-tight text-primario ${className}`}
    >
      <IsotipoLinea className="size-[1.25em] shrink-0" />
      <span>nudat</span>
    </span>
  );
}
