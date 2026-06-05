# CHANGELOG — Valorius Dashboard V2

> Formato: `[FECHA] — TIPO — Descripción`
> Tipos: DECISION | SCHEMA | DATA | FEATURE | FIX | DEPRECATION | RULE

---

## 2026-06-04

### DECISION — Gobernanza documental de Valorius (ADR-0002)
- Se adopta un sistema mínimo de documentación versionada en Git. Regla operativa:
  "Si no está documentado, versionado y trazable, no existe como decisión formal".
- Artefactos: ADR (decisiones), RFC (diseño previo), método canónico (versionado),
  INDEX, CHANGELOG. Diferidos: diccionario de datos formal, SOP, linaje completo.
- Estructura nueva: `docs/INDEX.md`, `docs/decisions/`, `docs/design/`, plantillas
  ADR y RFC.

### RULE — Definition of Done del proyecto
- Un cambio no está cerrado sin: (1) código/SQL aplicado si corresponde,
  (2) documento actualizado, (3) registro en este CHANGELOG, (4) validación o
  evidencia del resultado.
- Regla de cobertura: todo cambio importante lleva al menos un ADR, un RFC o una
  actualización del método canónico.

### DECISION — Trabajamos con precios de oferta, no de cierre (ADR-0001)
- Formaliza que las fuentes publican precios pedidos, no de transacción. Todo
  resultado es "referencia", no valoración formal; el score de confianza nace
  atado a esta limitación.

### DECISION — FASE 5 "Motor de Comparables Confiables" en diseño (RFC-005)
- Borrador del motor de comparables ajustado por tamaño: estratificación +
  limpieza de atípicos multivariante + score de confianza, como métrica
  SECUNDARIA. Umbrales en estado DRAFT. No se toca aún el cálculo principal.
- Método canónico iniciado como stub versionado: `docs/architecture/calculo_analizador.md` v0.1.

---

## 2026-05-28

### FIX — FASE 2-A2: filtro de proyectos por tipo de inmueble (basado en data real)
- Bug detectado: con tipo=CASA seleccionado, el dropdown mostraba torres (Torre Acacias, Torre Cipreses, etc.) que son edificios de apartamentos — visualmente contradictorio para el usuario
- Solución: nuevo mapa `proyectoTipos = {proyecto_id: {tipo: n}}` construido desde listings reales (`property.proyecto_id` + `dim_property_type.tipo_inmueble`)
- `filtrarProyectos()` ahora filtra primero por colonia/zona y luego por tipo: solo muestra proyectos que tienen ≥1 propiedad del tipo seleccionado en los últimos 100 días
- Cada opción muestra el conteo: `Torre Acacias (6)` — 6 apartamentos en data
- Si el proyecto previo no es compatible con el nuevo tipo, se limpia automáticamente junto con el hint
- Fetch ampliado: `property(zone_id,colonia_id,proyecto_id,...)` — agregado proyecto_id
- Resultado actual: con tipo=CASA, dropdown de proyectos siempre vacío (ningún proyecto en DB tiene casas registradas todavía); con tipo=APARTAMENTO, dropdown muestra las torres correspondientes con su conteo

### UX — FASE 2-A2: dropdown de colonia + hint enriquecido
- Quitado color naranja `#f59e0b` y gris oscuro `#475569` de las opciones — todas usan color por defecto legible
- Sufijos uniformes: `(N props)` para n≥3, `(N ref)` para 1≤n<3, `(sin datos)` para n=0
- Hint de proyecto ahora indica colonias adicionales: "Proyecto ubicado en X. Hay N colonia(s) mas disponible(s) en esta zona."
- Aplica a las 3 zonas con múltiples colonias: Anillo Periférico (3), Lomas del Guijarro (2), San Ignacio (2)

### FEATURE — FASE 2-A: analizador.html refactorizado con cascada Zona → Colonia → Proyecto
- `selSubzona` eliminado y reemplazado por `selColonia` (guarda `colonia_id`, cascada desde `zone_id`)
- `selZona` ahora guarda `zone_id` en lugar de texto libre de colonia
- Fetch de `dim_subzona` eliminado — reemplazado por `dim_colonia` (activo=true) + `dim_proyecto` (con colonia_id)
- Clave de comparables: `zone_id||colonia_id||tipo` (antes: `colonia_texto||tipo`)
- Agrupación dual: `comparablesZona` (por zone_id+tipo) + `comparablesColonia` (por zone_id+colonia_id+tipo)
- Fallback 3 niveles: colonia ≥3 → análisis por colonia; <3 pero zona ≥3 → zona con aviso; zona <3 → orientativo
- `vrdEtiqueta` refleja el nivel usado: "Resultado del analisis" / "Analisis por zona (colonia sin suficientes referencias)" / "Analisis orientativo"
- PDF: header usa `zonaLabel` (zona·colonia cuando aplica), indicador NIVEL en bloque de conclusión
- `azProyectos` con `proyecto_id` + `colonia_id` — filtro por colonia_id cuando hay colonia seleccionada

### SCHEMA — FASE 1-G: deprecación suave de dim_zone y dim_subzona
- `core.dim_zone` recibe columna `activo BOOLEAN NOT NULL DEFAULT true`
- `Residencial Zarahemla II` marcada `activo = false` — zona vaciada por migración 1-C, no eliminar
- `dim_subzona`: LEGADO — no eliminar, no usar en nuevas inserciones; 14 proyectos tienen subzona_id histórico
- Regla para el analizador y dropdowns futuros: filtrar `WHERE dim_zone.activo = true`

### DATA — FASE 1-J: snapshot forzado 2026-05-29 (línea base post-normalización)
- Primer snapshot con datos de zonas/colonias/proyectos totalmente normalizados
- 12 combinaciones zona/tipo generadas — Anillo Periférico incluye las 6 props migradas de Zarahemla II
- Snapshot anterior: 2026-05-17 (pre-normalización); este es la nueva línea base confiable

### FEATURE — FASE 1-K: vistas actualizadas para leer dim_colonia
- `v_property_full`: reemplaza `p.colonia` (texto) → `dc.colonia` vía JOIN a dim_colonia por colonia_id
- `v_deals_clustered`: ídem — colonia ya no viene del campo texto libre
- Campo `property.colonia` (texto) se mantiene como respaldo; no expuesto en vistas
- `dim_subzona` intacta en ambas vistas — se tratará en FASE 1-G

### DECISION — FASE 1-G redefinida como deprecación suave
- No borrar dim_subzona, no eliminar columnas subzona_id
- dim_zone no tiene columna activo — agregar solo si se necesita para ocultar en dropdowns
- 14 proyectos aún tienen subzona_id asignado — no limpiar agresivamente
- Marcar Residencial Zarahemla II solo después de validar que ninguna vista productiva depende de ella

### SCHEMA — FASE 1-D: colonia_id agregado a dim_proyecto
- `core.dim_proyecto` recibe columna `colonia_id UUID NULL` FK → dim_colonia + índice
- Céfiro Azul: `zone_id` corregido de `Residencial Zarahemla II` → `Anillo Periférico` en dim_proyecto
- 13 proyectos actualizados por bulk (zonas con colonia única)
- 13 proyectos actualizados explícitamente: Anillo Periférico (2), San Ignacio (2), Lomas del Guijarro (9)
- Validación: 26/26 con colonia_id · 0 cross-zone errors

### DECISION — FASE 1-K agregada al plan
- Actualizar vistas/consultas para leer `dim_colonia.colonia` vía `colonia_id`
- Sin borrar el campo texto `property.colonia` — coexistencia temporal
- Ejecutar después de FASE 1-G y 1-J

### SCHEMA — FASE 1-C2: dim_colonia creada y poblada
- Nueva tabla `core.dim_colonia` (colonia_id UUID PK, zone_id FK, colonia TEXT, activo BOOLEAN, created_at)
- UNIQUE constraint en (zone_id, colonia) + índice en zone_id
- 51 colonias canónicas insertadas cubriendo 47 zonas
- `core.property` recibe columna `colonia_id UUID NULL` FK → dim_colonia + índice

### DATA — FASE 1-C2: migraciones 1-A / 1-B / 1-C ejecutadas
- **1-A** (2 props): `Zarahemla II` → `Residencial Zarahemla II` en zona Anillo Periférico
- **1-B Alcázar** (1 prop): colonia `Anillo Periférico` → `Residencial Alcázar` (Condominios Alcazar)
- **1-B Lomas Sur** (7 props): colonia `Lomas del Guijarro` → `Lomas del Guijarro Sur`
  - Por proyecto_id: Torre Nivo, Torre KIREI, Torre Tiffany, Torre la Trinidad
  - Por URL (La-Cumbre): 3 propiedades CS Bienes Raíces
- **1-C** (6 props): zone_id `Residencial Zarahemla II` → `Anillo Periférico`; colonia ya era correcta

### DATA — FASE 1-I: validaciones post-migración
- 134/134 propiedades con colonia_id vinculado (0 NULLs)
- Zona `Residencial Zarahemla II` → 0 propiedades (correctamente vaciada, pendiente deprecar en FASE 1-G)
- Anillo Periférico: Residencial Alcázar=1, Residencial Mirador de Los Ángeles=1, Residencial Zarahemla II=10
- Lomas del Guijarro: general=9, Sur=7 (total=16)

---

## 2026-05-27

### DECISION — FASE 1-H: property_code marcado como legado
- `property_code` no tiene metodología consistente ni propósito central claro
- La relación propiedad ↔ fuente ya está cubierta por `property_id` + `fuente` + `url`
- **No eliminar** (tiene datos y constraint activo), **no alimentar** en nuevas inserciones
- Documentado como campo legado operativo: no es identificador confiable ni deduplicador
- El problema real identificado es **detección de duplicados** → diseño en `docs/database/duplicate_detection_design.md`

### RULE — Detección de duplicados: 3 niveles definidos
- **Nivel 1** (exacto por fuente): `fuente + url` → no insertar si ya existe
- **Nivel 2** (probable cross-fuente): zona + proyecto + tipo + área ±3% + precio ±3% → marcar `DUPLICADO_POSIBLE`, revisar manualmente
- **Nivel 3** (semántico): análisis de texto/descripción → futuro, con 500+ listings
- Tabla pendiente: `core.duplicate_review` con `listing_id_a`, `listing_id_b`, `match_score`, `estado`
- Listings confirmados como duplicados → `excluido_benchmark = true`, nunca eliminar

### SCHEMA — dim_zone: 4 zonas eliminadas, 1 creada, 1 renombrada
- **ELIMINADAS** (eran colonias, no zonas): Colonia Palmira, Las Colinas, Las Hadas, Residencial Centroamérica
- **CREADA**: Boulevard Centroamerica → `8ed4d462-5c32-456b-ab2f-06fab6275e90`
- **RENOMBRADA**: Roble Oeste → Los Robles (mismo UUID `8d6639c9`)
- dim_zone: 50 zonas activas

### DATA — Todos los hallazgos de auditoría resueltos (FASE 1-B/1-F)
- **H1 Torre Aura:** zone=Boulevard Centroamerica, colonia=Las Colinas, proyecto=Torre Aura
- **H2 Céfiro Azul:** 2 props en Anillo Periférico → colonia=Zarahemla II, proyecto asignado
- **H3-A El Trapiche:** 10 props → colonia=Colonia El Trapiche, proyecto=Distrito Artemisa
- **H3-B Miraflores:** 11 props → colonia=Colonia Miraflores, proyecto=Torre Lirios de Miraflores
- **H3-C San Ignacio:** 17 props → Residencial San Ignacio (13 props) + Residencial Palmeras (3 props)
- **Cat A:** 12 correcciones ortográficas + Res. Los Angeles → Res. Mirador de Los Ángeles/Anillo Periférico
- **Cat B:** Res. Zarahemla → zone=Anillo Periférico; Montecarlo Morazán → proyecto=Torre Atlas

### RULE — tipo_proyecto normalizado
- Antes: TORRE, CONDOMINIO, VERTICAL (3 valores)
- Después: solo **TORRE** (edificio vertical único) y **CONDOMINIO** (complejo múltiples edificios)
- 10 proyectos VERTICAL → TORRE; Ecovivienda → CONDOMINIO
- Definición inamovible: TORRE ≠ CONDOMINIO por estructura física, no por tamaño

### RULE — Torres son proyectos, NUNCA colonias
- Si el scraper pone nombre de torre en campo colonia → corregir a nombre de colonia real
- Ejemplo: "Torre Aura Las Colinas" en colonia → error; colonia debe ser "Las Colinas"

### RULE — Zonas con múltiples colonias no se generalizan
- El Trapiche: zona amplia, colonia canónica = "Colonia El Trapiche" (no "El Trapiche" a secas)
- Miraflores: múltiples colonias (Miraflores Sur, etc.) — colonia canónica = "Colonia Miraflores"

### RULE — Zarahemla II es colonia dentro de Anillo Periférico
- Propiedades de Residencial Zarahemla II → zone_id = Anillo Periférico
- No existe como zona independiente en dim_zone

### SECURITY — RLS activado en 5 tablas
- `core.audit_log`, `core.data_quarantine`, `core.dim_zone_cluster`,
  `core.zone_cluster_assignment`, `core.exchange_rate`

### DECISION — FASE 4 Mercado Primario aprobada
- Nuevas tablas: `core.developer_project` + `core.developer_inventory_observation`
- Vista: `v_primary_market_context`
- Regla crítica: `core.listing` = solo mercado secundario, NUNCA mezclar con Fase 4
- Audiencia: comprador usado vs nuevo, inversionista, agente, propietario vs torres nuevas
- Tareas: 4-A (tablas) → 4-B (captura manual) → 4-C (vista) → 4-D (integrar analizador)

### FEATURE — Auditoría completa FASE 1-A completada (solo lectura)
- 134 propiedades auditadas: colonias, zonas y proyectos
- 58 valores únicos en `property.colonia` identificados
- 43 propiedades con `colonia ≠ zona` clasificadas en 3 categorías:
  - **Cat A (13 props):** diferencias ortográficas puras — fix seguro y directo
  - **Cat B (26 props):** colonias válidas dentro de la zona — requieren catálogo canónico
  - **Cat C (4 props):** nombre de proyecto o arteria en campo colonia — requieren decisión especial
- Resultado guardado en `docs/database/audit_01_colonias.md`

### DECISION — 4 hallazgos críticos pendientes de resolución (FASE 1-B)
- `Cefiro Azul` en zona Anillo Periférico (2 props sin proyecto): proyecto "Céfiro Azul" en dim_proyecto apunta a Zarahemla II — posible error de zona o proyecto distinto
- El Trapiche: `"El Trapiche"` vs `"Residencial El Trapiche"` — ¿misma colonia o dos?
- Miraflores: `"Miraflores"` vs `"Colonia Miraflores"` — ¿misma colonia o dos?
- San Ignacio: `"San Ignacio"`, `"Residencial San Ignacio"`, `"Residencial Palmeras De San Ignacio"` — ¿cuántas colonias?

### FEATURE — FASE 0 completa: repositorio GitHub organizado
- `.gitignore` actualizado, `/docs` creada, `CLAUDE.md` en raíz
- `CHANGELOG.md` iniciado para capturar decisiones desde el día 1
- Commits: `f3a4515`, `1ba154e` en github.com/angelojr182/Valorius

---

## 2026-05-26

### DECISION — Plan maestro de ingeniería acordado
- Se estructura el proyecto en 4 fases formales: Fase 0 (GitHub), Fase 1 (normalización datos), Fase 2 (analizador), Fase 3 (documentación)
- Principio rector: ningún cambio a la DB sin autorización explícita del usuario

### DECISION — Jerarquía geográfica confirmada
- Modelo acordado: **Zona → Colonia → Proyecto**
- `dim_subzona` queda DEPRECATED (no eliminar, no usar en nuevas inserciones)
- Pendiente crear `dim_colonia` como tabla formal en Fase 1-C

### DECISION — GitHub como control de versiones principal
- Repo: https://github.com/angelojr182/Valorius.git (rama main)
- Documentación vive en `/docs` junto al código (estándar de industria)
- CLAUDE.md en raíz = contexto automático para Claude Code en cada sesión

### SCHEMA — .gitignore actualizado
- Excluidos: `files/tmp_*`, `files/backup_*.sql`, `*.xlsx`, `~$*`, `.claude/`
- Archivos de configuración de scrapers excluidos (contienen URLs privadas)

### FEATURE — Estructura /docs creada
- `/docs/database` — migraciones, esquema, funciones SQL
- `/docs/architecture` — ERD, decisiones de diseño
- `/docs/ingesta` — flujo scraper, reglas de negocio
- `/docs/changelog` — este archivo

### RULE — property_code marcado para revisión (Fase 1-H)
- Hoy es `VARCHAR(20)` — causó problemas con códigos largos de Rentify
- Decisión pendiente: ampliar a `VARCHAR(120)` o agregar `source_listing_id` + `source_slug`
- Preferencia del usuario: `property_code` corto + `source_listing_id` + `source_slug`

### FEATURE — Edge Functions activas
- `update_exchange_rate`: actualiza tasa USD/HNL diariamente desde exchangerate-api.com
- `generar_snapshot`: ejecuta `recalcular_snapshots()` cada 15 días

### SCHEMA — core.exchange_rate creada
- Tabla inmutable para historial diario de tasa USD/HNL
- Primera entrada: 2026-05-26, L 26.5923 (Ficohsa venta, manual)

---

## 2026-05-26 (sesión anterior)

### DATA — Corrección crítica de moneda
- Listing de Lomas del Guijarro tenía precio en LPS en lugar de USD
- Corregido a $243,000 USD → $1,421/m²

### SCHEMA — Catálogo ampliado
- +3 zonas nuevas: Colonia Lara, Colonia Loma Linda Norte, Lomas del Molino
- +11 proyectos nuevos (ver sección 3 de CLAUDE.md)

### RULE — recalcular_snapshots() mejorada
- Tasa dinámica desde core.exchange_rate (no hardcodeada)
- Cadencia mínima de 15 días entre snapshots
- Parámetro `p_forzar BOOLEAN` para forzar snapshot fuera de cadencia

---

## 2026-05-25

### DATA — Excel v2.xlsx procesado
- Revision_Consolidada: 30 registros revisados (ids 1–30)
- 10 registros LISTO_INGESTA aprobados (pendientes de ingestar)
- id=13 rechazado (sin m²), ids 35 y 37 excluidos (data no limpia)

### RULE — Monoambiente = habitaciones 1
- Monoambiente → tipo APARTAMENTO, habitaciones = 1 (no NULL, no 0)

### RULE — Colonia fallback
- Si col R (subzona_normalizada) vacía → usar col Q (zona) como colonia
- colonia es NOT NULL en core.property

### DATA — Backup completo generado
- `files/backup_20260525.sql` — snapshot completo de la DB

---

## 2026-05-24

### DECISION — Fuentes de scraping evaluadas
- Rentify: preferida (tiene fecha de publicación y estado de venta)
- CS Bienes Raíces: funciona con `networkidle`, sin fecha de publicación
- Encuentra24: descartada (bloqueo 403 irresolubles)

### RULE — URL como identificador de unicidad
- Verificar duplicado por URL antes de insertar (no por property_code)
- property_code NO es requerido para unicidad

---

## 2026-05-21

### FEATURE — CS Bienes Raíces scraper V5 funcional
- Requiere `waitUntil: networkidle` (plataforma Tokko Broker)
- 58 propiedades extraídas → 19 seleccionadas para revisión

### DATA — Tipo de cambio actualizado
- L 26.5923 (Ficohsa venta) — referencia desde esta fecha
