import type { Metadata } from "next";
import Link from "next/link";
import { PantallaAuth, Tarjeta, clases } from "@/app/auth/_compartido/ui";
import { FormRecuperar } from "./form-recuperar";

// Vive bajo /login para quedar pública sin tocar el proxy (que deja pasar /login/*).
export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

export default function RecuperarPage() {
  return (
    <PantallaAuth
      titulo="Recuperá tu contraseña"
      pie={
        <Link href="/login" className={`${clases.link} inline-flex min-h-12 items-center`}>
          Volver a ingresar
        </Link>
      }
    >
      <Tarjeta>
        <FormRecuperar />
      </Tarjeta>
    </PantallaAuth>
  );
}
