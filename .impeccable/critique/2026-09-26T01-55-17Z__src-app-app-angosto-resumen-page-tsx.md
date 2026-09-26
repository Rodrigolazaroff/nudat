---
target: dashboard /resumen
total_score: 27
p0_count: 0
p1_count: 4
timestamp: 2026-09-26T01-55-17Z
slug: src-app-app-angosto-resumen-page-tsx
---
# Crítica: /resumen (nudat)

Puntaje: 27/40 (Aceptable). P0: 0, P1: 4, P2: 4.

| # | Heurística | Puntaje | Hallazgo |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | Esqueleto, ruedita en el selector, aria-current. Pero entre 00:00 y 05:00 "hoy" es el día calendario, no el alimentario. |
| 2 | Coincidencia con el mundo real | 3 | Lenguaje claro; "Horarios típicos" sobre 2 días sobredimensiona; celda con dos números ambigua. |
| 3 | Control y libertad | 3 | Período por URL, Atrás funciona, cada día linkea a su detalle. |
| 4 | Consistencia | 2 | Acento = "hoy" y = "bebida"; verde = "bien" en salteadas; la celda cuenta madrugada pero el link abre el día calendario. |
| 5 | Prevención de errores | 3 | Pantalla de lectura; nota sobre madrugada y días vacíos. |
| 6 | Reconocer antes que recordar | 3 | Leyenda de la tira y notas al pie. |
| 7 | Flexibilidad | 2 | Solo 7/30 días. |
| 8 | Estética y minimalismo | 2 | 4 tarjetas métricas iguales redundantes con la tira; racha; número agregado de salteadas. |
| 9 | Recuperación de errores | 3 | error.tsx con Reintentar e Ir a hoy. |
| 10 | Ayuda | 3 | Notas al pie explican las reglas. |

## Prioridades
- [P1] Racha y "¡Todos los días!" contradicen "registro, no juicio" y la anti-referencia de rachas (page.tsx:112-135). Fix: sacar la métrica de racha y la exclamación.
- [P1] Día alimentario inconsistente: hoyISO calendario (page.tsx:36) y links de la tira a día calendario (tira-constancia.tsx:64). Fix: hoy = diaAlimentario(hoyISO(), horaActual()).dia; que Hoy muestre el día alimentario o que el aria-label/cuenta lo aclare.
- [P1] Hero-metric template: grilla 2x2 de tarjetas idénticas (page.tsx:100-151, loading.tsx:12-16). Fix: tira arriba con "5 de 7 días con algo cargado" como encabezado; el resto en una lista clave-valor dentro de una sola tarjeta.
- [P1] "Comidas principales sin registro": número grande agregado + verde/✓ como premio (page.tsx:170-218). Fix: reformular en positivo neutro "Desayuno: 5 de 6 días", sin color condicional, sin total agregado.
- [P2] Horarios: "típicos" con pocos días, marcas de 11,2px, sin rango (horarios.tsx:48-71). Fix: "Promedio de N días", rango min-max, marcas a 12px.
- [P2] Tira: dos números por celda sin rótulo, anillo acento 2,69:1, acento reutilizado (tira-constancia.tsx:9-12,66-75; reparto-tipos.tsx:19).
- [P2] Nav: activo solo por color (1,06:1 entre primario y tinta-suave) y foco 1,18:1 (nav-inferior.tsx:72-74).
- [P2] loading.tsx:4 animate-pulse sin motion-safe.
