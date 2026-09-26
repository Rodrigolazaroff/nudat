import type { ReactNode } from "react";

/**
 * Dos voces para el mismo dato: voseo en pantalla (le habla a quien carga) y tercera
 * persona en la hoja impresa (la lee su nutri).
 */
export function Voz({ pantalla, impresion }: { pantalla: ReactNode; impresion: ReactNode }) {
  return (
    <>
      <span className="print:hidden">{pantalla}</span>
      <span className="hidden print:inline">{impresion}</span>
    </>
  );
}
