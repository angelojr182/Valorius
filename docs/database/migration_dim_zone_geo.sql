-- ═══════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Agregar coordenadas geográficas a core.dim_zone
-- Versión    : 1.2
-- Fecha      : 2026-05-29
-- Estado     : EJECUTADO — validación OK (zonas_con_coords=49, sin_coords=0, activas_con_coords=48)
-- Autor      : Valorius / Claude Code
-- ─────────────────────────────────────────────────────────────────────
-- INSTRUCCIONES:
--   1. Ejecutar dentro de una transacción (BEGIN/COMMIT incluidos)
--   2. Correr el SELECT de validación ANTES de confirmar (COMMIT)
--   3. El rollback completo está al final de este archivo
--   4. Los constraints usan bloques DO $$ para ser idempotentes
--      (re-ejecución segura si los constraints ya existen)
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- PASO 1: Agregar columnas a core.dim_zone
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE core.dim_zone
  ADD COLUMN IF NOT EXISTS lat            NUMERIC(10,7) NULL,
  ADD COLUMN IF NOT EXISTS lng            NUMERIC(10,7) NULL,
  ADD COLUMN IF NOT EXISTS geo_precision  TEXT          DEFAULT 'ZONA_CENTROIDE',
  ADD COLUMN IF NOT EXISTS geo_source     TEXT          DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS geo_confidence SMALLINT      DEFAULT 3;

-- ─────────────────────────────────────────────────────────────────────
-- PASO 2: Constraints de calidad de datos (idempotentes — seguros si ya existen)
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE core.dim_zone
    ADD CONSTRAINT dim_zone_lat_range
    CHECK (lat IS NULL OR lat BETWEEN -90 AND 90);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE core.dim_zone
    ADD CONSTRAINT dim_zone_lng_range
    CHECK (lng IS NULL OR lng BETWEEN -180 AND 180);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE core.dim_zone
    ADD CONSTRAINT dim_zone_geo_confidence_range
    CHECK (geo_confidence IS NULL OR geo_confidence BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- PASO 3: Poblar coordenadas — 49 zonas por zone_id
-- Fuente: GEO_DICT hardcoded en analizador.html (centroides aproximados)
-- Precision: ZONA_CENTROIDE (~300m–1.5km de exactitud)
-- geo_confidence: 3 = "centroide de zona estimado, no verificado GPS"
--
-- VERIFICACIÓN v1.2 — 2026-05-29 — fuentes: WorldPlaces + OSM Nominatim + geocode.xyz
-- Decisión: usar valores de búsqueda propia (promedio de 2+ fuentes independientes)
-- para zonas con discrepancia; mantener original donde la diferencia es <0.5km.
--
--   Bulevar Morazán      → AJUSTADO   14.1004,-87.1835  (OSM: -87.1815 · WorldPlaces: -87.1855, promedio)
--   El Trapiche          → AJUSTADO   14.0828,-87.1695  (OSM Parque El Trapiche + WorldPlaces, promedio)
--   Lomas del Guijarro   → AJUSTADO   14.0930,-87.1800  (entre WorldPlaces general y Sur)
--   Miraflores           → AJUSTADO   14.0783,-87.2114  (OSM Barrio Miraflores + TopoNavi, promedio)
--   Anillo Periférico    → AJUSTADO   14.1000,-87.1700  (centroide comercial: Zarahemla/Alcázar/Céfiro Azul)
--   Residencial El Sauce → ORIGINAL   14.0720,-87.1660  (fuente externa sospechosa — pendiente verificación manual)
--   San Ignacio          → ORIGINAL   14.0910,-87.1820  (sin fuente confiable encontrada — pendiente verificación manual)
-- ─────────────────────────────────────────────────────────────────────

UPDATE core.dim_zone SET lat = 14.0560, lng = -87.2250 WHERE zone_id = '20083c6e-8ddb-4e7d-a7d4-86ecc4793fc6'; -- Aldea de Guasculile
UPDATE core.dim_zone SET lat = 14.1150, lng = -87.2050 WHERE zone_id = 'f1e5dd52-cb62-449c-a329-cb062a43884c'; -- Altos de la Granja
UPDATE core.dim_zone SET lat = 14.1000, lng = -87.1700 WHERE zone_id = 'c577b26f-3041-483b-be3c-6d849d35eca7'; -- Anillo Periférico (centroide comercial: Zarahemla/Alcázar/Céfiro Azul — Mapcarta Zarahemla II: 14.1033,-87.1632)
UPDATE core.dim_zone SET lat = 14.0820, lng = -87.2040 WHERE zone_id = 'bbe4f9c4-e2e7-450e-a957-97fa9c8bb04f'; -- Barrio Bella Vista
UPDATE core.dim_zone SET lat = 14.0855, lng = -87.2110 WHERE zone_id = '22a4b83f-ea0d-472d-b4be-53b7fe702fe9'; -- Barrio Buenos Aires
UPDATE core.dim_zone SET lat = 14.0810, lng = -87.2095 WHERE zone_id = 'f34d9881-844d-487b-84dc-3cbb5a351421'; -- Barrio Guanacaste
UPDATE core.dim_zone SET lat = 14.0800, lng = -87.2060 WHERE zone_id = 'ca7bb1fa-6a38-4647-811d-068ddbdf210f'; -- Barrio La Leona
UPDATE core.dim_zone SET lat = 14.0825, lng = -87.1490 WHERE zone_id = '8ed4d462-5c32-456b-ab2f-06fab6275e90'; -- Boulevard Centroamerica
UPDATE core.dim_zone SET lat = 14.0785, lng = -87.2280 WHERE zone_id = '672062c4-102d-45de-935e-515e39abfa14'; -- Boulevard Fuerzas Armadas
UPDATE core.dim_zone SET lat = 14.1004, lng = -87.1835 WHERE zone_id = '7fd29b38-d38f-4e8d-8007-976ef5d1bc71'; -- Bulevar Morazán (OSM:-87.1815 · WorldPlaces:-87.1855 → promedio -87.1835)
UPDATE core.dim_zone SET lat = 14.0830, lng = -87.2070 WHERE zone_id = '208c243f-078e-489e-947c-01d52c5d40c5'; -- Colonia América
UPDATE core.dim_zone SET lat = 14.0920, lng = -87.2190 WHERE zone_id = '1c67efcb-0693-4fd4-abd0-54db40ed67c4'; -- Colonia Guadalupe López Villanueva
UPDATE core.dim_zone SET lat = 14.0790, lng = -87.2165 WHERE zone_id = 'ce304592-1abf-48e3-b0fb-872ae474c86f'; -- Colonia Guaymuras
UPDATE core.dim_zone SET lat = 14.0875, lng = -87.2240 WHERE zone_id = 'cfd26db6-ac7a-4d0b-88d4-5bb30d6512f4'; -- Colonia La Era
UPDATE core.dim_zone SET lat = 14.1005, lng = -87.2105 WHERE zone_id = 'd86a3239-a45a-4cad-96ca-9126b8624815'; -- Colonia La Pradera
UPDATE core.dim_zone SET lat = 14.0840, lng = -87.2200 WHERE zone_id = 'c284d277-39d2-4915-bd0c-73f7104332e2'; -- Colonia La Sosa
UPDATE core.dim_zone SET lat = 14.0840, lng = -87.2160 WHERE zone_id = '7f0e2113-d19b-4290-8e27-16b80a9776e5'; -- Colonia Lara
UPDATE core.dim_zone SET lat = 14.0890, lng = -87.2190 WHERE zone_id = '0fd3ac13-3a9d-492c-8b3e-556b3e902145'; -- Colonia Loma Linda Norte
UPDATE core.dim_zone SET lat = 14.0945, lng = -87.2265 WHERE zone_id = 'f6278593-c5a1-4618-a8c7-cc68038dfeb2'; -- Colonia Lomas de Tiloarque
UPDATE core.dim_zone SET lat = 14.0810, lng = -87.2155 WHERE zone_id = 'ff7b572e-b220-418c-9031-ae0aa01c4daf'; -- Colonia Los Ángeles
UPDATE core.dim_zone SET lat = 14.0855, lng = -87.2025 WHERE zone_id = '860b90f9-c281-455f-a181-e1c654ca4110'; -- Colonia Modelo
UPDATE core.dim_zone SET lat = 14.0930, lng = -87.2310 WHERE zone_id = '0b3bd9e0-37a8-4834-a1d1-75951f5a02ac'; -- Colonia San José del Loarque
UPDATE core.dim_zone SET lat = 14.0945, lng = -87.2145 WHERE zone_id = 'c554b5d4-124c-4e78-ada1-cfec9ea446eb'; -- Colonia Satélite
UPDATE core.dim_zone SET lat = 14.0790, lng = -87.2130 WHERE zone_id = '6cea85c7-84c7-4ffc-ae45-f401d80ef6ab'; -- Colonia Tepeyac
UPDATE core.dim_zone SET lat = 14.1220, lng = -87.2290 WHERE zone_id = '432dd604-58fc-414c-9d67-fd18ed4ba835'; -- El Hatillo
UPDATE core.dim_zone SET lat = 14.0828, lng = -87.1695 WHERE zone_id = '6ffdc66c-a15b-498c-a60d-cadc4346f89a'; -- El Trapiche (OSM Parque El Trapiche:14.0824,-87.1705 · WorldPlaces:14.0830,-87.1682 → promedio)
UPDATE core.dim_zone SET lat = 14.1100, lng = -87.1070 WHERE zone_id = '9e004954-e5e1-475f-9f16-088bceaee359'; -- La Esperanza
UPDATE core.dim_zone SET lat = 14.1060, lng = -87.1820 WHERE zone_id = '3df25638-0d68-4726-b411-928fb7335ad5'; -- Las Uvas
UPDATE core.dim_zone SET lat = 14.0930, lng = -87.1800 WHERE zone_id = '18e45e8c-1143-487e-aad3-5efd1af5b763'; -- Lomas del Guijarro (centroide zona amplia: entre WorldPlaces general:14.0921,-87.1842 y Sur:14.0939,-87.1768)
UPDATE core.dim_zone SET lat = 14.1010, lng = -87.1720 WHERE zone_id = '7a41ace6-454f-4e68-a456-69a13bd61186'; -- Lomas del Molino
UPDATE core.dim_zone SET lat = 14.0870, lng = -87.1700 WHERE zone_id = '8d6639c9-6de7-4766-94c8-954160d6f796'; -- Los Robles
UPDATE core.dim_zone SET lat = 14.0783, lng = -87.2114 WHERE zone_id = 'b61262d0-7710-4da4-b01b-65efedf376a2'; -- Miraflores (OSM Barrio Miraflores: 14.0783,-87.2114 — elegido sobre TopoNavi:14.0745,-87.1929 por ser fuente más específica; original 14.0875,-87.2220 era ~4km al noroeste)
UPDATE core.dim_zone SET lat = 14.0990, lng = -87.1990 WHERE zone_id = '976e27bf-0f0b-4c4f-a1af-455237d494a1'; -- Residencial Buena Vista
UPDATE core.dim_zone SET lat = 14.0950, lng = -87.2070 WHERE zone_id = '768480af-b7f2-420b-9557-d69e8b0832bf'; -- Residencial Ciudad Nueva
UPDATE core.dim_zone SET lat = 14.0770, lng = -87.1720 WHERE zone_id = 'c1a85e8f-5350-454a-b4cd-1a1308ac83e1'; -- Residencial Concepción II
UPDATE core.dim_zone SET lat = 14.0720, lng = -87.1660 WHERE zone_id = '8e11848a-54a9-484e-98aa-ebf35ce7b77e'; -- Residencial El Sauce (original mantenido — fuente externa sospechosa, pendiente verificación manual)
UPDATE core.dim_zone SET lat = 14.0840, lng = -87.1780 WHERE zone_id = '9ea495bb-9e3c-422b-be2a-f31be3d53526'; -- Residencial Hacienda Real
UPDATE core.dim_zone SET lat = 14.0875, lng = -87.2350 WHERE zone_id = '063cd486-1a14-481b-baf2-78c18b4a5068'; -- Residencial Las Casitas
UPDATE core.dim_zone SET lat = 14.1025, lng = -87.1960 WHERE zone_id = 'a658defc-22ec-4440-a569-60a4ca7f7c3f'; -- Residencial Los Cerezos
UPDATE core.dim_zone SET lat = 14.0675, lng = -87.1810 WHERE zone_id = 'b9b567f1-6413-4a6e-9f0e-c6f6280f0450'; -- Residencial Mirador de los Hidalgos
UPDATE core.dim_zone SET lat = 14.1020, lng = -87.2010 WHERE zone_id = '45db5a2a-2f5d-47a2-9232-d3b8abf25930'; -- Residencial Paseo de las Campanas
UPDATE core.dim_zone SET lat = 14.0730, lng = -87.1690 WHERE zone_id = 'b77619bc-b0d5-4ed2-a3e9-c65eaa9f5b66'; -- Residencial Portal del Bosque 1
UPDATE core.dim_zone SET lat = 14.0995, lng = -87.2150 WHERE zone_id = '5b02fd93-bff4-428f-9a93-70cc759a1929'; -- Residencial Quinta Isabel
UPDATE core.dim_zone SET lat = 14.1050, lng = -87.1920 WHERE zone_id = '83743355-33cd-42ea-bc68-f1d869538c21'; -- Residencial San Juan
UPDATE core.dim_zone SET lat = 14.0800, lng = -87.1760 WHERE zone_id = 'ab73c240-311e-4b1f-a081-15cccb0c6f7b'; -- Residencial Villa Elena
UPDATE core.dim_zone SET lat = 14.0960, lng = -87.1845 WHERE zone_id = '4924abf6-7379-432d-99df-99702eb56e9e'; -- Residencial Zarahemla II (activo=false — coordenada asignada para consistencia)
UPDATE core.dim_zone SET lat = 14.0910, lng = -87.1820 WHERE zone_id = '3924ec4a-bd5e-4871-8dc3-3d1e3d78d887'; -- San Ignacio (original mantenido — sin fuente confiable encontrada, pendiente verificación manual)
UPDATE core.dim_zone SET lat = 14.1180, lng = -87.1350 WHERE zone_id = 'fdd06173-ad0c-42e6-acf6-b85e9e2e6dc9'; -- Torocagua
UPDATE core.dim_zone SET lat = 14.1300, lng = -87.1120 WHERE zone_id = '66062aa9-b8a7-4a08-ac4a-7e9ec9aba1fc'; -- Zambrano

-- ─────────────────────────────────────────────────────────────────────
-- PASO 4: SELECT DE VALIDACIÓN — correr ANTES de COMMIT
-- Verificar:
--   • 49 zonas deben tener lat/lng no nulo
--   • 0 zonas deben violar los constraints (lat out of range)
--   • Todas las zonas activas con mercado activo deben tener coordenadas
-- ─────────────────────────────────────────────────────────────────────

-- 4-A: Conteo general
SELECT
  COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) AS zonas_con_coords,
  COUNT(*) FILTER (WHERE lat IS NULL OR lng IS NULL)          AS zonas_sin_coords,
  COUNT(*) FILTER (WHERE activo = true)                       AS zonas_activas,
  COUNT(*) FILTER (WHERE activo = true AND lat IS NOT NULL AND lng IS NOT NULL) AS activas_con_coords
FROM core.dim_zone;

-- 4-B: Zonas activas con más listings que NO tienen coordenadas (debería ser 0)
SELECT z.zona, z.activo, z.lat, z.lng,
       COUNT(p.property_id) AS properties
FROM core.dim_zone z
LEFT JOIN core.property p ON p.zone_id = z.zone_id
WHERE z.lat IS NULL OR z.lng IS NULL
GROUP BY z.zone_id, z.zona, z.activo, z.lat, z.lng
ORDER BY properties DESC;

-- 4-C: Spot check de zonas críticas (verificar visualmente contra Google Maps)
SELECT zona, lat, lng, geo_precision, geo_confidence
FROM core.dim_zone
WHERE zona IN (
  'Lomas del Guijarro',
  'Bulevar Morazán',
  'San Ignacio',
  'El Trapiche',
  'Residencial El Sauce',
  'Miraflores',
  'Anillo Periférico'
)
ORDER BY zona;

-- ─────────────────────────────────────────────────────────────────────
-- SI LA VALIDACIÓN ES CORRECTA → COMMIT
-- ─────────────────────────────────────────────────────────────────────
-- COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- ROLLBACK COMPLETO (ejecutar en caso de error o rechazo)
-- ═══════════════════════════════════════════════════════════════════════
-- ROLLBACK;
--
-- Si ya se hizo COMMIT y hay que revertir:
-- ALTER TABLE core.dim_zone
--   DROP COLUMN IF EXISTS lat,
--   DROP COLUMN IF EXISTS lng,
--   DROP COLUMN IF EXISTS geo_precision,
--   DROP COLUMN IF EXISTS geo_source,
--   DROP COLUMN IF EXISTS geo_confidence;
--
-- (Los constraints se eliminan automáticamente al dropear las columnas)
