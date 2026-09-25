import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PantallaAuth, clases } from "@/app/auth/_compartido/ui";
import { FormRegistro } from "./form-registro";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default async function RegistroPage() {
  const supabase = await createClient();
  const { data: sesion } = await supabase.auth.getClaims();
  if (sesion?.claims) return <SesionAbierta />;

  return <FormRegistro />;
}

function SesionAbierta() {
  return (
    <PantallaAuth
      titulo="Ya tenés una sesión abierta"
      bajada={
        <p>
          Para crear una cuenta nueva en este dispositivo, primero cerrá la sesión actual.
        </p>
      }
    >
      <form action="/auth/cerrar-sesion" method="post">
        <input type="hidden" name="next" value="/registro" />
        <button type="submit" className={clases.botonPrimario}>
          Cerrar sesión y seguir
        </button>
      </form>
      <Link href="/" className={clases.botonSecundario}>
        Ir a mi cuenta
      </Link>
    </PantallaAuth>
  );
}
