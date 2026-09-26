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
- Movimiento de app nativa (filosofía de Emil Kowalski, skill `emil-design-eng`): todo lo
  que se toca responde al instante, las entradas son cortas y solo al montar, y lo que se usa
  muchas veces por día casi no anima. Con `prefers-reduced-motion` queda un fundido.

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

Antes de animar algo: ¿cuántas veces por día se ve? Lo frecuente (cambiar de día, de
período, de sección) casi no anima; lo ocasional (abrir el detalle, confirmar borrado,
guardar) anima corto; nada anima por teclado (flechas en el diálogo de /semana).

- **Curva**: `--curva` = `cubic-bezier(0.32, 0.72, 0, 1)` → utilidad `ease-premium`. Es un
  ease-out fuerte: arranca rápido (la respuesta se ve enseguida) y frena suave. Nunca
  `ease-in` en UI. Excepciones: `linear` para lo que gira o pasa constante (ruedita,
  esqueleto) y ease-in-out para lo que oscila (onda del dictado).
- **Duraciones** (tokens `--dur-presion` / `--dur-estado`):

  | Qué | Duración |
  |---|---|
  | Presión (scale al tocar) | 150ms (`duration-150`) |
  | Cambio de estado: color, fondo, sombra, texto del botón | 200ms (`duration-200`) |
  | Aparecer en el lugar (`.aparecer`), abrir el diálogo | 250ms |
  | Entrada de pantalla (`.entrar`) | 400ms, escalón de 40ms |
  | Salidas | más rápidas que la entrada: 150ms |

  Nada de UI pasa de 400ms.
- **Propiedades**: solo `transform`/`scale`/`translate` y `opacity` (más colores, sombras y un
  `blur` de 2px para disimular cruces). Nunca `transition: all`; listar las propiedades
  (`transition-[background-color,scale]`). Excepción heredada: el ancho del botón de dictar.
- **Presión** (`:active`, todo lo que se toca): `scale(0.97)` botones (`.boton`), `0.98`
  tarjetas y filas, `0.94-0.95` círculos, chips chicos y nav. Además, en el celu el `:active`
  marca el fondo que en compu marca el hover (`active:bg-…`). Lo apagado no se hunde.
  `select-none` en lo que se toca (evita la selección de texto al mantener apretado).
- **Hover** solo con mouse: las utilidades `hover:` de Tailwind 4 ya van dentro de
  `@media (hover: hover)`; en CSS propio usar `@media (hover: hover) and (pointer: fine)`.
- **Entrada de pantalla**: `.entrar` (sube 8px y aparece), escalonada con
  `style={{ "--i": n } as CSSProperties}`; cortar en ~8. Se ve cada vez que llega una pantalla
  (también al cambiar de día, porque pasa por `loading.tsx`), por eso es corta.
- **Cambios en el lugar**:
  - `.aparecer`: desde `scale(0.97)` + opacidad + blur 2px (foto elegida, error, confirmar
    borrado). Nunca desde `scale(0)`.
  - `.cambiar`: texto o ícono que se reemplaza dentro de un control. Poner `key` con el valor
    para que vuelva a correr (texto del botón Guardar, título del día en Hoy, micrófono/onda).
  - `.asentar`: el tilde de "Guardado" (rebote mínimo, una sola vez).
- **Carga**: `.girar` para las rueditas (700ms, lineal). Indicadores de navegación
  (`IndicadorLink`, `IndicadorCirculo`, pastilla de la nav) aparecen con 80-100ms de espera
  para no parpadear si la pantalla llega al toque.
- **Diálogo**: `<dialog class="modal">`: entra desde `scale(0.96)` centrado (un modal no sale
  de su disparador), sale en 150ms; el fondo oscuro hace fundido. Usa `@starting-style` y
  `allow-discrete`; donde no hay soporte abre y cierra sin animación.
- **Háptica**: `vibrar()` de `src/components/tacto.ts` (Android; en iOS no hace nada). Solo
  en guardar, eliminar y empezar a dictar.
- **Sin View Transitions**: Hoy cambia de día pasando por `loading.tsx` (el esqueleto ya es
  la transición) y las View Transitions congelan la pantalla entera mientras animan, justo en
  la navegación más frecuente. CSS alcanza; no hay librería de animación.
- `backdrop-filter` solo en elementos fijos/sticky (`.isla`).
- **Movimiento reducido**: sin desplazamientos ni escalas. `.entrar`, `.aparecer`, `.cambiar`
  y `.asentar` pasan a un fundido de 150ms; halo y onda quietos; rueditas más lentas. En
  utilidades sueltas: `motion-reduce:transition-none` y `motion-reduce:active:scale-100`.
- **Impresión**: `@media print` apaga toda animación y transición (la hoja sale quieta).

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
- **Formularios**: encabezado en una fila (`.boton-circulo` volver + título display); orden
  Foto → Tipo → Descripción → Fecha y hora (lo que se escribe arriba; fecha y hora ya vienen
  puestas); campos `.campo` con `.etiqueta`; opciones en `.chip`; guardar en
  `.isla rounded-full p-1.5` sticky abajo sobre un degradé de `fondo` (lo de abajo se funde) con
  `data-isla-guardar`, que reserva su alto en `scroll-padding-bottom` al enfocar campos.
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
