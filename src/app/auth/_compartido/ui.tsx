import type { ComponentProps, ReactNode } from "react";
import { Logo } from "@/components/logo";

// Piezas visuales de las pantallas de auth (login, registro, recuperar, nueva clave).
// Sin hooks: se pueden usar desde Server y Client Components.

const foco =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario";

export const clases = {
  botonPrimario: `inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primario px-5 font-medium text-sobre-primario transition-colors hover:bg-primario-hover disabled:opacity-50 ${foco}`,
  botonSecundario: `inline-flex h-12 w-full items-center justify-center rounded-xl border border-borde bg-superficie px-5 font-medium text-tinta transition-colors hover:bg-fondo ${foco}`,
  input:
    "h-12 w-full rounded-xl border border-borde bg-superficie px-4 text-base text-tinta outline-none focus:border-primario focus:ring-2 focus:ring-primario/20 read-only:bg-fondo read-only:text-tinta-suave",
  tarjeta: "rounded-2xl border border-borde bg-superficie p-5",
  error: "rounded-xl bg-peligro-suave px-4 py-3 text-sm text-peligro",
  aviso: "rounded-xl bg-primario-suave px-4 py-3 text-sm text-tinta",
  link: `rounded font-medium text-primario underline-offset-4 hover:underline ${foco}`,
};

export function Marca() {
  return (
    <p>
      <Logo className="text-2xl" />
    </p>
  );
}

// Columna centrada para todas las pantallas de auth. Mobile-first: en el celular
// arranca arriba (el teclado no tapa el form); desde sm se centra vertical.
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
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-12 pb-10 sm:justify-center sm:pt-10">
      <Marca />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight text-balance">{titulo}</h1>
      {bajada ? <div className="mt-2 text-tinta-suave text-pretty">{bajada}</div> : null}
      <div className="mt-6 flex flex-col gap-4">{children}</div>
      {pie ? <div className="mt-8 text-center text-sm text-tinta-suave text-pretty">{pie}</div> : null}
    </main>
  );
}

export function Tarjeta({ children }: { children: ReactNode }) {
  return <div className={clases.tarjeta}>{children}</div>;
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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
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
