// La semana usa más ancho: en compu la grilla se ve como tabla. data-ancho le avisa al
// header de (app)/layout.tsx que se alinee a este mismo ancho. Al imprimir, sin márgenes
// propios: los pone @page.
export default function LayoutSemana({ children }: { children: React.ReactNode }) {
  return (
    <div data-ancho="completo" className="mx-auto w-full max-w-5xl px-4 print:max-w-none print:px-0">
      {children}
    </div>
  );
}
