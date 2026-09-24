import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";

// Mensajes en español para errores de Supabase Auth que se repiten en varios forms.
// Devuelve null si el error no es de los comunes (cada form decide el resto).
export function mensajeComun(error: AuthError): string | null {
  if (isAuthRetryableFetchError(error)) {
    return "No pudimos conectarnos. Revisá tu conexión y probá de nuevo.";
  }

  switch (error.code) {
    case "over_email_send_rate_limit":
      return "Mandamos demasiados mails seguidos. Esperá unos minutos y probá de nuevo.";
    case "over_request_rate_limit":
      return "Hiciste muchos intentos seguidos. Esperá un momento y probá de nuevo.";
    case "weak_password":
      return "Esa contraseña es muy fácil de adivinar. Probá con una más larga, que mezcle letras y números.";
    case "email_address_invalid":
      return "Revisá el email: no parece válido.";
    case "request_timeout":
      return "Se cortó la conexión. Probá de nuevo.";
    default:
      return null;
  }
}

// Para errores no previstos: deja rastro en los logs del server sin datos personales.
export function registrarError(donde: string, error: AuthError | { message: string; code?: string }) {
  console.error(`[auth] ${donde}:`, error.code ?? "sin-codigo", error.message);
}
