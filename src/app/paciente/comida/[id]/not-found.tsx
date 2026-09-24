import Link from "next/link";

export default function ComidaNoEncontrada() {
  return (
    <div className="mt-10 flex flex-col items-center px-4 text-center">
      <h1 className="text-xl font-semibold">No encontramos esa comida</h1>
      <p className="mt-2 max-w-xs text-sm text-tinta-suave">
        Puede que la hayas eliminado o que el enlace esté incompleto.
      </p>
      <Link
        href="/paciente"
        className="mt-6 flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-primario px-5 font-medium text-sobre-primario hover:bg-primario-hover"
      >
        Ir a mis comidas de hoy
      </Link>
    </div>
  );
}
