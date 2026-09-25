import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BotonGoogle, SeparadorO } from "@/app/auth/_compartido/boton-google";
import { MensajeError, PantallaAuth, Tarjeta, clases } from "@/app/auth/_compartido/ui";
import { FormLogin } from "./form-login";

export const metadata: Metadata = {
  title: "Ingresar",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const codigo = typeof error === "string" ? error : undefined;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims);

  // Con sesión no tiene sentido el login. Excepción: "sin-perfil" viene justamente
  // de "/" (sesión sin perfil); redirigir ahí haría un loop.
  if (conSesion && codigo !== "sin-perfil") redirect("/");

  return (
    <PantallaAuth
      titulo="Ingresá a tu cuenta"
      bajada="Tu registro de comidas y bebidas del día."
      pie={
        <p>
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className={clases.link}>
            Creá una
          </Link>
        </p>
      }
    >
      {codigo === "sin-perfil" ? (
        <MensajeError>
          <p>
            No pudimos cargar tu perfil. Cerrá sesión y volvé a ingresar; si sigue
            pasando, probá con otra cuenta.
          </p>
          {conSesion ? (
            <form action="/auth/cerrar-sesion" method="post" className="mt-1">
              <button
                type="submit"
                className="inline-flex min-h-12 items-center font-medium underline underline-offset-4"
              >
                Cerrar sesión
              </button>
            </form>
          ) : null}
        </MensajeError>
      ) : null}

      {codigo === "link-invalido" ? (
        <MensajeError>
          <p>
            El link venció o ya se usó. Si ya confirmaste tu cuenta, ingresá con tu email
            y contraseña.
          </p>
          <p className="mt-2">
            ¿Querías cambiar la contraseña?{" "}
            <Link href="/login/recuperar" className="font-medium underline underline-offset-4">
              Pedí un link nuevo
            </Link>
            .
          </p>
        </MensajeError>
      ) : null}

      {codigo === "google" ? (
        <MensajeError>
          <p>No pudimos ingresar con Google. Probá de nuevo o usá tu email.</p>
        </MensajeError>
      ) : null}

      <BotonGoogle />
      <SeparadorO />

      <Tarjeta>
        <FormLogin />
      </Tarjeta>
    </PantallaAuth>
  );
}
