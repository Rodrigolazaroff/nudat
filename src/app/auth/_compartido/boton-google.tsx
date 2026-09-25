"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MensajeError, clases } from "./ui";

// Login / registro con Google (OAuth con PKCE). Google vuelve a /auth/confirm con un
// `code` que se canjea en el servidor; si la persona es nueva, el trigger de la base le
// crea el perfil con el nombre de su cuenta de Google.
export function BotonGoogle() {
  const [yendo, setYendo] = useState(false);
  const [error, setError] = useState(false);

  async function continuar() {
    setYendo(true);
    setError(false);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`,
        // Deja elegir cuenta aunque haya una sola sesión de Google abierta.
        queryParams: { prompt: "select_account" },
      },
    });
    // Si salió bien, el navegador ya se está yendo a Google.
    if (error) {
      console.error("[auth/google]", error.message);
      setError(true);
      setYendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={continuar}
        disabled={yendo}
        className={`${clases.botonSecundario} gap-3 disabled:opacity-60`}
      >
        <LogoGoogle />
        {yendo ? "Abriendo Google…" : "Continuar con Google"}
      </button>
      {error ? (
        <MensajeError>No pudimos conectar con Google. Probá de nuevo o usá tu email.</MensajeError>
      ) : null}
    </div>
  );
}

export function SeparadorO() {
  return (
    <div className="flex items-center gap-3 text-sm text-tinta-suave" aria-hidden="true">
      <span className="h-px flex-1 bg-borde" />o<span className="h-px flex-1 bg-borde" />
    </div>
  );
}

// "G" oficial de Google (colores de marca, van tal cual según sus guías).
function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="size-5 shrink-0">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
