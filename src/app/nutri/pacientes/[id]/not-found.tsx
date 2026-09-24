import Link from "next/link";
import { ui } from "@/components/nutri/ui";

export default function PacienteNoEncontrado() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold">No encontramos este paciente</h1>
      <p className="text-tinta-suave text-pretty">
        Puede que el link esté mal o que no sea uno de tus pacientes.
      </p>
      <Link href="/nutri" className={ui.botonPrimario}>
        Ver mis pacientes
      </Link>
    </div>
  );
}
