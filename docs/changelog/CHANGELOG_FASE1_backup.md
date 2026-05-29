# CHANGELOG — Valorius Dashboard V2

> Formato: `[FECHA] — TIPO — Descripción`
> Tipos: DECISION | SCHEMA | DATA | FEATURE | FIX | DEPRECATION | RULE

---

## 2026-05-27

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
