import type { createClient } from "@/lib/supabase/server";
import { BUCKET_FOTOS } from "@/lib/comidas";

type ClienteServidor = Awaited<ReturnType<typeof createClient>>;

const UNA_HORA = 60 * 60;

/**
 * URLs firmadas (1 hora) para varias fotos en un solo pedido. Solo para server components.
 * Devuelve path → URL; si algo falla se omite y la tarjeta muestra el ícono en lugar de la foto.
 */
export async function firmarFotos(
  supabase: ClienteServidor,
  paths: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unicos = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const urls = new Map<string, string>();
  if (unicos.length === 0) return urls;

  const { data, error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .createSignedUrls(unicos, UNA_HORA);
  if (error) {
    console.error("No se pudieron firmar las fotos", error.message);
    return urls;
  }
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl);
  }
  return urls;
}
