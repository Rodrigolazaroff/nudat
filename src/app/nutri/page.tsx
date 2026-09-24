import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { exigirRol } from "@/lib/perfil";
import { hoyISO } from "@/lib/comidas";
import { sumarDias } from "@/lib/resumen";
import { fechaArgentina, venceEn } from "@/components/nutri/formato";
import { FormInvitar } from "@/components/nutri/form-invitar";
import {
  InvitacionesPendientes,
  type InvitacionPendiente,
} from "@/components/nutri/invitaciones-pendientes";
import { linkInvitacion } from "@/components/nutri/invitacion";
import { ListaPacientes, type PacienteFila } from "@/components/nutri/lista-pacientes";
import { ui } from "@/components/nutri/ui";
import { obtenerOrigen } from "./origen";

export const metadata: Metadata = { title: "Pacientes" };

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Por paciente: última carga (created_at más reciente) y comidas de los últimos 7 días.
// Son 2 consultas chicas por paciente, en paralelo: PostgREST no agrega (max/count
// agrupado) y una sola consulta con todas las comidas podría cortarse en 1000 filas.
async function cargarPacientes(supabase: Supabase, nutriId: string, hoy: string) {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre")
    .eq("nutri_id", nutriId)
    .eq("rol", "paciente");
  if (error) throw new Error(`perfiles: ${error.message}`);

  const desde = sumarDias(hoy, -6);
  const filas = await Promise.all(
    data.map(async (p): Promise<PacienteFila> => {
      const [ultima, semana] = await Promise.all([
        supabase
          .from("comidas")
          .select("created_at")
          .eq("paciente_id", p.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("comidas")
          .select("id", { count: "exact", head: true })
          .eq("paciente_id", p.id)
          .gte("fecha", desde)
          .lte("fecha", hoy),
      ]);
      if (ultima.error) throw new Error(`comidas: ${ultima.error.message}`);
      if (semana.error) throw new Error(`comidas: ${semana.error.message}`);
      return {
        id: p.id,
        nombre: p.nombre,
        ultimaCarga: ultima.data ? fechaArgentina(ultima.data.created_at) : null,
        comidasSemana: semana.count ?? 0,
      };
    }),
  );

  return filas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
}

// Pendientes = no usadas y no vencidas.
async function cargarInvitaciones(
  supabase: Supabase,
  nutriId: string,
  origen: string,
): Promise<InvitacionPendiente[]> {
  const ahora = Date.now();
  const { data, error } = await supabase
    .from("invitaciones")
    .select("id, token, nombre, email, expira_en")
    .eq("nutri_id", nutriId)
    .is("usada_en", null)
    .gt("expira_en", new Date(ahora).toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new Error(`invitaciones: ${error.message}`);

  return data.map((inv) => ({
    id: inv.id,
    nombre: inv.nombre,
    email: inv.email,
    link: linkInvitacion(origen, inv.token),
    vence: venceEn(inv.expira_en, ahora),
  }));
}

export default async function PaginaNutri() {
  const perfil = await exigirRol("nutri");
  const supabase = await createClient();
  const hoy = hoyISO();
  const origen = await obtenerOrigen();

  const [pacientes, invitaciones] = await Promise.all([
    cargarPacientes(supabase, perfil.id, hoy),
    cargarInvitaciones(supabase, perfil.id, origen),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <section aria-labelledby="titulo-pacientes" className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h1 id="titulo-pacientes" className="text-2xl font-semibold tracking-tight">
              Pacientes
            </h1>
            {pacientes.length > 0 ? (
              <span className="text-sm text-tinta-suave tabular-nums">{pacientes.length}</span>
            ) : null}
          </div>
          {/* En el celular el formulario queda abajo de la lista. */}
          {pacientes.length > 0 ? (
            <a href="#invitar" className={`${ui.botonChico} lg:hidden`}>
              Invitar paciente
            </a>
          ) : null}
        </div>
        <ListaPacientes pacientes={pacientes} hoy={hoy} />
      </section>

      <aside className="flex min-w-0 flex-col gap-6">
        <section id="invitar" aria-labelledby="titulo-invitar" className={`${ui.tarjeta} scroll-mt-6`}>
          <h2 id="titulo-invitar" className="text-lg font-semibold tracking-tight">
            Invitar paciente
          </h2>
          <p className="mt-1 mb-4 text-sm text-tinta-suave text-pretty">
            Generá un link para que se registre y empiece a cargar lo que come.
          </p>
          <FormInvitar />
        </section>

        <InvitacionesPendientes invitaciones={invitaciones} />
      </aside>
    </div>
  );
}
