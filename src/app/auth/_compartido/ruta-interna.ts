// Valida un destino de redirección que viene de afuera (query string, form).
// Devuelve la ruta solo si es interna del sitio ("/algo"); si no, null.
// Evita open redirects del estilo "//evil.com", "/\evil.com" o "https://evil.com".

const BASE = "http://nudat.invalid";

export function rutaInterna(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) {
    return null;
  }

  let url: URL;
  try {
    // El parser descarta tabs/saltos de línea, así que "/\t/evil.com" termina
    // siendo "//evil.com" y cambia el origin: por eso se compara después de parsear.
    url = new URL(valor, BASE);
  } catch {
    return null;
  }
  if (url.origin !== BASE) return null;

  const ruta = `${url.pathname}${url.search}${url.hash}`;
  // "/.//evil.com" se normaliza a "//evil.com": también afuera.
  if (ruta.startsWith("//")) return null;
  return ruta;
}
