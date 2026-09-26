// Toque háptico corto para confirmar acciones clave (guardar, eliminar, empezar a dictar).
// Solo existe en Android (Chrome); en iOS y escritorio no hace nada, sin avisar.
// Usarlo poco: si vibra todo, no significa nada.
export function vibrar(patron: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(patron);
    }
  } catch {
    // Bloqueado (sin interacción previa, iframe, política): se sigue sin háptica.
  }
}
