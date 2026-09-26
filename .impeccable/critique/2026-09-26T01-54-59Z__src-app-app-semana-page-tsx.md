---
target: vista /semana (grilla + resumen imprimible)
total_score: 24
p0_count: 1
p1_count: 5
timestamp: 2026-09-26T01-54-59Z
slug: src-app-app-semana-page-tsx
---
# Critique: /semana (src/app/(app)/semana/page.tsx)

Puntaje heurístico: 24/40 (Aceptable). H1 3, H2 2, H3 3, H4 3, H5 2, H6 2, H7 2, H8 2, H9 2, H10 3.

## Priority issues
- [P0] Header de la app y nav inferior fija se imprimen (layout.tsx:17, nav-inferior.tsx:26-28): la barra fixed se repite en cada hoja y tapa filas. Fix: print:hidden en header, nav y espaciador.
- [P1] Descripciones truncadas en la hoja impresa (grilla-semana.tsx:292 line-clamp-3). Fix: print:line-clamp-none.
- [P1] "comidas por día" y "N comidas" cuentan bebidas (resumen-semana.tsx:38, grilla-semana.tsx:87/145). Fix: separar comidas y bebidas.
- [P1] "(+1)" de madrugada ambiguo en papel, sin leyenda (grilla-semana.tsx:334-344). Fix: "00:30 del mar 23/9" + leyenda junto a la grilla.
- [P1] Fotos lazy + URL firmada de 1 h: en impresión pueden salir en blanco o rotas (grilla-semana.tsx:276-281, firmar-fotos.ts). Fix: eager en impresión, onError, firmar al imprimir.
- [P1] Hojas 2..n sin nombre ni período; fecha sin año (page.tsx:77-84, formato.ts rangoFechas). Fix: encabezado repetido (thead extra o running header) y año siempre en impresión.
## P2
- "Hoy" y "Todavía no registró comidas hoy" impresos; header max-w-lg vs contenido max-w-5xl; bordes/cards anidadas en celdas; voz mezclada; selector 40px; PDF sin nombre útil; "Cenas después de las 22:00" + punto naranja leen como alerta; bebidas excluidas de horarios no aclarado; Safari ignora @page landscape.
