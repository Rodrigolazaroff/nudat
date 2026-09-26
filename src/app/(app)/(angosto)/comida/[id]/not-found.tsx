import Link from "next/link";

export default function ComidaNoEncontrada() {
  return (
    <div className="bisel entrar mt-2">
      <div className="bisel-nucleo flex flex-col items-center px-6 py-10 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">
          No encontramos ese registro
        </h1>
        <Link href="/" className="boton boton-primario foco mt-8 w-full max-w-xs">
          Ir a hoy
        </Link>
      </div>
    </div>
  );
}
