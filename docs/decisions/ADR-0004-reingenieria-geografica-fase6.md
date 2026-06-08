# ADR-0004 — Reingeniería geográfica (FASE 6): separar zonas de colonias

- **Estado:** Aceptado
- **Fecha:** 2026-06-08
- **Decisores:** Miguel (Valorius)
- **Reemplaza a:** —

## Contexto

Al revisar los activos nuevos y el catálogo de dim_zone, se detectó que varias entidades
estaban catalogadas en el nivel equivocado de la jerarquía. Específicamente, tres
"Residencial X" estaban **como zonas** cuando deberían haber sido **colonias dentro de
una zona más amplia**:

| Error detectado | Debería ser | Colonia |
|---|---|---|
| Zona: "Residencial Las Casitas" | Zona: "Las Casitas" | Residencial Las Casitas |
| Zona: "Residencial El Sauce" | Zona: "El Sauce" | Residencial El Sauce |
| Zona: "Residencial Villa Elena" | Zona: "Villa Elena" | Residencial Villa Elena |

Esta confusión surgió porque:
1. El scraper detecta "Residencial X" como ubicación en Rentify.
2. Se mapeaba mecánicamente a zona sin auditar la jerarquía.
3. La regla de que "residencial = colonia dentro de zona más amplia" no estaba documentada.

## Decisión

**Aplicar reingeniería estructural:**
1. Crear 3 zonas nuevas: **Las Casitas**, **El Sauce**, **Villa Elena** (sin "Residencial").
2. Crear 3 colonias nuevas: **Residencial Las Casitas**, etc. (apuntando a las zonas nuevas).
3. Migrar todas las properties (10 en total) a las nuevas zonas + asignar colonia_id.
4. Desactivar las 3 zonas antiguas (marcarlas como `activo = false`), no eliminar.
5. Actualizar zone_aliases.json para que el scraper mapee a las nuevas zonas.

**Resultado:**

```
Antes:  property → zona_id="063cd486..." (Residencial Las Casitas)
Después: property → zone_id="550e8400..." (Las Casitas) + colonia_id="550e8400..." (Residencial Las Casitas)
```

## Alternativas consideradas

- **No hacer nada, dejar como está** — rechazado: la jerarquía está mal. Futuros scrapers
  y análisis de cobertura dependen de esta estructura correcta.
- **Eliminar las zonas antiguas** — rechazado: preservar historial. Con `activo = false`
  quedan visibles para auditoría pero no aparecen en dropdowns (`WHERE activo = true`).
- **Hacer la migración manualmente sin documentación** — rechazado: violaría ADR-0002
  (gobernanza documental). Esto debe ser trazable.

## Consecuencias

- (+) Jerarquía zona/colonia ahora consistente.
- (+) Scrapers futuros tendrán zonas "base" correctas (Las Casitas, no "Residencial Las Casitas").
- (+) Análisis de cobertura (FASE 6 audit_02) tendrá data modelo limpio.
- (+) Historial de zonas antiguas preservado (activo = false).
- (−) 10 properties reasignadas (cambio de zone_id), pero colonia_id ahora poblado (mejora datos).
- (−) Snapshots asociados a las zonas antiguas quedan "huérfanos" (ya no consultables por
  zona activa). No es crítico porque el analizador calcula en vivo desde listings (ver
  data_dictionary §5).

## Implementación

**Migración SQL:** `migration_fase6_reingenieria_geografica_v1.sql`
- Aplicada: 2026-06-08
- Verificación post-migración: 10 properties migradas correctamente.

**Actualizaciones:**
- `zone_aliases.json`: 9 entradas (3 zonas × 3 variantes) reasignadas a nuevos UUIDs.
- `CLAUDE.md`: dim_zone conteo 52 → 55 (3 nuevas zonas), dim_colonia 60 → 63 (3 nuevas colonias).
- Documen documentación as-built: data_dictionary v1.2, INDEX, CHANGELOG.

## Referencias

- [migration_fase6_reingenieria_geografica_v1.sql](../database/migration_fase6_reingenieria_geografica_v1.sql)
- [ADR-0002](ADR-0002-gobernanza-documental.md) (regla de cobertura)
- [data_dictionary.md](../database/data_dictionary.md) (jerarquía zona/colonia)
- audit_02 (reingeniería geográfica completa, pendiente)
