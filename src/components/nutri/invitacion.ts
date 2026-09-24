// Links de invitación. Sin dependencias de server: se usa también en el navegador.

export function linkInvitacion(origen: string, token: string): string {
  return `${origen}/registro?invitacion=${encodeURIComponent(token)}`;
}

/** wa.me sin número: WhatsApp abre el selector de contacto con el mensaje escrito. */
export function linkWhatsApp(nombre: string | null, link: string): string {
  const primerNombre = nombre?.trim().split(/\s+/)[0];
  const saludo = primerNombre ? `Hola ${primerNombre}!` : "Hola!";
  const mensaje = `${saludo} Para registrar tus comidas entrá acá: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}
