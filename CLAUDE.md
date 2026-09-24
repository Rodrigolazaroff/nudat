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

Tipos de la base (con la CLI logueada):

```bash
npx supabase gen types typescript --project-id cqlayawlvfberojffogu > src/lib/database.types.ts
```

## Demo

Hay cuentas de prueba con emails `@demo.test` (1 nutri, 2 pacientes con una semana de comidas sin fotos).
Se crearon a mano en el SQL editor; para borrarlas: `supabase/demo/borrar-demo.sql`.

## Deploy

- GitHub: https://github.com/Rodrigolazaroff/nudat (branch `main`)
- Vercel: https://nudat.vercel.app — deploy automático al pushear a `main`. El framework está fijado en `vercel.json` (el proyecto se creó con el repo vacío y Vercel había quedado en "Other").
- Supabase: proyecto `nudat` (`cqlayawlvfberojffogu`, org "rodrigo nahuel lazaroff", plan Free, región sa-east-1 São Paulo). Funciones de Vercel en `gru1` (vercel.json) para estar al lado de la base.
  - **Las migraciones se aplican solas**: la integración GitHub de Supabase corre `supabase/migrations/` contra producción en cada push a `main`. Nunca editar una migración ya pusheada: crear una nueva (`npx supabase migration new <nombre>`). No aplicar migraciones por otro camino (MCP, SQL editor) porque desincroniza el historial.
- Variables en Vercel: las sincroniza la integración Supabase↔Vercel (solo con acceso al proyecto nudat). La app usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Supabase → Authentication → URL Configuration: Site URL `https://nudat.vercel.app`; redirects `https://nudat.vercel.app/**`, `http://localhost:3000/**` y los de previews de Vercel (los agregó la integración).
- Mails de auth: por ahora usan el SMTP y las plantillas por defecto de Supabase (pocos mails por hora, y el link de confirmación solo anda en el mismo navegador). Pendiente: SMTP propio y plantillas con `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (y `type=recovery` para resetear); `/auth/confirm` ya soporta los dos formatos.
