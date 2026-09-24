import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { exigirRol } from "@/lib/perfil";
import { ui } from "@/components/nutri/ui";

export const metadata: Metadata = {
  title: { template: "%s · nudat", default: "nudat" },
};

export default async function LayoutNutri({ children }: { children: ReactNode }) {
  const perfil = await exigirRol("nutri");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-borde bg-superficie print:hidden">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link
            href="/nutri"
            className={`rounded text-xl font-semibold tracking-tight text-primario ${ui.foco}`}
          >
            nudat
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm text-tinta-suave">
              {perfil.nombre || "Nutricionista"}
            </span>
            <form action="/auth/cerrar-sesion" method="post">
              <button type="submit" className={ui.botonChico}>
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
