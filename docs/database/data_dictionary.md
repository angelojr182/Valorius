# Diccionario de Datos — Valorius (esquema `core`)

**Versión:** 1.0 · **Estado:** Vigente (as-built) · **Última actualización:** 2026-06-06

| Versión | Fecha | Cambio | Ref |
|---|---|---|---|
| 1.0 | 2026-06-06 | Diccionario inicial, verificado contra el esquema real (`list_tables core`). Reemplaza al diccionario de facto que vivía en `CLAUDE.md`. | as-built |

> Definición canónica del modelo de datos. Verificado contra la base (no de memoria).
> Documento vivo y versionado (ver [ADR-0002](../decisions/ADR-0002-gobernanza-documental.md)).
> Los **valores de catálogo** (UUIDs de las 52 zonas, 60 colonias, 32 proyectos) viven en
> la DB y en `CLAUDE.md`; aquí se documenta **estructura y semántica**, no la enumeración.

---

## 0. Mapa del modelo

```
TRANSACCIONAL   property (145) ──1:N──> listing (145)
DIMENSIONES     dim_zone (52) ──> dim_colonia (60) ──> dim_proyecto (32)
                dim_property_type (3)
                dim_subzona (24)  ← LEGADO / deprecated
AGREGADOS       market_snapshot (49) ──1:1──> market_metrics (49)
CLUSTERING      dim_zone_cluster (5) ──N:1── zone_cluster_assignment (45)
OPERATIVO       exchange_rate (11) · audit_log (8) · data_quarantine (0)
```
Conteos = filas reales al 2026-06-06. Todas con RLS activado **excepto `dim_colonia`** (ver §9).

---

## 1. `core.property` — inmueble físico (145 filas)
Una fila por propiedad. Lo que no cambia entre anuncios (ubicación, características).

| Columna | Tipo | Null | Default / Check | Notas |
|---|---|---|---|---|
| `property_id` | uuid | no | `gen_random_uuid()` | **PK** |
| `zone_id` | uuid | no | | **FK** → dim_zone |
| `property_type_id` | uuid | no | | **FK** → dim_property_type |
| `ciudad` | text | no | | siempre `'Tegucigalpa'` |
| `colonia` | text | no | | texto libre (legado de origen) — ver `colonia_id` y §9.5 |
| `habitaciones` | int | sí | check 0–20 | Monoambiente = 1 |
| `banos` | numeric | sí | check 0–20 | |
| `estacionamientos` | int | sí | check 0–10 | |
| `nivel_seguridad` | text | sí | | |
| `descripcion` | text | sí | | |
| `subzona` | text | sí | | **LEGADO** — no poblar |
| `subzona_id` | uuid | sí | | **FK** → dim_subzona — **LEGADO** |
| `proyecto_id` | uuid | sí | | **FK** → dim_proyecto (solo si existe en catálogo) |
| `colonia_id` | uuid | sí | | **FK** → dim_colonia (hoy 100% poblado) |
| `created_at` / `updated_at` | timestamptz | sí | `now()` | |

## 2. `core.listing` — anuncio/observación de precio (145 filas)
Una fila por publicación. Lo que sí varía en el tiempo (precio, fuente, fecha).

| Columna | Tipo | Null | Default / Check | Notas |
|---|---|---|---|---|
| `listing_id` | uuid | no | `gen_random_uuid()` | **PK** |
| `property_id` | uuid | no | | **FK** → property |
| `fecha_registro` | date | no | | usar fecha de scraping si no hay original |
| `fuente` | text | sí | | `'Rentify'` / `'CS Bienes Raices'` |
| `url` | text | sí | | **clave de unicidad** (verificar antes de insertar) |
| `precio_original` | numeric | no | | en la moneda de `moneda` |
| `moneda` | text | no | check `USD`/`LPS` | |
| `tipo_cambio` | numeric | sí | check > 0 | Ficohsa del día (para registros LPS) |
| `area_construccion` | numeric | sí | check > 0 | |
| `area_terreno` | numeric | sí | check > 0 | **SIEMPRE NULL** para apartamentos |
| `property_code` | varchar | sí | | ⚠️ pendiente ampliar (ver §9.4) |
| `calidad_dato` | varchar | sí | default `MEDIA`, check `ALTA`/`MEDIA`/`BAJA` | |
| `created_by_token` | text | sí | | token/usuario que ingestó (auditoría) |
| `created_at` | timestamptz | sí | `now()` | |

## 3. Dimensiones geográficas

### 3.1 `core.dim_zone` — zona (52 filas)
| Columna | Tipo | Null | Default / Check | Notas |
|---|---|---|---|---|
| `zone_id` | uuid | no | `gen_random_uuid()` | **PK** |
| `zona` | text | no | **unique** | |
| `activo` | bool | no | `true` | **regla:** dropdowns filtran `activo = true` |
| `lat` | numeric | sí | check −90..90 | centroide de zona |
| `lng` | numeric | sí | check −180..180 | centroide de zona |
| `geo_precision` | text | sí | `'ZONA_CENTROIDE'` | |
| `geo_source` | text | sí | `'MANUAL'` | |
| `geo_confidence` | smallint | sí | `3`, check 1..5 | |

### 3.2 `core.dim_colonia` — colonia (60 filas) · ⚠️ **RLS DESACTIVADO** (§9.1)
| Columna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `colonia_id` | uuid | no | `gen_random_uuid()` | **PK** |
| `zone_id` | uuid | no | | **FK** → dim_zone |
| `colonia` | text | no | | |
| `activo` | bool | no | `true` | |
| `created_at` | timestamptz | no | `now()` | |

### 3.3 `core.dim_proyecto` — proyecto/torre (32 filas)
| Columna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `proyecto_id` | uuid | no | `gen_random_uuid()` | **PK** |
| `zone_id` | uuid | no | | **FK** → dim_zone |
| `colonia_id` | uuid | sí | | **FK** → dim_colonia |
| `subzona_id` | uuid | sí | | **FK** → dim_subzona — **LEGADO** |
| `proyecto` | varchar | no | | |
| `tipo_proyecto` | varchar | sí | | `TORRE` / `CONDOMINIO` |
| `activo` | bool | sí | `true` | |

### 3.4 `core.dim_subzona` — **LEGADO / DEPRECATED** (24 filas)
No usar en nuevas inserciones, no eliminar aún. Columnas: `subzona_id` (PK), `zone_id` (FK), `subzona` (varchar), `activa` (bool), `created_at`. Reemplazada por dim_colonia.

## 4. `core.dim_property_type` — tipo de inmueble (3 filas)
`property_type_id` (PK), `tipo_inmueble` (text, unique). Valores y UUIDs (estables):
- `APARTAMENTO` → `cb828362-900b-4cf8-9e7c-d1f5b15d4aa5`
- `CASA` → `8c4efee8-42c2-43ee-b4de-82a64798365e`
- `TERRENO` → `d6006231-4bc5-4375-a6c2-1381089aea84`

## 5. Agregados de mercado (snapshots)

### 5.1 `core.market_snapshot` — foto por zona/tipo/fecha (49 filas)
`snapshot_id` (PK), `zone_id` (FK), `property_type_id` (FK), `fecha_snapshot` (date), `created_at`.

### 5.2 `core.market_metrics` — métricas de cada snapshot (49 filas, 1:1)
| Columna | Tipo | Null | Check | Notas |
|---|---|---|---|---|
| `snapshot_id` | uuid | no | | **PK/FK** → market_snapshot (1:1) |
| `precio_m2_mediana` | numeric | no | > 0 | |
| `cantidad_muestras` | int | sí | ≥ 0 | n de la foto |
| `p25` / `p75` | numeric | sí | | |
| `desviacion_std` | numeric | sí | | |
| `created_at` | timestamptz | sí | | |

> Inmutables: `recalcular_snapshots()` solo inserta (cadencia ≥15 días). El analizador
> **no** consume estos snapshots hoy; calcula todo en vivo desde `listing` (ver
> [calculo_analizador.md](../architecture/calculo_analizador.md) §1).

## 6. Clustering de zonas (infra para "zonas gemelas")

### 6.1 `core.dim_zone_cluster` — grupo de zonas similares (5 filas)
`cluster_id` (PK), `cluster_name` (unique), `descripcion`, `proposito`, `created_at`, `updated_at`.

### 6.2 `core.zone_cluster_assignment` — zona → cluster (45 filas)
`assignment_id` (PK), `zone_id` (unique, FK), `cluster_id` (FK), `asignado_por` (default `MANUAL_FASE_2`), `fecha_asignacion`, `notas`.

> **Relevante:** ya existe una agrupación de **45 de 52 zonas en 5 clusters**. Es el
> cimiento de la idea de **zonas gemelas** (FASE 5-F / RFC-005). Conviene auditar estos
> clusters antes de usarlos.

## 7. Operativo / gobernanza de datos

- **`core.exchange_rate`** (11 filas, **inmutable**): historial diario USD/HNL.
  `rate_id` (PK), `fecha` (unique), `tasa_usd_hnl`, `fuente` (default `exchangerate-api.com`), `created_at`.
  Poblada por Edge Function diaria; **el analizador lee la más reciente** (ver calculo_analizador.md §1.1).
- **`core.audit_log`** (8 filas): hallazgos de auditoría. `id` (serial), `audit_phase`, `finding`, `severity` (ALTA/MEDIA/BAJA), `affected_count`, `action_taken`, `timestamp`.
- **`core.data_quarantine`** (0 filas): registros sospechosos apartados. `id`, `original_table`, `original_id`, `reason`, `severity`, `data` (jsonb), `flagged_at`, `reviewed_by`, `resolution`.

## 8. Esquema `beta` (autenticación — no auditado a fondo aquí)
Fuera de `core`. Usado por el control de acceso del analizador:
- `beta.access_tokens` — tokens de acceso beta (campos vistos en código: `id`, `token`, `activo`, `expira_en`, `assigned_to`, `first_access_at`, `last_access_at`, `total_accesos`, `user_agent`).
- `beta.usage_events` — eventos de uso para tracking.
> Pendiente: documentar `beta` formalmente si se vuelve relevante.

---

## 9. Hallazgos y deudas (al capturar el as-built)

1. **⚠️ CRÍTICO — `core.dim_colonia` tiene RLS DESACTIVADO.** Es la única tabla de `core`
   sin Row Level Security: con la anon key se puede **leer y modificar** toda la tabla.
   El analizador la **lee** con esa key, así que activar RLS **sin** una policy de SELECT
   la rompería. → Decisión pendiente: activar RLS **+** crear policy de solo-lectura para
   `anon`. No auto-aplicado. (Las demás 13 tablas de `core` sí tienen RLS.)
2. **Conteos desactualizados en `CLAUDE.md`** (a corregir): property/listing 134 → **145**;
   dim_zone → **52**; dim_proyecto → **32**; dim_colonia → **60**; market_snapshot → **49**.
3. **Infra de zonas gemelas ya existe** (`dim_zone_cluster` 5 + `zone_cluster_assignment`
   45/52). Adelanta FASE 5-F; auditar antes de usar.
4. **`property_code` sigue `varchar`** (longitud no ampliada) — pendiente histórico en CLAUDE.md.
5. **Doble representación de colonia:** `property.colonia` (texto, NOT NULL) + `property.colonia_id`
   (FK, hoy 100% poblado). El texto es el origen/legado; `colonia_id` es la fuente estructurada.
6. **Legado a no usar:** `dim_subzona`, `property.subzona`, `property.subzona_id`.
