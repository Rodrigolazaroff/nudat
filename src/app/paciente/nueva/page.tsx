import type { Metadata } from "next";
import { exigirRol } from "@/lib/perfil";
import { horaActual, hoyISO } from "@/lib/comidas";
import { fechaDeParam } from "@/components/paciente/fechas";
import { EncabezadoFormulario } from "@/components/paciente/encabezado-formulario";
import { FormularioComida } from "@/components/paciente/formulario-comida";

export const metadata: Metadata = { title: "Nueva comida · nudat" };

// Envoltorio de servidor: valida el rol y le pasa al formulario (client component) el id del
// paciente para armar la ruta de la foto, sin tener que pedirle el usuario a Supabase Auth.
export default async function PaginaNuevaComida({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const perfil = await exigirRol("paciente");
  const hoy = hoyISO();
  const fecha = fechaDeParam((await searchParams).fecha, hoy);

  return (
    <>
      <EncabezadoFormulario titulo="Nueva comida" volverA={`/paciente?fecha=${fecha}`} />
      <FormularioComida
        pacienteId={perfil.id}
        hoy={hoy}
        valores={{ fecha, hora: horaActual(), tipo: null, descripcion: "" }}
      />
    </>
  );
}
