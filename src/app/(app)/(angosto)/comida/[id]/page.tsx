import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obtenerPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/comidas";
import { firmarFotos } from "@/components/comidas/firmar-fotos";
import { EncabezadoFormulario } from "@/components/comidas/encabezado-formulario";
import { FormularioComida } from "@/components/comidas/formulario-comida";

export const metadata: Metadata = { title: "Editar registro" };

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PaginaComida({ params }: { params: Promise<{ id: string }> }) {
  const perfil = await obtenerPerfil();
  const { id } = await params;
  // Un id mal formado haría fallar la consulta (uuid inválido): es un 404, no un error.
  if (!RE_UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: comida, error } = await supabase
    .from("comidas")
    .select("id, fecha, hora, tipo, descripcion, foto_path")
    .eq("id", id)
    .eq("usuario_id", perfil.id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar la comida: ${error.message}`);
  if (!comida) notFound();

  const urls = await firmarFotos(supabase, [comida.foto_path]);

  return (
    <>
      <EncabezadoFormulario titulo="Editar registro" volverA={`/?fecha=${comida.fecha}`} />
      <FormularioComida
        // Si se navega de una comida a otra, que el formulario arranque de cero.
        key={comida.id}
        usuarioId={perfil.id}
        hoy={hoyISO()}
        valores={{
          fecha: comida.fecha,
          hora: comida.hora.slice(0, 5),
          tipo: comida.tipo,
          descripcion: comida.descripcion,
        }}
        comida={{
          id: comida.id,
          fotoPath: comida.foto_path,
          fotoUrl: comida.foto_path ? (urls.get(comida.foto_path) ?? null) : null,
        }}
      />
    </>
  );
}
