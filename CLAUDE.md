@AGENTS.md

# nudat

Registro alimentario para pacientes de nutricionistas. El paciente carga cada comida
(tipo, fecha, hora, foto y descripción) y su nutri ve lo cargado en una grilla semanal
con un resumen.

## Modelo

- Roles: `nutri` y `paciente`. Una nutri tiene N pacientes; cada paciente tiene una sola nutri (`perfiles.nutri_id`).
- **La seguridad está en la base (RLS), no en la UI.** Una nutri solo ve perfiles, comidas y fotos de sus pacientes. Todo cambio de esquema va con sus políticas.
- Alta solo por invitación: la nutri genera un link (`invitaciones.token`) y el paciente se registra con `?invitacion=<token>`. El trigger `privado.crear_perfil` crea el perfil y rechaza cualquier registro sin invitación.
- Nutris: se habilitan a mano cargando su email en `privado.nutris_habilitadas` (SQL editor) y después se registran normalmente.
- Nadie puede cambiarse `rol` ni `nutri_id` desde la app (grants por columna).
- Fotos: bucket privado `fotos-comidas`, ruta `{paciente_id}/{archivo}`, se muestran con URL firmada. Se comprimen en el cliente antes de subir.
- Funciones auxiliares de RLS en el schema `privado` (no expuesto por la API).

## Stack

- Next.js 16 (App Router, `src/`), React 19, TypeScript, Tailwind 4.
  - Ojo: en Next 16 `middleware` pasó a llamarse `proxy` → `src/proxy.ts`.
- Supabase: Auth (email + contraseña), Postgres con RLS, Storage.
  - Clientes en `src/lib/supabase/` (`client.ts` navegador, `server.ts` server, `proxy.ts` refresco de sesión).
  - Migraciones en `supabase/migrations/`.
- UI en español (Argentina). Pensada mobile-first: los pacientes cargan desde el celular.

## Levantar

```bash
cp .env.example .env.local   # completar URL y publishable key de Supabase
npm install
npm run dev                  # http://localhost:3000
```

Migraciones con la CLI (`npx supabase`):

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

## Deploy

- GitHub: https://github.com/Rodrigolazaroff/nudat (branch `main`)
- Vercel: https://nudat.vercel.app — deploy automático al pushear a `main`.
- Variables en Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- En Supabase → Authentication → URL Configuration: Site URL `https://nudat.vercel.app` y redirect URLs para `http://localhost:3000/**` y `https://nudat.vercel.app/**`.
