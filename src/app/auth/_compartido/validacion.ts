// Validaciones compartidas por los forms de auth (cliente y servidor).

export const CLAVE_MIN = 8;
// Límite de Supabase Auth (bcrypt): más de 72 caracteres se rechaza.
export const CLAVE_MAX = 72;
export const NOMBRE_MAX = 120;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esEmail(valor: string): boolean {
  return valor.length <= 254 && EMAIL.test(valor);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esUuid(valor: string): boolean {
  return UUID.test(valor);
}

// Texto de un campo de FormData, recortado. Nunca null.
export function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === "string" ? valor.trim() : "";
}

// Las contraseñas no se recortan: un espacio al final es parte de la clave.
export function clave(valor: FormDataEntryValue | null): string {
  return typeof valor === "string" ? valor : "";
}

export function errorDeClave(valor: string): string | null {
  if (valor.length < CLAVE_MIN) {
    return `La contraseña tiene que tener al menos ${CLAVE_MIN} caracteres.`;
  }
  if (valor.length > CLAVE_MAX) {
    return `La contraseña puede tener hasta ${CLAVE_MAX} caracteres.`;
  }
  return null;
}
