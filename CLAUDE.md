@AGENTS.md

# nudat

Registro alimentario personal. Cada persona crea su cuenta (email + contraseña o Google) y
carga lo que come y toma en el día: tipo (desayuno … colación, o bebida), fecha, hora, foto y
descripción. En `/semana` ve una grilla y un resumen automático que puede imprimir o guardar
en PDF (por ejemplo, para llevárselo a su nutri).

> Historia: arrancó como app nutri ↔ paciente (roles e invitaciones). Se descartó en la
> migración `20260924120000_app_personal.sql`; no queda nada de ese modelo.

## Modelo

- Tablas: `perfiles` (id = usuario de auth, nombre) y `comidas` (`usuario_id`, fecha, hora, tipo, descripción, `foto_path`).
- **La seguridad está en la base (RLS), no en la UI.** Cada usuario ve y maneja solo su perfil, sus comidas y sus fotos. Todo cambio de esquema va con sus políticas.
- Alta abierta: el trigger `privado.crear_perfil` crea el perfil de todo usuario nuevo (nombre desde `nombre` o, con Google, `full_name`/`name`). Nunca bloquea el alta.
- `usuario_id` lo pone la base (`default auth.uid()`); desde la app solo se escriben las columnas con grant (fecha, hora, tipo, descripción, foto).
- Bebidas: `tipo = 'bebida'`. No cuentan para horarios de comida (primera/última del día, ayuno) en `src/lib/resumen.ts`.
- Fotos: bucket privado `fotos-comidas`, ruta `{usuario_id}/{archivo}`, se muestran con URL firmada. Se comprimen en el cliente antes de subir.
- Rutas: `(app)/(angosto)` = pantallas del celu (`/` Hoy, `/nueva`, `/comida/[id]`, `/historial`); `(app)/semana` = ancho, para tabla e impresión.

## Stack

- Next.js 16 (App Router, `src/`), React 19, TypeScript, Tailwind 4.
  - Ojo: en Next 16 `middleware` pasó a llamarse `proxy` → `src/proxy.ts`.
- Supabase: Auth (email + contraseña y Google OAuth), Postgres con RLS, Storage.
  - Clientes en `src/lib/supabase/` (`client.ts` navegador, `server.ts` server, `proxy.ts` refresco de sesión).
  - Migraciones en `supabase/migrations/`.
- UI en español (Argentina). Pensada mobile-first: se carga desde el celular.

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

Hay cuentas de prueba con emails `@demo.test`: `martin@` (una semana de comidas sin fotos), `sofia@` (2 días) y `nutri@` (vacía, quedó del modelo viejo).
Se crearon a mano en el SQL editor; para borrarlas: `supabase/demo/borrar-demo.sql`.

## Deploy

- GitHub: https://github.com/Rodrigolazaroff/nudat (branch `main`)
- Vercel: https://nudat.vercel.app — deploy automático al pushear a `main`. El framework está fijado en `vercel.json` (el proyecto se creó con el repo vacío y Vercel había quedado en "Other").
- Supabase: proyecto `nudat` (`cqlayawlvfberojffogu`, org "rodrigo nahuel lazaroff", plan Free, región sa-east-1 São Paulo). Funciones de Vercel en `gru1` (vercel.json) para estar al lado de la base.
  - **Las migraciones se aplican solas**: la integración GitHub de Supabase corre `supabase/migrations/` contra producción en cada push a `main`. Nunca editar una migración ya pusheada: crear una nueva (`npx supabase migration new <nombre>`). No aplicar migraciones por otro camino (MCP, SQL editor) porque desincroniza el historial.
- Variables en Vercel: las sincroniza la integración Supabase↔Vercel (solo con acceso al proyecto nudat). La app usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Supabase → Authentication → URL Configuration: Site URL `https://nudat.vercel.app`; redirects `https://nudat.vercel.app/**`, `http://localhost:3000/**` y los de previews de Vercel (los agregó la integración).
- Google OAuth: cliente web "nudat web" en el proyecto de Google Cloud **TEST SIMULADOR PRESTAMOS** (`gen-lang-client-0384583944`; la cuenta llegó al límite de proyectos y se reusó ese). Pantalla de consentimiento "nudat", usuarios externos, solo email y perfil. Orígenes `https://nudat.vercel.app` y `http://localhost:3000`; redirect `https://cqlayawlvfberojffogu.supabase.co/auth/v1/callback`. Client ID y secret cargados en Supabase → Authentication → Providers → Google.
- Mails de auth: por ahora usan el SMTP y las plantillas por defecto de Supabase (pocos mails por hora, y el link de confirmación solo anda en el mismo navegador). Pendiente: SMTP propio y plantillas con `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (y `type=recovery` para resetear); `/auth/confirm` ya soporta los dos formatos.
