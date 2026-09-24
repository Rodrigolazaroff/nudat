"use client";

import { useState, type ComponentProps } from "react";
import { clases } from "./ui";

type CampoClaveProps = Omit<ComponentProps<"input">, "id" | "name" | "type" | "className"> & {
  name: string;
  etiqueta: string;
  ayuda?: string;
};

// Contraseña con botón "Mostrar": en el celular es fácil equivocarse tipeando.
export function CampoClave({ name, etiqueta, ayuda, ...props }: CampoClaveProps) {
  const [visible, setVisible] = useState(false);
  const idAyuda = ayuda ? `${name}-ayuda` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={idAyuda}
          className={`${clases.input} pr-24`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-controls={name}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute inset-y-0 right-0 flex min-w-12 items-center justify-center rounded-r-xl px-4 text-sm font-medium text-primario focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primario"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {ayuda ? (
        <p id={idAyuda} className="text-sm text-tinta-suave">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}
