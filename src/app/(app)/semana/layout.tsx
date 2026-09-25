// La semana usa más ancho: en compu la grilla se ve como tabla y así también se imprime.
export default function LayoutSemana({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-4">{children}</div>;
}
