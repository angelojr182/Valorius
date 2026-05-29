# Diseño: Detección de Duplicados — Valorius

> Estado: DISEÑO APROBADO — pendiente de implementación
> Fecha de diseño: 2026-05-27
> Contexto: surge al cerrar FASE 1-H (property_code marcado como legado)

---

## Por qué esto importa

Una misma propiedad puede aparecer:
- En múltiples portales simultáneamente (Rentify, CS Bienes Raíces, Propiedades Honduras)
- Re-publicada en el mismo portal semanas después con precio diferente
- Con nombre de colonia o proyecto ligeramente distinto entre fuentes

Sin detección de duplicados, el benchmark de precios se contamina: una propiedad que aparece en 3 fuentes pesa 3 veces más en la mediana.

---

## Campos de identidad actuales (no tocar)

```
core.listing.property_id  → FK a core.property (relación ya resuelta)
core.listing.fuente       → nombre del portal de origen
core.listing.url          → URL completa del anuncio
```

La identidad y trazabilidad ya están cubiertas. El problema de duplicados es **independiente** de estos campos.

---

## Niveles de deduplicación

### Nivel 1 — Duplicado exacto por fuente (IMPLEMENTAR PRIMERO)

**Cuándo aplica:** misma fuente, mismo anuncio re-scrapeado.

**Regla:**
```sql
-- Antes de insertar, verificar:
SELECT listing_id FROM core.listing
WHERE fuente = '{fuente}' AND url = '{url}';
-- Si retorna fila → NO insertar
```

**Garantía actual:** el campo `url` debería tener UNIQUE constraint. Verificar si existe.
**Acción pendiente:** confirmar o crear `UNIQUE (fuente, url)` en core.listing.

---

### Nivel 2 — Duplicado probable cross-fuente (IMPLEMENTAR EN FASE SIGUIENTE)

**Cuándo aplica:** misma propiedad física publicada en portales distintos.

**Criterios de match (todos deben cumplirse):**
```
zone_id           = igual (mismo UUID)
project_id        = igual (si ambos tienen proyecto asignado)
property_type_id  = igual
area_construccion = dentro de ±3%
precio_usd        = dentro de ±3%   (normalizar moneda antes de comparar)
habitaciones      = igual (si ambos tienen valor)
```

**Resultado:** no se elimina automáticamente. Se registra en tabla de revisión:

```sql
-- Tabla pendiente de crear (FASE futura)
core.duplicate_review (
  review_id       UUID PK DEFAULT gen_random_uuid(),
  listing_id_a    UUID NOT NULL → core.listing,
  listing_id_b    UUID NOT NULL → core.listing,
  match_score     SMALLINT,        -- 0-100
  match_reasons   TEXT[],          -- array de criterios que coincidieron
  estado          TEXT DEFAULT 'PENDIENTE',  -- PENDIENTE | CONFIRMADO | DESCARTADO
  reviewed_by     TEXT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
)
```

**Estados:**
- `PENDIENTE` → detectado, sin revisar
- `CONFIRMADO` → es duplicado real, uno de los dos se excluye del benchmark
- `DESCARTADO` → false positive, ambos son propiedades distintas

---

### Nivel 3 — Duplicado semántico (FUTURO, no priorizar ahora)

Análisis de similitud en texto: título, descripción, características narrativas.
Requiere mayor volumen de datos y posiblemente embeddings.
No implementar hasta tener 500+ listings activos.

---

## Impacto en el benchmark

Cuando se confirme un duplicado (Nivel 2, estado = CONFIRMADO):
- El listing con `calidad_dato` más baja queda excluido del cálculo de mediana
- Nunca se elimina — solo se marca con campo `excluido_benchmark BOOLEAN`
- El snapshot no debe incluir listings con `excluido_benchmark = true`

---

## Orden de implementación recomendado

```
1. Verificar/crear UNIQUE (fuente, url)          → Nivel 1, inmediato, bajo riesgo
2. Crear tabla core.duplicate_review             → estructura, sin datos aún
3. Escribir query de detección Nivel 2           → detectar candidatos actuales
4. Revisar candidatos manualmente                → confirmar o descartar
5. Ajustar recalcular_snapshots() para excluir   → excluir_benchmark = true
```

---

## Notas sobre property_code (campo legado)

`core.listing.property_code` fue usado históricamente como control parcial de duplicados
por fuente, sin metodología consistente. **No usar en nuevas inserciones.**
Ver decisión en CHANGELOG 2026-05-27.

La detección de duplicados no depende de property_code — usa `fuente + url` para Nivel 1
y similitud de atributos para Nivel 2.
