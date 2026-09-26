import type { ComponentProps, ReactNode } from "react";
import { Logo } from "@/components/logo";

// Piezas visuales de las pantallas de auth (login, registro, recuperar, nueva clave).
// Sin hooks: se pueden usar desde Server y Client Components.
// Las clases base (.boton, .campo, .bisel…) viven en globals.css; ver DESIGN.md.

export const clases = {
  botonPrimario: "boton boton-primario foco w-full disabled:opacity-60",
  botonSecundario: "boton boton-secundario foco w-full disabled:opacity-60",
  input: "campo",
  error: "rounded-2xl bg-peligro-suave px-4 py-3 text-sm text-peligro",
  aviso: "rounded-2xl bg-primario-suave px-4 py-3 text-sm text-tinta",
  link: "foco rounded font-semibold text-primario underline decoration-primario/30 decoration-2 underline-offset-4 transition-colors duration-300 ease-premium hover:decoration-primario",
};

export function Marca() {
  return (
    <p>
      <Logo className="text-2xl" />
    </p>
  );
}

// Columna para todas las pantallas de auth. Mobile-first: en el celular arranca arriba
// (el teclado no tapa el form); desde sm se centra vertical.
export function PantallaAuth({
  titulo,
  bajada,
  children,
  pie,
}: {
  titulo: string;
  bajada?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-[calc(env(safe-area-inset-top)_+_2.5rem)] pb-10 sm:justify-center sm:pt-12">
      <div className="entrar">
        <Marca />
      </div>
      <h1
        className="titulo-pantalla entrar mt-10 text-[2.75rem] text-balance"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        {titulo}
      </h1>
      {bajada ? (
        <div
          className="entrar mt-3 text-[1.0625rem] text-tinta-suave text-pretty"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          {bajada}
        </div>
      ) : null}
      <div
        className="entrar mt-8 flex flex-col gap-4"
        style={{ "--i": 3 } as React.CSSProperties}
      >
        {children}
      </div>
      {pie ? (
        <div className="mt-10 text-center text-sm text-tinta-suave text-pretty">{pie}</div>
      ) : null}
    </main>
  );
}

/** Bisel doble: bandeja + núcleo. El contenido principal de cada pantalla de auth. */
export function Tarjeta({ children }: { children: ReactNode }) {
  return (
    <div className="bisel">
      <div className="bisel-nucleo p-5">{children}</div>
    </div>
  );
}

export function MensajeError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className={clases.error}>
      {children}
    </div>
  );
}

export function MensajeAviso({ children }: { children: ReactNode }) {
  return (
    <div role="status" className={clases.aviso}>
      {children}
    </div>
  );
}

type CampoProps = Omit<ComponentProps<"input">, "id" | "name" | "className"> & {
  name: string;
  etiqueta: string;
  ayuda?: string;
};

export function Campo({ name, etiqueta, ayuda, ...props }: CampoProps) {
  const idAyuda = ayuda ? `${name}-ayuda` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="etiqueta">
        {etiqueta}
      </label>
      <input
        id={name}
        name={name}
        aria-describedby={idAyuda}
        className={clases.input}
        {...props}
      />
      {ayuda ? (
        <p id={idAyuda} className="text-sm text-tinta-suave">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

// Props para inputs de email: teclado de email y sin autocorrector/mayúscula en iOS.
export const propsEmail = {
  type: "email",
  inputMode: "email",
  autoCapitalize: "none",
  autoCorrect: "off",
  spellCheck: false,
} as const;
