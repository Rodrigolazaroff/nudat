import type { Metadata } from "next";
import Link from "next/link";
import { PantallaAuth, Tarjeta, clases } from "@/app/auth/_compartido/ui";

export const metadata: Metadata = {
  title: "Privacidad",
};

const CONTACTO = "rodrigolazaroff@gmail.com";

// Pública (ver RUTAS_PUBLICAS en lib/supabase/proxy.ts): Google la pide para
// publicar la pantalla de consentimiento de OAuth.
export default function PrivacidadPage() {
  return (
    <PantallaAuth
      titulo="Política de privacidad"
      bajada={<p>Última actualización: 25 de septiembre de 2026.</p>}
      pie={
        <Link href="/login" className={clases.link}>
          Volver a nudat
        </Link>
      }
    >
      <Tarjeta>
        <div className="flex flex-col divide-y divide-borde text-pretty [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-tight [&_p]:mt-1.5 [&_p]:leading-relaxed [&_p]:text-tinta-suave [&_section]:py-4 [&_section:first-child]:pt-0 [&_section:last-child]:pb-0">
          <section>
            <h2>Qué guardamos</h2>
            <p>
              Tu email y tu nombre (si entrás con Google, los que tiene tu cuenta de Google), y lo
              que cargás: fecha, hora, tipo, descripción y foto de cada comida o bebida.
            </p>
          </section>
          <section>
            <h2>Para qué</h2>
            <p>
              Solo para que puedas ingresar y ver tu registro y tu resumen semanal. No usamos tus
              datos para publicidad, no los vendemos ni los compartimos con nadie.
            </p>
          </section>
          <section>
            <h2>Quién los ve</h2>
            <p>
              Solo vos. Cada cuenta accede únicamente a sus propias comidas y fotos; las fotos se
              guardan en privado y se muestran con links que vencen.
            </p>
          </section>
          <section>
            <h2>Dónde se guardan</h2>
            <p>
              En Supabase (base de datos y fotos, en São Paulo, Brasil) y la app corre en Vercel.
              Con Google solo pedimos tu email y tu perfil básico.
            </p>
          </section>
          <section>
            <h2>Borrar tus datos</h2>
            <p>
              Podés borrar cualquier comida desde la app. Para borrar tu cuenta con todo lo que
              cargaste, escribí a{" "}
              <a href={`mailto:${CONTACTO}`} className={clases.link}>
                {CONTACTO}
              </a>{" "}
              desde el email de la cuenta.
            </p>
          </section>
        </div>
      </Tarjeta>
    </PantallaAuth>
  );
}
