"use client";

import { useEffect, useRef, useState } from "react";

async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Sin permiso: probamos el método viejo.
  }
  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function BotonCopiar({
  texto,
  etiqueta = "Copiar link",
  className,
}: {
  texto: string;
  etiqueta?: string;
  className: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  async function copiar() {
    if (!(await copiarAlPortapapeles(texto))) {
      // Último recurso: que lo copie a mano.
      window.prompt("Copiá el link:", texto);
      return;
    }
    setCopiado(true);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <button type="button" onClick={copiar} className={className}>
        {copiado ? "¡Copiado!" : etiqueta}
      </button>
      <span className="sr-only" aria-live="polite">
        {copiado ? "Link copiado" : ""}
      </span>
    </>
  );
}
