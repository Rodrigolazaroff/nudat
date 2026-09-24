import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { registrarError } from "@/app/auth/_compartido/errores";
import { PantallaAuth, clases } from "@/app/auth/_compartido/ui";
import { esUuid } from "@/app/auth/_compartido/validacion";
import { FormRegistro } from "./form-registro";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// /registro?invitacion=<uuid> → paciente invitado por su nutri.
// /registro                   → nutricionista (su email se habilita a mano en la base).
export default async function RegistroPage({ searchParams }: Props) {
  const params = await searchParams;
  const crudo = params.invitacion;
  const token = Array.isArray(crudo) ? crudo[0] : crudo;

  const supabase = await createClient();

  const { data: sesion } = await supabase.auth.getClaims();
  if (sesion?.claims) {
    const aca = token !== undefined ? `/registro?invitacion=${encodeURIComponent(token)}` : "/registro";
    return <SesionAbierta volverA={aca} />;
  }

  if (token === undefined) return <FormRegistro />;

  if (!esUuid(token)) return <InvitacionInvalida />;

  const { data, error } = await supabase.rpc("ver_invitacion", { p_token: token });
  if (error) {
    registrarError("registro/ver_invitacion", error);
    return <InvitacionSinVerificar />;
  }

  const invitacion = data?.[0];
  if (!invitacion) return <InvitacionInvalida />;

  return (
    <FormRegistro
      invitacion={{
        token,
        nutriNombre: invitacion.nutri_nombre?.trim() || "tu nutri",
        email: invitacion.email,
        nombre: invitacion.nombre,
      }}
    />
  );
}

function InvitacionInvalida() {
  return (
    <PantallaAuth
      titulo="La invitación venció o no es válida"
      bajada={
        <p>
          Los links de invitación duran 7 días y sirven una sola vez. Pedile a tu nutri que
          te mande uno nuevo.
        </p>
      }
    >
      <Link href="/login" className={clases.botonSecundario}>
        Ya tengo cuenta, ingresar
      </Link>
    </PantallaAuth>
  );
}

function InvitacionSinVerificar() {
  return (
    <PantallaAuth
      titulo="No pudimos abrir la invitación"
      bajada={<p>Puede ser un problema de conexión. Probá de nuevo en un rato.</p>}
    >
      <Link href="/login" className={clases.botonSecundario}>
        Ir a ingresar
      </Link>
    </PantallaAuth>
  );
}

function SesionAbierta({ volverA }: { volverA: string }) {
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
        <input type="hidden" name="next" value={volverA} />
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
