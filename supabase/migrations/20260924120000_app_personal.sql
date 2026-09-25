-- nudat: la app pasa a ser personal.
--
-- Cada persona crea su cuenta (email + contraseña o Google) y registra sus comidas
-- y bebidas. Se elimina la relación nutri/paciente: roles, invitaciones y la
-- habilitación de nutris. La seguridad sigue en RLS: cada usuario ve y maneja
-- solo lo suyo (perfil, comidas y fotos).

-- ─── 1. Políticas del modelo nutri/paciente ───────────────────────────

drop policy "perfiles: ver propio y vinculados" on public.perfiles;
drop policy "comidas: ver propias o de mis pacientes" on public.comidas;
drop policy "comidas: paciente crea" on public.comidas;
drop policy "comidas: paciente edita" on public.comidas;
drop policy "comidas: paciente borra" on public.comidas;
drop policy "fotos: paciente sube a su carpeta" on storage.objects;
drop policy "fotos: ver propias o de mis pacientes" on storage.objects;
drop policy "fotos: paciente reemplaza las suyas" on storage.objects;
drop policy "fotos: paciente borra las suyas" on storage.objects;

-- ─── 2. Invitaciones, nutris y roles ──────────────────────────────────

drop function public.ver_invitacion(uuid);
drop table public.invitaciones;
drop table privado.nutris_habilitadas;

drop function privado.mi_rol();
drop function privado.mi_nutri_id();
drop function privado.es_mi_paciente(text);

alter table public.perfiles drop constraint nutri_sin_nutri;
alter table public.perfiles drop column nutri_id;
alter table public.perfiles drop column rol;
drop type public.rol;

-- ─── 3. Comidas: del paciente al usuario, y bebidas ───────────────────

alter table public.comidas rename column paciente_id to usuario_id;
alter index public.comidas_paciente_fecha_idx rename to comidas_usuario_fecha_idx;

-- Una bebida suelta (agua, café, alcohol...) se registra como un tipo más.
-- No se usa en esta migración: Postgres no deja usar un valor nuevo de enum
-- en la misma transacción en la que se agrega.
alter type public.tipo_comida add value 'bebida';

-- ─── 4. Alta de usuarios: todo registro crea su perfil ────────────────
-- Nombre: `nombre` (registro con email) o `full_name` / `name` (Google).
-- Nunca bloquea el alta.

create or replace function privado.crear_perfil()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    left(trim(coalesce(
      nullif(new.raw_user_meta_data ->> 'nombre', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      ''
    )), 120)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ─── 5. RLS: cada persona, lo suyo ────────────────────────────────────

create policy "perfiles: ver propio"
  on public.perfiles for select to authenticated
  using (id = (select auth.uid()));

create policy "comidas: ver propias"
  on public.comidas for select to authenticated
  using (usuario_id = (select auth.uid()));

create policy "comidas: crear propias"
  on public.comidas for insert to authenticated
  with check (usuario_id = (select auth.uid()));

create policy "comidas: editar propias"
  on public.comidas for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "comidas: borrar propias"
  on public.comidas for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- ─── 6. Storage: fotos en la carpeta propia ({usuario_id}/archivo) ─────

create policy "fotos: subir a carpeta propia"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fotos-comidas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "fotos: ver propias"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'fotos-comidas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "fotos: reemplazar propias"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'fotos-comidas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'fotos-comidas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "fotos: borrar propias"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'fotos-comidas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
