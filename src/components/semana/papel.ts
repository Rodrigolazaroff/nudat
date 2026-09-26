// Cómo se ve un bloque con bisel en la hoja impresa: sin bandeja, sin brillo, sin sombra ni
// fondo (el papel es blanco y en B/N). Queda un recuadro fino en tinta.
// Uso: <div className={`bisel ${papel.bisel}`}><div className={`bisel-nucleo ${papel.nucleo}`}>…
export const papel = {
  bisel: "print:rounded-none print:bg-transparent print:p-0 print:shadow-none",
  nucleo:
    "print:rounded-none print:bg-transparent print:shadow-none print:border print:border-tinta-suave",
};
