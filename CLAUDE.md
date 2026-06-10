# CLAUDE.md — Proyecto Valorius

> ⚠️ INSTRUCCIÓN PARA CLAUDE CODE — LEER PRIMERO:
> Al INICIAR cada sesión: leer este archivo completo y confirmar el estado actual con el usuario.
> Al CERRAR cada sesión (cuando el usuario se despida o diga "hasta luego"/"listo por hoy"):
> actualizar AUTOMÁTICAMENTE las secciones SESIÓN ACTIVA y LOG DE SESIONES sin que el usuario
> tenga que pedirlo. Esto es obligatorio en cada sesión.
> IDIOMA: Responder SIEMPRE en español.

---

## ⚡ SESIÓN ACTIVA
```
Última sesión  : 2026-06-10
Último paso    : PHASE 1 PASO 1 COMPLETA — Extracción de lógica a lib/ (5 librerías)
               : lib/comparable.js (v1.0): experto en seleccionar comparables (CORAZÓN)
               :   filterByDate, filterByArea, detectOutliers, calculateStats, selectComparables
               : lib/constants.js (v1.0): números duros versionados (códigos, no UUIDs)
               :   PRECIOS, RANGOS_AREA, DIAS, COMPARABLES, IPR, OUTLIER, MONEDAS
               :   getSeveridad, interpretarIPR, interpretarIAO
               : lib/validator.js (v1.0): validaciones de entrada
               :   validateInput, validateTipo, validateArea, validatePrecio, validateMoneda
               : lib/formatter.js (v1.0): formato visual de números
               :   formatCurrency, formatPricePerSquareMeter, formatPercentage, parseInputPrice
               : lib/analyzer.js (v1.0): coordinador que orquesta todo
               :   analyze (entrada → valida → resuelve → calcula → interpreta → retorna)
               :   resolverComparables (fallback 3 niveles), checkAtipicoRatio
               : Commits: c3e7675, fe0c4c2, 7cb2c42 — PHASE 1 PASO 1
Próximo paso   : PHASE 1 PASO 2: Integrar librerías en analizador.html (refactorizar HTML)
               : Luego PHASE 1 PASO 3: Verificar test-cases sigan pasando
               : Luego: FASE 2 (JSON de datos: zones, colonias, projects)
Pendiente auth : CERO cambios a DB sin autorización explícita
Tipo cambio    : analizador lee tasa de core.exchange_rate (dinámica) · última L 26.5943 (2026-06-06)
DB count       : 145 properties / 145 listings
Docs           : /docs ACTUALIZADO — INDEX, ADR-0001..0004, RFC-005, PLAN_EVOLUCION, COMO_FUNCIONA,
               : BUSINESS_RULES, PHASE0_BASELINE
dim_colonia    : 63 colonias (tras FASE 6 reingeniería) — catálogo en data_dictionary.md
dim_zone       : 55 zonas · 52 activas (tras FASE 6: +3 nuevas Las Casitas/El Sauce/Villa Elena)
Seguridad      : RLS en todas las tablas de core (activado 2026-05-27 ss, ADR-0003)
GitHub         : rama main sincronizada — commit 7cb2c42 (2026-06-10)
```

---

## 📋 LOG DE SESIONES
```
2026-06-10 | PHASE 1 PASO 1 COMPLETADA — Extracción de lógica a librerías (5 módulos)
           | lib/comparable.js (v1.0): CORAZÓN del analizador
           |   - ComparableSelector: experto en seleccionar y analizar comparables
           |   - filterByDate (100 días), filterByArea (por rango tipo)
           |   - detectOutliers (IQR factor 1.8), calculateStats (mediana, p25, p75)
           |   - selectComparables: pipeline completo (fecha → área → outliers → stats)
           | lib/constants.js (v1.0): números duros versionados
           |   - Precios: $20k-$5M; Áreas: APTO 25-600, CASA 45-1200, TERRENO 100-5000
           |   - IPR: <0.85 (BAJO), 0.85-1.15 (RANGO), >1.15 (SOBRE)
           |   - Comparables: 100 días, mínimo 3, ideal 15
           |   - Outlier factor 1.8
           |   - getSeveridad, interpretarIPR, interpretarIAO
           | lib/validator.js (v1.0): validaciones de entrada
           |   - validateInput (completa), validateTipo, validateArea (advertencia), validatePrecio (rechazo)
           |   - Advertencia si area fuera de rango, pero no rechazo automático
           | lib/formatter.js (v1.0): formato visual de números
           |   - formatCurrency, formatPricePerSquareMeter, formatPercentage, formatIPRPercentage
           |   - formatArea, formatRange, formatForInput, parseInputPrice
           | lib/analyzer.js (v1.0): COORDINADOR que orquesta todo
           |   - analyze: entrada → valida → resuelve comparables → calcula → interpreta → retorna
           |   - resolverComparables: fallback 3 niveles (colonia ≥3 → zona ≥3 → limitado)
           |   - checkAtipicoRatio: detecta si ratio > 1.8 o < 1/1.8
           | Commits: c3e7675 (comparable+constants), fe0c4c2 (validator+formatter), 7cb2c42 (analyzer)
           | Próximo: PHASE 1 PASO 2 (integrar en analizador.html)

2026-06-10 | PHASE 0 COMPLETADA — Baseline congelado antes de refactorizar
           | test-cases.js: 6 casos de prueba documentados (input → expected output)
           |   Caso 1: Apartamento zona buena, precio en rango (RANGO)
           |   Caso 2: Precio bajo (BAJO)
           |   Caso 3: Precio alto (SOBRE)
           |   Caso 4: Pocas referencias (fallback zona)
           |   Caso 5: Sanity check precio < $20k (rechaza)
           |   Caso 6: Sanity check area fuera de rango (advierte)
           | test-runner.html: interfaz interactiva para ejecutar casos manualmente
           |   - Muestra instrucciones claras
           |   - Lista 6 casos con datos a ingresar
           |   - Botones para marcar "hecho" o "diferente"
           |   - Campo de notas para reportar diferencias
           | docs/BUSINESS_RULES.md (v1.0): números duros versionados
           |   - Precios: $20k-$5M
           |   - Áreas por tipo (APTO 25-600, CASA 45-1200, TERRENO 100-5000)
           |   - IPR < 0.85 (BAJO) | 0.85-1.15 (RANGO) | > 1.15 (SOBRE)
           |   - IAO ≤3 (baja) | 4-8 (moderada) | ≥9 (alta)
           |   - IQR outlier factor 1.8
           |   - Período 100 días, mínimo 3 comparables
           |   - Fallback: colonia ≥3 → zona ≥3 → limitado
           | docs/PHASE0_BASELINE.md (v1.0): cómo usar baseline tras refactorizar
           |   - Artefactos generados (test-cases.js, test-runner.html, BUSINESS_RULES)
           |   - Regla de oro: Si caso falla → revertir inmediatamente
           |   - Qué comportamiento está congelado (input validation, fallback, cálculos, UI)
           | screenshots/phase0-test-runner-baseline.png: baseline visual
           | Commits: bc9c323, 1a1f9a0
           | Próximo: FASE 1 (extraer comparable.js, analyzer.js, validator, formatter, constants)

2026-06-09 | DOCUMENTACIÓN ESTRATÉGICA: Plan de evolución 9 semanas + explicación funcional
           | docs/PLAN_EVOLUCION.md (v1.0) — roadmap CERO presupuesto, 3-4 horas/semana
           |   Principio: cada commit = analizador funcionando
           |   FASE 0 (1 sem): Congelar comportamiento (test-cases.js, screenshots)
           |   FASE 1 (2-3 sem): Separar lógica (comparable.js=EXPERTO, analyzer.js=COORDINADOR,
           |     validator, formatter, constants con códigos estables no UUIDs)
           |   FASE 2 (1-2 sem): Datos en JSON (zones, colonias, projects, property_types)
           |   FASE 3 (3-4 sem): Componentes modulares (AnalysisSummary, PriceCard, ConfidenceIndicator,
           |     ComparableTable, MarketRangeChart, MapPanel)
           |   Arquitectura final: lib/, data/, components/, 200-300 líneas analizador.html
           | docs/COMO_FUNCIONA_ANALIZADOR.md (v1.0) — explicación en palabras claras
           |   30-segundo resumen + paso a paso: validar → buscar → filtrar → estadísticas → 
           |   comparar → confianza
           |   Números duros: 100 días comparables, 3+ mínimo, ±15% IPR, outlier factor 1.8,
           |   rangos de área por tipo, mediana no promedio
           |   Flujo visual, ejemplo real (San Ignacio $180k), FAQ, casos especiales
           |   Sin pseudocode, sin UUIDs, sin jargon técnico
           | Commit 4d675b7: ambas docs subidas
           | Próximo: FASE 0 (test-cases.js + screenshots de comportamiento actual como baseline)

2026-06-08 | FASE 6 v1 — reingeniería geográfica: separar zonas de colonias
           | Detectado: Residencial Las Casitas/El Sauce/Villa Elena eran ZONAS (error)
           | Corregido: creadas zonas nuevas (Las Casitas/El Sauce/Villa Elena) + colonias
           |   (Residencial Las Casitas/El Sauce/Villa Elena) · migradas 10 properties
           | Migración aplicada + zone_aliases.json + ADR-0004 + CHANGELOG + INDEX
           | Zonas antiguas desactivadas (activo=false), preservado historial
           | Commit pending — reingeniería geográfica completa (documentación + CLAUDE.md)

2026-06-06 | Sesión larga: UX analizador + gobernanza documental + documentación base as-built
           | UX analizador (commit 63b8610): precio con comas (fix "L 3.5" — parseFloat de puntos
           |   daba 3.5), badge "Tu propiedad" en leyenda de rangos, resaltado de zona analizada
           |   en mapa (resto atenuado conservando color)
           | GOBERNANZA DOCUMENTAL (ADR-0002): /docs con INDEX, decisions/, design/, plantillas,
           |   Definition of Done, regla de cobertura. Principio: Git = fuente de verdad
           | ADR-0001: trabajamos con precios de OFERTA, no de cierre (techo de confianza)
           | RFC-005: motor de comparables ajustado por tamaño (FASE 5) — borrador, umbrales DRAFT
           |   (estratificación + outliers multivariante + score de confianza + zonas gemelas)
           | DOCUMENTACIÓN BASE AS-BUILT (para que nada viva solo en el chat/frontend):
           |   calculo_analizador.md v1.1 — lógica COMPLETA del analizador capturada del JS
           |   data_dictionary.md v1.1 — modelo de datos core (14 tablas), verificado vs DB
           |   arquitectura.md v1.0 — inventario: front (index/ingesta/analizador), 7 Edge Functions,
           |     scrapers (Rentify/Playwright), flujo de datos extremo a extremo
           | FIX tasa LPS dinámica: analizador lee core.exchange_rate (deuda técnica #1) — commit e7e4778
           | SECURITY: RLS activado en core.dim_colonia (era la ÚNICA tabla de core sin RLS;
           |   anon podía leer/modificar). Migración enable_rls_dim_colonia + ADR-0003 — commit f4bb754
           | CLAUDE.md: conteos sincronizados 134→145, zonas →52/51act, colonias →60, proyectos →32,
           |   snapshots →49 (commit 532becd)
           | Análisis Accumin (ex-Tinsa): evolución de cómo consiguen datos (físico→exhaust→índice→
           |   compra calidad de datos→automatiza). Lecciones: zonas gemelas, score de confianza,
           |   dato limpio = activo. Hallazgo: infra de clusters YA existe (zone_cluster_assignment 45/52)
           | Cobertura medida (145 listings): colonia vs zona → FASE 6 reingeniería geográfica
           |   PROPUESTA (no decidida). Pendiente audit_02 de los 52 nombres de zona
           | Deudas registradas (no resueltas): analizador #2 filtro pm² laxo, #3 PRECIO_MIN,
           |   #4 mediana no interpolada (reconciliar docs); Edge Functions TS sin auditar; LEEME.txt viejo
           | Commits del día: 63b8610, f9ee633, e7e4778, 1aea1f7, f4bb754, 532becd, 925c1f3

2026-05-29 | FASE 2-E completada — GEO_DICT migrado de JS hardcoded a core.dim_zone
           | dim_zone: +5 columnas geo (lat, lng, geo_precision, geo_source, geo_confidence)
           | 3 constraints idempotentes (DO $$ EXCEPTION WHEN duplicate_object)
           | 49 UPDATEs ejecutados y validados: zonas_con_coords=49, sin_coords=0, activas_con_coords=48
           | 5 coordenadas ajustadas por fuentes cruzadas: Bulevar Morazán, El Trapiche,
           |   Lomas del Guijarro, Miraflores, Anillo Periférico
           | El Sauce y San Ignacio: coordenadas originales mantenidas — fuentes externas no concluyentes
           | analizador.html: GEO_DICT vacío poblado en init · clave zone_id · !== undefined
           | Decisión arquitectura: Claude como asesor experto de Valorius — rol guardado en memory
           | migration_dim_zone_geo.sql creado en docs/database/ · GitHub commit b74072a
           |
           | FASE 2-D completada — Mapa de contexto competitivo
           | Panel "Mapa de contexto competitivo" con Leaflet.js CartoDB Dark Matter
           | Zonas activas coloreadas por precio relativo a mediana global del tipo
           | Tamaño burbuja proporcional a cobertura (n referencias) · tooltip permanente en zona analizada
           | Popup con $/m², n referencias, diferencia % vs zona analizada
           | Overlay navy ::after z-index 350 (tinta fondo sin tapar marcadores z-600)
           | Burbuja dorada de precio sobre thumb del slider POSICION EN EL MERCADO
           | GitHub commit 8ebdcfd (sesión anterior misma fecha)
           |
           | FASE 2-C completada — Gráfico comparación rediseñado con datos reales
           | renderChart reescrito: comparables reales ordenados por pm², burbuja proporcional a m²
           | Línea horizontal dorada al nivel de "tu precio" (adaptiva a su posición)
           | Caja etiqueta + línea vertical sólida en orilla derecha mostrando mediana
           | items[] almacenados en gruposZona/gruposColonia · viewBox 325px · 4 clases CSS nuevas
           | preview_chart.html creado como prototipo iterado con el usuario (5+ versiones)
           | GitHub commit 8ebdcfd subido
           |
           | FASE 2-A3 completada — UX analizador (gauge 220px, bulb formula, signo buyer, chart 220px)
           | FASE 2-B completada — push GitHub commit ceceaf3, backups eliminados
           | FASE 2-B1 — 4 colonias villas creadas en Residencial El Sauce (dim_colonia ahora 55)
           |   Villa Los Nopales, Villa Cipreses, Villa Napoleón, Villa Las Palmeras
           |   3 properties actualizadas con colonia_id · Villa Cipreses calidad ALTA confirmada
           | Decisión modelo: villas dentro de residenciales → colonia (no proyecto)
           |
2026-05-28 | FASE 1-C2/1-D/1-G/1-J/1-K completadas (sesión anterior)
           | FASE 2-A completada — analizador.html refactorizado
           | selSubzona → selColonia (guarda colonia_id, cascada desde zone_id de selZona)
           | selZona ahora guarda zone_id (no texto libre de colonia como antes)
           | Fetch eliminado: dim_subzona — reemplazado por dim_colonia + dim_zone
           | Clave de comparables: zone_id||colonia_id||tipo (antes: colonia_texto||tipo)
           | Fallback 3 niveles: colonia ≥3 → 'colonia'; <3 pero zona ≥3 → 'zona' con aviso; <3 → 'limitado'
           | PDF: zonaLabel (zona·colonia), indicador NIVEL en esquina del bloque conclusión
           | azProyectos ahora tiene proyecto_id + colonia_id para filtrado correcto

2026-05-27 | FASE 1-B/1-F completadas — todos los hallazgos de auditoría resueltos por el usuario
           | HALLAZGO 1: Torre Aura Las Colinas → zone=Boulevard Centroamerica, colonia=Las Colinas
           | HALLAZGO 2: Cefiro Azul/Anillo Periférico → colonia=Zarahemla II, proyecto=Céfiro Azul asignado
           | HALLAZGO 3-A: El Trapiche (10 props) → colonia=Colonia El Trapiche, proyecto=Distrito Artemisa
           | HALLAZGO 3-B: Miraflores (11 props) → colonia=Colonia Miraflores, proyecto=Torre Lirios
           | HALLAZGO 3-C: San Ignacio (17 props) → Res. San Ignacio (13) + Res. Palmeras (3) + NULL(1)
           | HALLAZGO 4: tipo_proyecto normalizado → solo TORRE y CONDOMINIO (10 VERTICAL→TORRE, Ecovivienda→CONDOMINIO)
           | Cat A: 12 correcciones ortográficas directas + Res. Los Angeles → Res. Mirador de Los Ángeles
           | Cat B: Res. Zarahemla (zona→Anillo Periférico), Montecarlo Morazán→Torre Atlas asignado
           | dim_zone: 4 eliminadas (Colonia Palmira, Las Colinas, Las Hadas, Res. Centroamérica)
           |          1 creada: Boulevard Centroamerica (8ed4d462) · 1 renombrada: Roble Oeste→Los Robles
           | RLS activado en 5 tablas: audit_log, data_quarantine, dim_zone_cluster,
           |   zone_cluster_assignment, exchange_rate
           | FASE 4 Mercado Primario aprobada — tablas developer_project + developer_inventory_observation
           |
           | FASE 1-A completada — auditoría completa de colonias, zonas y proyectos (solo lectura)
           | 43 propiedades con colonia≠zona identificadas — docs/database/audit_01_colonias.md

2026-05-26 | Plan maestro Fases 0-3 acordado con el usuario
           | Jerarquía geográfica confirmada: Zona → Colonia → Proyecto
           | dim_subzona: DEPRECATED (no eliminar, no usar en nuevas inserciones)
           | GitHub conectado como control de versiones principal
           | /docs structure creada: /database /architecture /ingesta /changelog
           | .gitignore actualizado (tmp, xlsx, .claude, backup sql excluidos)
           | CLAUDE.md creado en raíz del repo (contexto automático por sesión)
           | CHANGELOG.md creado con historial de decisiones
           | Regla: property_code a revisar (varchar(20)→120 o + source_listing_id)
           | Regla: CERO cambios DB sin autorización explícita del usuario

2026-05-26 | Revisión profunda DB (134 props/listings — integridad referencial OK)
           | Corrección crítica: listing Lomas del Guijarro LPS→USD ($243k, $1,421/m²)
           | Catálogo actualizado: +3 zonas, +11 proyectos
           | Tabla core.exchange_rate creada (historial diario USD/HNL, inmutable)
           | Tasa L 26.5923 insertada manualmente como primera entrada
           | Edge Functions update_exchange_rate + generar_snapshot creadas y testeadas
           | función recalcular_snapshots() mejorada: cadencia 15 días, tasa dinámica

2026-05-25 | Revisión completa del Excel v2.xlsx (Revision_Consolidada, 30 registros)
           | Regla nueva: subzona_normalizada (col R) → colonia en DB
           | Regla nueva: Monoambiente → habitaciones = 1 (no NULL)
           | id=13 rechazado manualmente (sin m²)
           | ids 35 y 37 excluidos (data no limpia)
           | Backup completo DB iniciado (backup_20260525.sql)

2026-05-24 | Scraping CS Bienes Raíces (58 extraídos → 19 seleccionados)
           | Rentify scraper V1→V3 iterado
           | Jerarquía definida: Zona → Colonia → Proyecto (dim_subzona deprecated)

2026-05-21 | Scraping Encuentra24 descartado (bloqueo 403)
           | CS Bienes Raíces scraper V5 funciona con networkidle
           | Excel v2.xlsx generado con 37 registros
```

---

## 1. INFRAESTRUCTURA

```
Supabase Project ID : oxhzxistgyfvkhzncxpz
Region              : us-east-1
Schema              : core
GitHub repo         : https://github.com/angelojr182/Valorius.git (rama main)
gh CLI              : NO instalado — usar git nativo
```

### Conteo actual en DB
```sql
SELECT
  (SELECT COUNT(*) FROM core.property) as properties,
  (SELECT COUNT(*) FROM core.listing) as listings;
-- Estado actual: 145 / 145
```

---

## 2. ESQUEMA SQL

### core.property
```sql
property_id       UUID PK          gen_random_uuid()
zone_id           UUID NOT NULL    → core.dim_zone.zone_id
property_type_id  UUID NOT NULL    → core.dim_property_type.property_type_id
ciudad            TEXT NOT NULL    -- siempre 'Tegucigalpa'
colonia           TEXT NOT NULL    -- nombre de la colonia dentro de la zona (NOT NULL)
habitaciones      INT NULL         -- Monoambiente = 1 (no NULL, no 0)
banos             NUMERIC NULL
estacionamientos  INT NULL
nivel_seguridad   TEXT NULL
subzona_id        UUID NULL        → core.dim_subzona  -- DEPRECATED, no usar
proyecto_id       UUID NULL        → core.dim_proyecto -- solo si existe en catálogo
descripcion       TEXT NULL
subzona           TEXT NULL        -- campo legado, no poblar
```

### core.listing
```sql
listing_id        UUID PK          gen_random_uuid()
property_id       UUID NOT NULL    → core.property.property_id
fecha_registro    DATE NOT NULL    -- usar fecha_scraping si no hay fecha original
fuente            TEXT NULL        -- 'Rentify' o 'CS Bienes Raices'
url               TEXT NULL        -- NO duplicar si ya existe en DB
precio_original   NUMERIC NOT NULL
moneda            TEXT NOT NULL    -- 'USD' o 'LPS'
tipo_cambio       NUMERIC NULL     -- Ficohsa venta del día (26.5923 actual)
area_construccion NUMERIC NULL
area_terreno      NUMERIC NULL     -- SIEMPRE NULL para apartamentos
property_code     VARCHAR(20) NULL -- ⚠️ PENDIENTE ampliar a varchar(120) — causó problemas con Rentify
calidad_dato      VARCHAR NULL     -- 'ALTA'|'MEDIA'|'BAJA'
created_by_token  TEXT NULL
```

### core.dim_zone
```sql
zone_id        UUID PK
zona           TEXT UNIQUE NOT NULL
activo         BOOLEAN DEFAULT true
lat            NUMERIC(10,7) NULL  -- centroide de zona (verificado 2026-05-29)
lng            NUMERIC(10,7) NULL  -- centroide de zona (verificado 2026-05-29)
geo_precision  TEXT DEFAULT 'ZONA_CENTROIDE'
geo_source     TEXT DEFAULT 'MANUAL'
geo_confidence SMALLINT DEFAULT 3  -- escala 1-5
-- 52 zonas · 51 activas · Zarahemla II activo=false
-- El Sauce y San Ignacio: coordenadas pendientes verificación manual
-- REGLA: dropdowns futuros filtran WHERE activo = true
```

### core.dim_colonia (PENDIENTE CREAR — FASE 1-C)
```sql
-- Esta tabla NO existe aún. Se creará en FASE 1 después de auditoría y aprobación.
-- Reemplazará el texto libre en property.colonia con una FK estructurada.
colonia_id  UUID PK
zone_id     UUID NOT NULL → core.dim_zone
colonia     TEXT NOT NULL
```

### core.dim_proyecto
```sql
proyecto_id   UUID PK
zone_id       UUID NOT NULL → core.dim_zone
subzona_id    UUID NULL     → core.dim_subzona (legado)
proyecto      VARCHAR NOT NULL
tipo_proyecto VARCHAR NULL   -- 'TORRE' | 'CONDOMINIO'
activo        BOOLEAN DEFAULT true
-- ⚠️ PENDIENTE FASE 1-E: agregar colonia_id FK cuando dim_colonia esté lista
```

### core.market_snapshot / core.market_metrics
```sql
-- Snapshots actuales: 49 registros
-- Zonas con snapshots: Bulevar Morazán, El Trapiche, Lomas del Guijarro,
--   Miraflores, Res. El Sauce, Res. Portal Bosque 1, Res. Villa Elena,
--   San Ignacio, Anillo Periférico, Res. Zarahemla II, Las Colinas
```

---

## 3. CATÁLOGO DB CON UUIDs

### dim_property_type
```
APARTAMENTO  → cb828362-900b-4cf8-9e7c-d1f5b15d4aa5
CASA         → 8c4efee8-42c2-43ee-b4de-82a64798365e
TERRENO      → d6006231-4bc5-4375-a6c2-1381089aea84
```

### dim_zone (52 zonas · 51 activas — conteo 2026-06-06 · catálogo canónico: docs/database/data_dictionary.md)
```
-- ELIMINADAS 2026-05-27 (eran colonias, no zonas): Colonia Palmira, Las Colinas, Las Hadas, Residencial Centroamérica
-- CREADA 2026-05-27: Boulevard Centroamerica
-- RENOMBRADA 2026-05-27: Roble Oeste → Los Robles

Aldea de Guasculile                  → 20083c6e-8ddb-4e7d-a7d4-86ecc4793fc6
Altos de la Granja                   → f1e5dd52-cb62-449c-a329-cb062a43884c
Anillo Periférico                    → c577b26f-3041-483b-be3c-6d849d35eca7
Barrio Bella Vista                   → bbe4f9c4-e2e7-450e-a957-97fa9c8bb04f
Barrio Buenos Aires                  → 22a4b83f-ea0d-472d-b4be-53b7fe702fe9
Barrio Guanacaste                    → f34d9881-844d-487b-84dc-3cbb5a351421
Barrio La Leona                      → ca7bb1fa-6a38-4647-811d-068ddbdf210f
Boulevard Fuerzas Armadas            → 672062c4-102d-45de-935e-515e39abfa14
Boulevard Centroamerica              → 8ed4d462-5c32-456b-ab2f-06fab6275e90  ← NUEVA
Bulevar Morazán                      → 7fd29b38-d38f-4e8d-8007-976ef5d1bc71
Colonia América                      → 208c243f-078e-489e-947c-01d52c5d40c5
Colonia Guadalupe López Villanueva   → 1c67efcb-0693-4fd4-abd0-54db40ed67c4
Colonia Guaymuras                    → ce304592-1abf-48e3-b0fb-872ae474c86f
Colonia La Era                       → cfd26db6-ac7a-4d0b-88d4-5bb30d6512f4
Colonia La Pradera                   → d86a3239-a45a-4cad-96ca-9126b8624815
Colonia La Sosa                      → c284d277-39d2-4915-bd0c-73f7104332e2
Colonia Lara                         → 7f0e2113-d19b-4290-8e27-16b80a9776e5
Colonia Loma Linda Norte             → 0fd3ac13-3a9d-492c-8b3e-556b3e902145
Colonia Lomas de Tiloarque           → f6278593-c5a1-4618-a8c7-cc68038dfeb2
Colonia Los Ángeles                  → ff7b572e-b220-418c-9031-ae0aa01c4daf
Colonia Modelo                       → 860b90f9-c281-455f-a181-e1c654ca4110
Colonia San José del Loarque         → 0b3bd9e0-37a8-4834-a1d1-75951f5a02ac
Colonia Satélite                     → c554b5d4-124c-4e78-ada1-cfec9ea446eb
Colonia Tepeyac                      → 6cea85c7-84c7-4ffc-ae45-f401d80ef6ab
El Hatillo                           → 432dd604-58fc-414c-9d67-fd18ed4ba835
El Trapiche                          → 6ffdc66c-a15b-498c-a60d-cadc4346f89a
La Esperanza                         → 9e004954-e5e1-475f-9f16-088bceaee359
Las Uvas                             → 3df25638-0d68-4726-b411-928fb7335ad5
Lomas del Guijarro                   → 18e45e8c-1143-487e-aad3-5efd1af5b763
Lomas del Molino                     → 7a41ace6-454f-4e68-a456-69a13bd61186
Los Robles                           → 8d6639c9-6de7-4766-94c8-954160d6f796  ← antes: Roble Oeste
Miraflores                           → b61262d0-7710-4da4-b01b-65efedf376a2
Residencial Buena Vista              → 976e27bf-0f0b-4c4f-a1af-455237d494a1
Residencial Ciudad Nueva             → 768480af-b7f2-420b-9557-d69e8b0832bf
Residencial Concepción II            → c1a85e8f-5350-454a-b4cd-1a1308ac83e1
Residencial El Sauce                 → 8e11848a-54a9-484e-98aa-ebf35ce7b77e
Residencial Hacienda Real            → 9ea495bb-9e3c-422b-be2a-f31be3d53526
Residencial Las Casitas              → 063cd486-1a14-481b-baf2-78c18b4a5068
Residencial Los Cerezos              → a658defc-22ec-4440-a569-60a4ca7f7c3f
Residencial Mirador de los Hidalgos  → b9b567f1-6413-4a6e-9f0e-c6f6280f0450
Residencial Paseo de las Campanas    → 45db5a2a-2f5d-47a2-9232-d3b8abf25930
Residencial Portal del Bosque 1      → b77619bc-b0d5-4ed2-a3e9-c65eaa9f5b66
Residencial Quinta Isabel            → 5b02fd93-bff4-428f-9a93-70cc759a1929
Residencial San Juan                 → 83743355-33cd-42ea-bc68-f1d869538c21
Residencial Villa Elena              → ab73c240-311e-4b1f-a081-15cccb0c6f7b
Residencial Zarahemla II             → 4924abf6-7379-432d-99df-99702eb56e9e
San Ignacio                          → 3924ec4a-bd5e-4871-8dc3-3d1e3d78d887
Torocagua                            → fdd06173-ad0c-42e6-acf6-b85e9e2e6dc9
Zambrano                             → 66062aa9-b8a7-4a08-ac4a-7e9ec9aba1fc
```

### dim_proyecto (32 proyectos)
```
Condominios Alcazar          (Anillo Periférico)        → a6db2b5b-474d-4177-b88b-84a3dd4fce95
Torre Atlas                  (Bulevar Morazán)          → 87bab2a8-e771-47c6-ab51-9eb75cd02c6b
Torre Centro Morazán         (Bulevar Morazán)          → 99882a59-6b6a-4ece-a5ac-43a6f9a8f7b7
Torre Costa Próceres         (Colonia Lara)             → fbf840fd-656e-4d2f-a2bf-068987cc0841
Torre Urbana Lara            (Colonia Lara)             → 3efa9abf-245a-42fc-b971-8a840da7e648
Avalon                       (Colonia Loma Linda Norte) → d7db94b5-a90b-48df-88dd-f56da32348c8
Ecovivienda                  (Colonia La Era)           → 6ec02bcc-68fa-4d07-9467-4db0fd09f20c  tipo: CONDOMINIO
Distrito Artemisa            (El Trapiche)              → 75ca4e4e-d5d8-4fe0-a0dd-cbe5659018ee
Torre Aura                   (Boulevard Centroamerica)  → acc4398f-9b78-45fa-98c3-8127356715f1  ← zona actualizada
Torre Ámbar                  (Lomas del Guijarro)       → 95631612-5d72-42a4-8bf0-76ad1ec50db2
Torre KIREI                  (Lomas del Guijarro)       → 7ae6fe12-5f67-480f-baf4-815eeef09d51
Torre la Trinidad            (Lomas del Guijarro)       → 3a176ceb-df50-4075-a0b2-811aefa8907e
Torre Nivo                   (Lomas del Guijarro)       → e99268f9-c5f8-4583-8189-e6d4b85e4caf
Torre Tiffany                (Lomas del Guijarro)       → 373d0a69-fa5e-4434-a160-0fe142f903b8
Torre Alfonso XIII           (Lomas del Guijarro Norte) → 2fcbb631-e2e7-4adf-9c85-257f8dc3682c
Torre Doss                   (Lomas del Guijarro Norte) → cdf63da4-2661-4d96-9141-067ee2d6c0d7
Torre O                      (Lomas del Guijarro Norte) → 3fff3474-f046-4271-b445-9fe3bf7b2600
Torre Platinum               (Lomas del Guijarro Norte) → 6cac6bcc-744d-4246-b8f8-6d160254e084
Torre Taragon                (Lomas del Molino)         → fb7e609f-474a-409f-8e94-8de6d61d1b3b
Torre Lirios de Miraflores   (Miraflores)               → cce7745a-885c-4823-9e27-5a94c30255d2
Torre Almendro               (Residencial El Sauce)     → 5a1229a0-e19c-4523-b87d-65a7120c1b13
Torre 1                      (Res. Portal del Bosque 1) → eaa9d3ef-4b1e-4c91-b8ad-80680e1a3355
Torre 2                      (Res. Portal del Bosque 1) → 2134459e-281b-479e-b4cc-1be8a0057c4f
Céfiro Azul                  (Residencial Zarahemla II) → a32e37cf-804c-416b-b1ae-86fc657c3da3
Torre Acacias                (San Ignacio)              → 8470a95d-51ac-46d3-8741-667c5330beca
Torre Cipreses               (San Ignacio)              → 723ad1ee-8a4f-48cf-8630-3d811c9075d0
```

### dim_subzona (DEPRECATED — NO usar en nuevas inserciones, NO eliminar aún)
```
Anillo Periférico            → db309e5f-44b8-4279-a0bd-5fb737523a20
Bulevar Morazán              → eb553c5c-b00b-4ae5-9c0f-cf3b01ba234f
El Trapiche                  → c356e3c6-f3a6-4d1d-8a4d-aba0ff3f7b97
Lomas del Guijarro Norte     → 5fde0f7a-6af1-415f-8cdc-cb8cbea280a0
Lomas del Guijarro Sur       → 74703f91-c247-45da-9656-96c09aa64fac
Miraflores                   → 50ab589d-5d1a-43c2-b5fc-6559fc71b26c
Portal del Bosque 1          → c4841f17-8dcd-4cf6-9a0a-71c7872e4813
Portal del Bosque 2          → 11e75f85-d2d0-43d2-9048-1fb8859b435b
Res. El Sauce                → 6f52a719-b190-4cf7-9cb4-2c9b28f148eb
Res. Villa Elena             → a56e3f3e-3c08-426a-ba21-0f87e5e7d005
San Ignacio                  → 25e74d4f-62e8-4448-96c4-a806433e4d84
Zarahemla / Etapa 1 / Etapa2 → 3e133267 / 98635c08 / 50c11262
```

---

## 4. JERARQUÍA GEOGRÁFICA

```
Zona (dim_zone) → Colonia (dim_colonia — PENDIENTE) → Proyecto (dim_proyecto)
```

**Reglas:**
- `dim_subzona` existe en DB pero **DEPRECATED — NO se usa en nuevas inserciones**
- `colonia` en property = nombre de la colonia dentro de la zona (hoy texto libre, pendiente FK dim_colonia)
- `proyecto_id` solo si existe en catálogo — NUNCA inventar
- `subzona_id` → solo registros legados, no poblar en nuevas inserciones
- Torres son **proyectos**, NUNCA colonias — si el scraper pone nombre de torre en colonia, corregir
- El Trapiche es zona amplia con múltiples colonias — NO generalizar como colonia única
- Miraflores tiene múltiples colonias (Miraflores Sur, etc.) — NO generalizar
- Zarahemla II es colonia dentro de Anillo Periférico (no zona independiente) — propiedades van a zone_id=Anillo Periférico
- Distrito Artemisa = proyecto en zona El Trapiche, colonia = Colonia El Trapiche
- tipo_proyecto: solo **TORRE** (edificio vertical único) y **CONDOMINIO** (complejo múltiples edificios)
- Bulevares (Bulevar Morazán, Boulevard Fuerzas Armadas) en dim_zone — pendiente revisar si deben permanecer

---

## 5. REGLAS DE NEGOCIO

### Campos obligatorios
- zone_id, property_type_id, ciudad, colonia, precio_original, moneda, fecha_registro

### Calidad del dato
- ALTA = precio + área + habitaciones + baños (todos presentes)
- MEDIA = precio + área (falta habitaciones o baños)
- BAJA = datos mínimos

### Tipo inmueble especial
- Monoambiente → tipo APARTAMENTO, habitaciones = **1** (no NULL, no 0)
- area_terreno → **SIEMPRE NULL** para apartamentos

### Tipo de cambio
- Fuente: Ficohsa (venta) del día
- 2026-05-26: L **26.5923** — verificar cada sesión

### Precio mínimo válido
- < $20,000 USD → DESCARTAR
- precio/m² < $500 → DESCARTAR
- precio/m² > $4,000 → REVISAR manual

### URL como identificador de unicidad
- Verificar duplicado por URL antes de insertar, no por property_code

---

## 6. ESTADO DE INGESTA

### Archivo fuente
```
Valorius_Consolidado_Rentify_CS_revision_ingesta_v2.xlsx
Hoja activa: Revision_Consolidada (30 registros, ids 1–30)
```

### Breakdown de los 30 registros
```
LISTO_INGESTA aprobados   : ids 1,3,4,7,8,12,16,25,26,27  → 10 registros ← PENDIENTE
LISTO_INGESTA rechazado   : id=13 (sin m², descartado)
REVISAR_PROYECTO          : ids 2,10,11,20,21,22,23,24    →  8 registros
REVISAR_SUBZONA           : ids 6,15,28,29,30             →  5 registros
NO_INGESTAR_AUN           : ids 5,9,14,17,18,19           →  6 registros
EXCLUIDOS                 : ids 35, 37 (data no limpia)
```

---

## 7. SCRAPERS

### Portales evaluados
```
✅ Rentify              — PREFERIDO, tiene fecha y estado
✅ CS Bienes Raíces     — Funciona, sin fecha
🔜 Bienes Raíces Trebol — Config lista, pendiente
🔜 FazWaz              — 506 props, requiere mayor presupuesto
❌ Encuentra24          — Descartado (403 irresolubles)
```

---

## 8. PATRÓN DE INGESTA SQL

```sql
-- SIEMPRE verificar antes de insertar:
SELECT l.listing_id FROM core.listing l WHERE l.url = '{url}';
SELECT zone_id FROM core.dim_zone WHERE zona = '{zona}';
SELECT proyecto_id FROM core.dim_proyecto WHERE proyecto = '{proyecto}';

INSERT INTO core.property (
    zone_id, property_type_id, ciudad, colonia,
    habitaciones, banos, estacionamientos, proyecto_id, descripcion
) VALUES (...) RETURNING property_id;

INSERT INTO core.listing (
    property_id, fecha_registro, fuente, url,
    precio_original, moneda, tipo_cambio,
    area_construccion, area_terreno, calidad_dato, created_by_token
) VALUES (...);
```

---

## 9. REGLAS OPERATIVAS

### NUNCA sin autorización explícita del usuario
- INSERT / UPDATE / DELETE en tablas core
- Crear zonas, colonias o proyectos en dim_*
- Modificar estructura de tablas (ALTER TABLE)
- Ejecutar snapshot (recalcular_snapshots)

### SIEMPRE antes de ingestar
1. Verificar conteo actual: `SELECT COUNT(*) FROM core.property`
2. Confirmar tipo de cambio Ficohsa del día
3. Verificar que zone_id existe en catálogo
4. Verificar que no es duplicado por URL
5. Esperar autorización del usuario

---

## 10. CONSULTAS DE REFERENCIA

```sql
-- Árbol zona/proyecto
SELECT z.zona, p.proyecto FROM core.dim_zone z
LEFT JOIN core.dim_proyecto p ON p.zone_id = z.zone_id
WHERE p.proyecto IS NOT NULL ORDER BY z.zona, p.proyecto;

-- Propiedades por zona
SELECT z.zona, COUNT(*) as total
FROM core.property p JOIN core.dim_zone z ON p.zone_id = z.zone_id
GROUP BY z.zona ORDER BY total DESC;

-- Tasa de cambio más reciente
SELECT fecha, tasa_usd_hnl FROM core.exchange_rate ORDER BY fecha DESC LIMIT 1;

-- Verificar duplicado por URL
SELECT listing_id FROM core.listing WHERE url = '{url}';
```

---

## 11. TIPO DE CAMBIO Y SNAPSHOTS

### Edge Functions (activas)
```
update_exchange_rate  → corre DIARIO a medianoche
                        consulta api.exchangerate-api.com/v6/{KEY}/latest/USD
generar_snapshot      → corre cada 15 DÍAS
                        ejecuta SELECT core.recalcular_snapshots()
```

### recalcular_snapshots() — comportamiento
```
- Toma tasa de core.exchange_rate (más reciente)
- Cadencia: ≥15 días desde el último snapshot
- p_forzar BOOLEAN: SELECT core.recalcular_snapshots(true) para forzar
- No modifica snapshots existentes — solo INSERT
```

---

## 12. FASE 4 — MERCADO PRIMARIO (APROBADA 2026-05-27)

### Objetivo
Incorporar datos de proyectos nuevos/preventa como capa separada de inteligencia.
**NUNCA mezclar con el benchmark principal (core.listing = solo mercado secundario).**

### Tablas nuevas (pendiente crear — FASE 4-A)
```sql
core.developer_project
  -- proyecto como entidad: desarrollador, zona, estado, fecha entrega, avance obra, url

core.developer_inventory_observation
  -- observaciones de precios por tipología/piso con fecha_observacion
  -- INMUTABLES: no son verdad permanente, cada captura lleva fecha
```

### Vista (pendiente crear — FASE 4-C)
```sql
v_primary_market_context
  -- zona, proyecto, desarrollador, precio_m2 min/mediana/max,
  -- unidades observadas, fecha_ultima_observacion
```

### Reglas inamovibles
- `core.listing` = solo mercado secundario — NUNCA mezclar
- NUNCA presentar como "precio justo" ni incluir en mediana principal
- Cada captura lleva `fecha_observacion`
- Captura manual primero (5–10 proyectos), automatizar después

### Integración en el analizador (FASE 4-D)
Bloque secundario debajo del veredicto principal:
> "En esta zona existen proyectos nuevos con precios oficiales observados desde $X/m².
>  Estos precios no forman parte del benchmark principal."

### Audiencia objetivo
Comprador usado vs nuevo · pequeño inversionista · agente inmobiliario · propietario que compite contra torres nuevas

### Tareas
- 4-A: Crear tablas developer_project + developer_inventory_observation
- 4-B: Captura manual inicial (5–10 proyectos)
- 4-C: Crear vista v_primary_market_context
- 4-D: Integrar bloque en analizador.html

---

## 13. INSTRUCCIONES PARA ACTUALIZAR ESTE ARCHIVO

Al cerrar cada sesión, Claude Code debe actualizar automáticamente:
1. **SESIÓN ACTIVA** — último paso, próximo paso, tipo de cambio
2. **LOG DE SESIONES** — agregar entrada con fecha y resumen
3. Cualquier UUID nuevo, decisión nueva o regla nueva que haya surgido
