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
Última sesión  : 2026-05-27
Último paso    : FASE 1-A completada — auditoría en docs/database/audit_01_colonias.md
Próximo paso   : FASE 1-B — proponer catálogo canónico de colonias (solo propuesta, sin tocar DB)
Pendiente auth : CERO cambios a DB sin autorización explícita
Tipo cambio    : L 26.5923 (Ficohsa venta, 2026-05-26) — verificar si Edge Function actualizó
DB count       : 134 properties / 134 listings
Edge Functions : update_exchange_rate + generar_snapshot — CREADAS y funcionando
Plan maestro   : FASE 0 ✅ completa · FASE 1-A ✅ completa · FASE 1-B pendiente
Hallazgos FASE 1-A:
  - 43 props con colonia≠zona: Cat A 13 (ortografía), Cat B 26 (colonias válidas), Cat C 4 (errores)
  - Decisiones pendientes usuario: Cefiro Azul/Anillo Periférico, El Trapiche, Miraflores, San Ignacio
```

---

## 📋 LOG DE SESIONES
```
2026-05-27 | FASE 1-A completada — auditoría completa de colonias, zonas y proyectos (solo lectura)
           | 43 propiedades con colonia≠zona identificadas y clasificadas en 3 categorías
           | Documento guardado: docs/database/audit_01_colonias.md (commit 24dd9d9)
           | 4 hallazgos críticos identificados — requieren decisión del usuario en FASE 1-B

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
-- Estado actual: 134 / 134
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
zone_id  UUID PK
zona     TEXT UNIQUE NOT NULL
-- 52 zonas activas. Ver sección 3.
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
-- Snapshots actuales: 34 registros (fechas: 2026-04-07 a 2026-05-17)
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

### dim_zone (52 zonas)
```
Aldea de Guasculile                  → 20083c6e-8ddb-4e7d-a7d4-86ecc4793fc6
Altos de la Granja                   → f1e5dd52-cb62-449c-a329-cb062a43884c
Anillo Periférico                    → c577b26f-3041-483b-be3c-6d849d35eca7
Barrio Bella Vista                   → bbe4f9c4-e2e7-450e-a957-97fa9c8bb04f
Barrio Buenos Aires                  → 22a4b83f-ea0d-472d-b4be-53b7fe702fe9
Barrio Guanacaste                    → f34d9881-844d-487b-84dc-3cbb5a351421
Barrio La Leona                      → ca7bb1fa-6a38-4647-811d-068ddbdf210f
Boulevard Fuerzas Armadas            → 672062c4-102d-45de-935e-515e39abfa14
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
Colonia Palmira                      → 3847381f-a39a-4371-bbc5-c8ba054a2b50
Colonia San José del Loarque         → 0b3bd9e0-37a8-4834-a1d1-75951f5a02ac
Colonia Satélite                     → c554b5d4-124c-4e78-ada1-cfec9ea446eb
Colonia Tepeyac                      → 6cea85c7-84c7-4ffc-ae45-f401d80ef6ab
El Hatillo                           → 432dd604-58fc-414c-9d67-fd18ed4ba835
El Trapiche                          → 6ffdc66c-a15b-498c-a60d-cadc4346f89a
La Esperanza                         → 9e004954-e5e1-475f-9f16-088bceaee359
Las Colinas                          → 82a39405-20fd-494e-8d11-3b7fdfc82350
Las Hadas                            → 95ebf11d-30da-4ebd-8117-73366864ddee
Las Uvas                             → 3df25638-0d68-4726-b411-928fb7335ad5
Lomas del Guijarro                   → 18e45e8c-1143-487e-aad3-5efd1af5b763
Lomas del Molino                     → 7a41ace6-454f-4e68-a456-69a13bd61186
Miraflores                           → b61262d0-7710-4da4-b01b-65efedf376a2
Residencial Buena Vista              → 976e27bf-0f0b-4c4f-a1af-455237d494a1
Residencial Centroamérica            → d98733cb-130a-4a1d-849a-57fa8562713f
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
Roble Oeste                          → 8d6639c9-6de7-4766-94c8-954160d6f796
San Ignacio                          → 3924ec4a-bd5e-4871-8dc3-3d1e3d78d887
Torocagua                            → fdd06173-ad0c-42e6-acf6-b85e9e2e6dc9
Zambrano                             → 66062aa9-b8a7-4a08-ac4a-7e9ec9aba1fc
```

### dim_proyecto (26 proyectos)
```
Condominios Alcazar          (Anillo Periférico)        → a6db2b5b-474d-4177-b88b-84a3dd4fce95
Torre Atlas                  (Bulevar Morazán)          → 87bab2a8-e771-47c6-ab51-9eb75cd02c6b
Torre Centro Morazán         (Bulevar Morazán)          → 99882a59-6b6a-4ece-a5ac-43a6f9a8f7b7
Torre Costa Próceres         (Colonia Lara)             → fbf840fd-656e-4d2f-a2bf-068987cc0841
Torre Urbana Lara            (Colonia Lara)             → 3efa9abf-245a-42fc-b971-8a840da7e648
Avalon                       (Colonia Loma Linda Norte) → d7db94b5-a90b-48df-88dd-f56da32348c8
Ecovivienda                  (Colonia La Era)           → 6ec02bcc-68fa-4d07-9467-4db0fd09f20c
Distrito Artemisa            (El Trapiche)              → 75ca4e4e-d5d8-4fe0-a0dd-cbe5659018ee
Torre Aura                   (Las Colinas)              → acc4398f-9b78-45fa-98c3-8127356715f1
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
- `colonia` en property = nombre de la colonia dentro de la zona (hoy texto libre, pendiente FK)
- `proyecto_id` solo si existe en catálogo — NUNCA inventar
- `subzona_id` → solo registros legados, no poblar en nuevas inserciones
- Bulevares (Bulevar Morazán, Boulevard Fuerzas Armadas) están en dim_zone pero son arterias viales — pendiente revisar si deben ser zonas
- Distrito Artemisa = zona El Trapiche (confirmado Google Maps)

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

## 12. INSTRUCCIONES PARA ACTUALIZAR ESTE ARCHIVO

Al cerrar cada sesión, Claude Code debe actualizar automáticamente:
1. **SESIÓN ACTIVA** — último paso, próximo paso, tipo de cambio
2. **LOG DE SESIONES** — agregar entrada con fecha y resumen
3. Cualquier UUID nuevo, decisión nueva o regla nueva que haya surgido
