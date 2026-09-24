-- nudat: esquema inicial
--
-- Relación: una nutri tiene N pacientes. Cada paciente carga sus comidas.
-- La seguridad vive acá (RLS), no en la UI: una nutri solo puede leer
-- perfiles, comidas y fotos de SUS pacientes.
--
-- Alta de usuarios (trigger privado.crear_perfil):
--   - nutri:    su email tiene que estar en privado.nutris_habilitadas (se carga a mano).
--   - paciente: solo con un token de invitación vigente generado por su nutri.
--   - cualquier otro registro se rechaza.

create schema if not exists privado;
grant usage on schema privado to authenticated;

create type public.rol as enum ('nutri', 'paciente');
create type public.tipo_comida as enum (
  'desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena', 'colacion'
);

-- ─── Tablas ───────────────────────────────────────────────────────────

-- Emails autorizados a registrarse como nutri. Sin acceso desde la API.
create table privado.nutris_habilitadas (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol public.rol not null,
  nombre text not null default '' check (char_length(nombre) <= 120),
  nutri_id uuid references public.perfiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint nutri_sin_nutri check (rol = 'paciente' or nutri_id is null)
);
create index perfiles_nutri_id_idx on public.perfiles (nutri_id);

create table public.invitaciones (
  id uuid primary key default gen_random_uuid(),
  nutri_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  email text check (email = lower(email)),
  nombre text check (char_length(nombre) <= 120),
  expira_en timestamptz not null default now() + interval '7 days',
  usada_en timestamptz,
  paciente_id uuid references public.perfiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index invitaciones_nutri_id_idx on public.invitaciones (nutri_id);

create table public.comidas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  fecha date not null,
  hora time not null,
  tipo public.tipo_comida not null,
  descripcion text not null default '' check (char_length(descripcion) <= 2000),
  foto_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint foto_o_descripcion check (foto_path is not null or char_length(trim(descripcion)) > 0),
  constraint foto_en_carpeta_propia check (foto_path is null or foto_path like paciente_id::text || '/%')
);
create index comidas_paciente_fecha_idx on public.comidas (paciente_id, fecha);

-- ─── Funciones auxiliares (schema privado: no se exponen por la API) ──

-- security definer para que las políticas de perfiles no se llamen a sí mismas.
create function privado.mi_rol()
returns public.rol
language sql stable security definer set search_path = ''
as $$
  select rol from public.perfiles where id = (select auth.uid());
$$;

create function privado.mi_nutri_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select nutri_id from public.perfiles where id = (select auth.uid());
$$;

-- Recibe texto porque también se usa con la carpeta de storage.
create function privado.es_mi_paciente(p_paciente_id text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id::text = p_paciente_id
      and rol = 'paciente'
      and nutri_id = (select auth.uid())
  );
$$;

revoke execute on all functions in schema privado from public, anon;
grant execute on function privado.mi_rol(), privado.mi_nutri_id(), privado.es_mi_paciente(text)
  to authenticated;

create function privado.tocar_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger comidas_updated_at
  before update on public.comidas
  for each row execute function privado.tocar_updated_at();

-- ─── Alta de usuarios ─────────────────────────────────────────────────

create function privado.crear_perfil()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_nombre text := trim(coalesce(new.raw_user_meta_data ->> 'nombre', ''));
  v_token uuid;
  v_inv public.invitaciones%rowtype;
begin
  if exists (select 1 from privado.nutris_habilitadas where email = lower(new.email)) then
    insert into public.perfiles (id, rol, nombre) values (new.id, 'nutri', v_nombre);
    return new;
  end if;

  begin
    v_token := (new.raw_user_meta_data ->> 'invitacion')::uuid;
  exception when invalid_text_representation then
    v_token := null;
  end;

  select * into v_inv
  from public.invitaciones
  where token = v_token
    and usada_en is null
    and expira_en > now()
    and (email is null or email = lower(new.email))
  for update;

  if not found then
    raise exception 'nudat: registro solo por invitacion';
  end if;

  insert into public.perfiles (id, rol, nombre, nutri_id)
  values (new.id, 'paciente', coalesce(nullif(v_nombre, ''), v_inv.nombre, ''), v_inv.nutri_id);

  update public.invitaciones
  set usada_en = now(), paciente_id = new.id
  where id = v_inv.id;

  return new;
end;
$$;

revoke execute on function privado.crear_perfil() from public, anon, authenticated;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function privado.crear_perfil();

-- Pantalla de registro: muestra quién invita antes de crear la cuenta.
-- Única función accesible sin login; el token es un uuid no adivinable.
create function public.ver_invitacion(p_token uuid)
returns table (nutri_nombre text, email text, nombre text)
language sql stable security definer set search_path = ''
as $$
  select p.nombre, i.email, i.nombre
  from public.invitaciones i
  join public.perfiles p on p.id = i.nutri_id
  where i.token = p_token
    and i.usada_en is null
    and i.expira_en > now();
$$;

revoke execute on function public.ver_invitacion(uuid) from public;
grant execute on function public.ver_invitacion(uuid) to anon, authenticated;

-- ─── Permisos por columna ─────────────────────────────────────────────
-- Nadie puede cambiarse el rol ni la nutri desde la app.

revoke all on public.perfiles, public.invitaciones, public.comidas from anon, authenticated;

grant select on public.perfiles to authenticated;
grant update (nombre) on public.perfiles to authenticated;

grant select, delete on public.invitaciones to authenticated;
grant insert (email, nombre) on public.invitaciones to authenticated;

grant select, delete on public.comidas to authenticated;
grant insert (fecha, hora, tipo, descripcion, foto_path) on public.comidas to authenticated;
grant update (fecha, hora, tipo, descripcion, foto_path) on public.comidas to authenticated;

-- ─── RLS ──────────────────────────────────────────────────────────────

alter table privado.nutris_habilitadas enable row level security;
alter table public.perfiles enable row level security;
alter table public.invitaciones enable row level security;
alter table public.comidas enable row level security;

-- perfiles: el propio, los pacientes de la nutri, y la nutri del paciente.
create policy "perfiles: ver propio y vinculados"
  on public.perfiles for select to authenticated
  using (
    id = (select auth.uid())
    or nutri_id = (select auth.uid())
    or id = (select privado.mi_nutri_id())
  );

create policy "perfiles: editar propio"
  on public.perfiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- invitaciones: solo la nutri que las creó.
create policy "invitaciones: nutri ve las suyas"
  on public.invitaciones for select to authenticated
  using (nutri_id = (select auth.uid()));

create policy "invitaciones: nutri crea"
  on public.invitaciones for insert to authenticated
  with check (
    nutri_id = (select auth.uid())
    and (select privado.mi_rol()) = 'nutri'
  );

create policy "invitaciones: nutri borra pendientes"
  on public.invitaciones for delete to authenticated
  using (nutri_id = (select auth.uid()) and usada_en is null);

-- comidas: el paciente maneja las suyas; la nutri solo lee las de sus pacientes.
create policy "comidas: ver propias o de mis pacientes"
  on public.comidas for select to authenticated
  using (
    paciente_id = (select auth.uid())
    or (select privado.es_mi_paciente(paciente_id::text))
  );

create policy "comidas: paciente crea"
  on public.comidas for insert to authenticated
  with check (
    paciente_id = (select auth.uid())
    and (select privado.mi_rol()) = 'paciente'
  );

create policy "comidas: paciente edita"
  on public.comidas for update to authenticated
  using (paciente_id = (select auth.uid()))
  with check (paciente_id = (select auth.uid()));

create policy "comidas: paciente borra"
  on public.comidas for delete to authenticated
  using (paciente_id = (select auth.uid()));

-- ─── Storage: fotos de comidas ────────────────────────────────────────
-- Bucket privado. Ruta: {paciente_id}/{archivo}. Se sirven con URL firmada.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-comidas', 'fotos-comidas', false, 5242880, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

create policy "fotos: paciente sube a su carpeta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fotos-comidas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "fotos: ver propias o de mis pacientes"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'fotos-comidas'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or privado.es_mi_paciente((storage.foldername(name))[1])
    )
  );

create policy "fotos: paciente reemplaza las suyas"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'fotos-comidas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "fotos: paciente borra las suyas"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'fotos-comidas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
