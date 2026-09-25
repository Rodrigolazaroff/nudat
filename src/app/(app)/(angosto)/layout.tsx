// Pantallas de uso diario (hoy, cargar, historial): columna angosta pensada para el celular.
export default function LayoutAngosto({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-lg px-4">{children}</div>;
}
