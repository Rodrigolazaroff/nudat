import type { Metadata } from "next";
import { obtenerPerfil } from "@/lib/perfil";
import { horaActual, hoyISO } from "@/lib/comidas";
import { fechaDeParam } from "@/components/comidas/fechas";
import { EncabezadoFormulario } from "@/components/comidas/encabezado-formulario";
import { FormularioComida } from "@/components/comidas/formulario-comida";

export const metadata: Metadata = { title: "Nuevo registro · nudat" };

// Envoltorio de servidor: exige sesión y le pasa al formulario (client component) el id del
// usuario para armar la ruta de la foto, sin tener que pedirle el usuario a Supabase Auth.
export default async function PaginaNuevaComida({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const perfil = await obtenerPerfil();
  const hoy = hoyISO();
  const fecha = fechaDeParam((await searchParams).fecha, hoy);

  return (
    <>
      <EncabezadoFormulario titulo="Nuevo registro" volverA={`/?fecha=${fecha}`} />
      <FormularioComida
        usuarioId={perfil.id}
        hoy={hoy}
        valores={{ fecha, hora: horaActual(), tipo: null, descripcion: "" }}
      />
    </>
  );
}
