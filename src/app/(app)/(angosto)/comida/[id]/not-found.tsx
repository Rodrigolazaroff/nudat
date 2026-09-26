import Link from "next/link";

export default function ComidaNoEncontrada() {
  return (
    <div className="mt-10 flex flex-col items-center px-4 text-center">
      <h1 className="text-xl font-semibold">No encontramos ese registro</h1>
      <p className="mt-2 max-w-xs text-sm text-pretty text-tinta-suave">
        Puede que lo hayas eliminado o que el enlace esté incompleto.
      </p>
      <Link
        href="/"
        className="mt-6 flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-primario px-5 font-medium text-sobre-primario outline-none transition-colors hover:bg-primario-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none"
      >
        Ir a hoy
      </Link>
    </div>
  );
}
