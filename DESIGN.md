# Sistema visual de nudat

Referencia para cualquier pantalla nueva o rediseño. Todo vive en `src/app/globals.css`
(tokens + clases de componente) y `src/app/layout.tsx` (fuentes). Leer también `PRODUCT.md`
(personalidad, anti-referencias) antes de diseñar.

## Dirección

**Soft Structuralism, versión cálida** (skill `soft-skill`, arquetipo "Consumer / Health"):
superficies crema en capas, componentes que flotan con sombras largas y muy difusas teñidas de
verde, tipografía grotesca grande y apretada para títulos, píldoras en vez de rectángulos,
y piezas con **bisel doble** (bandeja + núcleo) como si fueran hardware. Movimiento con masa
(curva `--curva`), nada lineal.

Adaptaciones al producto (ganan sobre la skill):

- Es una app de uso rápido en el celu, no una landing: nada de `py-24`; el "aire" viene de
  títulos grandes, radios generosos y gaps de 12-24px.
- **Sin eyebrows en mayúsculas** ni métricas gigantes con label chiquito (anti-referencia de
  PRODUCT.md). Etiqueta + valor, sin textos que reexpliquen.
- Entradas animadas cortas (600ms, 14px, sin blur) y solo al montar; con
  `prefers-reduced-motion` no hay animación.

## Tokens (`:root` en globals.css → utilidades de Tailwind)

### Color

| Token | Utilidad | Uso |
|---|---|---|
| `--fondo` `#f4f1e9` | `bg-fondo` | Fondo general (en `html`). El body le suma resplandor verde/naranja y grano. |
| `--hundido` `#ebe6da` | `bg-hundido` | Pistas, esqueletos, hover de botones fantasma, campos read-only. |
| `--superficie` `#fffdf8` | `bg-superficie` | Núcleo de tarjetas, inputs, botón secundario. |
| `--borde` `#e0dace` | `border-borde`, `divide-borde` | Hairlines. Preferir `ring`/sombra de 1px a `border` gris. |
| `--tinta` `#14201a` | `text-tinta` | Texto principal. |
| `--tinta-suave` `#545e57` | `text-tinta-suave` | Texto secundario (AA sobre fondo, hundido y superficie). |
| `--primario` `#2f6b4f` | `bg-primario`, `text-primario` | Verde de marca: acciones principales, estados elegidos. |
| `--primario-hover` `#265a42` | `bg-primario-hover` | Hover del primario. |
| `--primario-profundo` `#173628` | `bg-primario-profundo` | Superficies oscuras (barra de navegación). |
| `--primario-suave` `#e2ede6` | `bg-primario-suave` | Fondos de pastillas, íconos, avisos. |
| `--sobre-primario` `#fff` | `text-sobre-primario` | Texto sobre primario/profundo/peligro. |
| `--sobre-profundo-suave` `#b8c7bd` | `text-sobre-profundo-suave` | Texto secundario sobre `primario-profundo`. |
| `--acento` `#d9822b` | `bg-acento` | Naranja de marca. **Solo relleno o detalle**: como texto chico no llega a AA. |
| `--acento-suave` `#f7e6d2` | `bg-acento-suave` | Fondo naranja claro (bebidas, faltantes). |
| `--acento-tinta` `#92500f` | `text-acento-tinta` | Texto naranja legible (AA). Usar este y no `text-acento`. |
| `--peligro` / `--peligro-suave` | `bg-peligro`, `text-peligro`… | Errores y borrado. |

Bebidas usan la familia naranja (`bg-acento-suave text-acento-tinta` + `IconoVaso`), comidas la
verde (`bg-primario-suave text-primario` + `IconoPlato`). Siempre con texto además del color.

### Tipografía

- **Texto**: Plus Jakarta Sans (`font-sans`, por defecto). Pesos 400/500/600/700.
- **Display**: Bricolage Grotesque (`font-display`). Títulos de pantalla, horas, números
  destacados, títulos de tarjeta. Siempre `font-bold tracking-tight` (o `.titulo-pantalla`).
- Escala: título de pantalla `clamp(2.5rem, 12vw, 3.5rem)` (Hoy) o `2.25-2.75rem`
  (formularios, auth); títulos de sección/tarjeta `text-lg`/`text-xl` display; cuerpo `text-base`;
  secundario `text-sm`; nav `0.6875rem`. Números con `tabular-nums`.
- Inter, Roboto, Arial, Open Sans y Helvetica están prohibidas.

### Radios

| Token | Utilidad | Uso |
|---|---|---|
| `--radio-caja` 1.75rem | `rounded-caja` | Bandeja del bisel, tiles grandes, cajas de confirmación. |
| `--radio-nucleo` caja − 6px | `rounded-nucleo` | Núcleo del bisel o imagen dentro del bisel (concéntrico). |
| `--radio-campo` 1rem | `rounded-campo` | Campos de texto. |
| — | `rounded-full` | Botones, chips, pastillas, header y nav. |
| — | `rounded-xl` / `rounded-2xl` | Fotos chicas dentro de un núcleo, avisos. |

### Sombras

| Token | Utilidad | Uso |
|---|---|---|
| `--sombra-suave` | `shadow-suave` | Reposo de tarjetas y botones claros. |
| `--sombra-flotante` | `shadow-flotante` | Elementos flotantes (islas) y hover de tarjetas. |
| `--sombra-boton` | `shadow-boton` | Botón primario / chip elegido (brillo interno + halo verde). |
| `--brillo-interno` | (en CSS) | Filo de luz arriba de superficies claras. |

Nunca `shadow-md`/`shadow-lg` de Tailwind ni sombras grises duras.

### Movimiento

- Curva única: `--curva` = `cubic-bezier(0.32, 0.72, 0, 1)` → utilidad `ease-premium`.
  Duraciones 250-500ms. No usar `ease-out`, `ease-in-out` ni `linear`.
- Solo `transform` y `opacity` (y colores/sombras). Nada de animar `top/left/width/height`
  (excepción heredada: ancho del botón de dictar).
- Presión: `active:scale-[0.98]` (botones), `0.985` (tarjetas), `0.94-0.96` (círculos/chips).
  Ya viene en `.boton`, `.boton-circulo` y `.chip`.
- Entrada: clase `.entrar`, escalonada con `style={{ "--i": n } as CSSProperties}` (60ms por
  paso; cortar en ~8 para listas largas).
- `backdrop-filter` solo en elementos fijos/sticky (`.isla`).
- Todo se apaga con `prefers-reduced-motion` (las clases del sistema ya lo hacen; en
  utilidades sueltas agregar `motion-reduce:transition-none` / `motion-reduce:active:scale-100`).

## Clases de componente (globals.css, `@layer components`)

Las utilidades de Tailwind les ganan, así que se pueden ajustar (`h-15`, `w-full`, `px-2`…).

| Clase | Qué es |
|---|---|
| `.foco` | Anillo de foco verde de 2px (focus-visible). Ponerlo en todo lo interactivo. |
| `.boton` | Base de botón: píldora, 56px de alto, semibold, presión. Siempre con una variante: |
| `.boton-primario` | Verde con `shadow-boton`. Una sola acción principal por pantalla. |
| `.boton-secundario` | Superficie clara con hairline y brillo. |
| `.boton-fantasma` | Solo texto verde, fondo al hover. |
| `.boton-peligro` | Rojo lleno (confirmar borrado). |
| `.boton-icono` | Círculo de 40px **dentro** del botón, pegado a la derecha (botón en botón). Con `group` en el botón se desplaza al hover. |
| `.boton-circulo` | Botón redondo de 44px con bisel liviano (volver, día anterior/siguiente). |
| `.bisel` + `.bisel-nucleo` | Bisel doble: bandeja (6px de padding, hairline) + núcleo con brillo y sombra. El padding interno va en el núcleo (`p-2.5` en filas, `p-5` en formularios, `px-6 py-10` en vacíos). |
| `.isla` | Vidrio flotante (fondo 78% + blur + sombra flotante). Solo fijo/sticky. |
| `.campo` | Input/textarea de 56px, hairline interna, halo verde al foco. |
| `.etiqueta` | Label de campo (`text-sm` semibold, tinta). |
| `.chip` / `.chip-activo` | Opción de 44px; elegido = verde lleno y semibold. |
| `.pastilla` | Dato no interactivo (conteos). Verde por defecto; bebidas `bg-acento-suave text-acento-tinta`. |
| `.titulo-pantalla` | Título display grande (bold, -0.035em, line-height 1). Ajustar tamaño con `text-[…]`. |
| `.esqueleto` | Relleno de carga con brillo que pasa. |

Botón principal con flecha (patrón):

```tsx
<button className="boton boton-primario foco group w-full justify-between px-2">
  <span aria-hidden="true" className="size-10 shrink-0" />   {/* centra el texto */}
  Guardar
  <span aria-hidden="true" className="boton-icono"><IconoListo className="size-5" /></span>
</button>
```

Tarjeta (patrón):

```tsx
<div className="bisel">
  <div className="bisel-nucleo p-5">…</div>
</div>
```

## Estructura de la app

- **Header** (`src/app/(app)/layout.tsx`): isla de vidrio sticky, despegada 10px del borde,
  `rounded-full`, logo + inicial en círculo + nombre (≥380px) + "Salir". En `/semana` se
  ensancha solo con `data-ancho=completo`.
- **Nav inferior** (`src/components/comidas/nav-inferior.tsx`): cápsula flotante
  `bg-primario-profundo`, 64px, a 12px del borde + zona segura. Activo = píldora crema con
  texto verde bold. Ocupa `4.75rem + env(safe-area-inset-bottom)`; lo que se fije arriba de
  ella usa `bottom`/`padding-bottom` ≥ `5.5rem + env(safe-area-inset-bottom)`. El spacer
  reserva `6rem + zona segura` al final de cada página.
- **Fondo**: el wrapper de `(app)` no tiene fondo; se ve el de `html` con los resplandores y el
  grano de `body::before/::after` (ocultos al imprimir).
- **Pantalla tipo** (ver Hoy): título display grande a la izquierda + controles `.boton-circulo`
  a la derecha → pastillas de datos → lista de tarjetas con bisel (`gap-3`) → CTA fijo
  (`.boton-primario` con `.boton-icono`) sobre un degradé `from-fondo`.
- **Formularios**: encabezado con `.boton-circulo` volver + título display; campos `.campo`
  con `.etiqueta`; opciones en `.chip`; guardar en `.isla rounded-full p-1.5` sticky abajo.
- **Auth** (`src/app/auth/_compartido/ui.tsx`): logo, título display 2.75rem, contenido en
  `Tarjeta` (bisel). `clases.*` mapea a las clases del sistema.

## Reglas

- Nada de textos de ayuda que reexpliquen un dato: etiqueta + valor. Sin em dashes. Voseo.
- Áreas táctiles ≥ 44px (los componentes del sistema ya las cumplen).
- Contraste AA: texto naranja solo con `text-acento-tinta`; sobre `primario-profundo` usar
  `text-sobre-primario` o `text-sobre-profundo-suave`.
- No usar colores sueltos de Tailwind (`gray-*`, `green-*`) ni `border border-gray`.
- No poner tarjetas con bisel dentro de otras tarjetas con bisel (un solo nivel).
- Imprimir: los fondos no salen; separar con líneas (`border-tinta/…`) y usar `print:` para
  sacar sombras, islas y degradés.

## Qué falta (fase 2)

`/resumen` (`src/app/(app)/(angosto)/resumen/**`, `src/components/resumen/**`),
`/historial` y `/semana` (`src/app/(app)/semana/**`, `src/components/semana/**`) todavía usan
el estilo anterior (`rounded-2xl border border-borde bg-superficie`, títulos `text-xl
font-semibold`). Heredan los tokens nuevos (colores, fuente, nav, header), pero hay que pasarlos
al sistema siguiendo las reglas de arriba.
