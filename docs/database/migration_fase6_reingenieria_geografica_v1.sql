-- migration_fase6_reingenieria_geografica_v1.sql — Valorius
-- Fecha: 2026-06-07 · Ref: FASE 6 audit_02
--
-- Corrección estructural: separa "Residencial X" de la jerarquía zona/colonia.
-- Antes: Residencial Las Casitas / El Sauce / Villa Elena eran ZONAS.
-- Ahora:  Las Casitas / El Sauce / Villa Elena son ZONAS.
--         Residencial Las Casitas / El Sauce / Villa Elena son COLONIAS dentro de esas zonas.
--
-- Impacto: 10 properties reasignadas (5 El Sauce, 1 Las Casitas, 4 Villa Elena).
--          3 zonas antiguas marcadas como inactivas (no eliminadas, preserva historial).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CREAR 3 ZONAS NUEVAS (sin "Residencial")
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO core.dim_zone (zone_id, zona, activo, lat, lng, geo_precision, geo_source, geo_confidence)
VALUES
  (gen_random_uuid(), 'Las Casitas', true, NULL, NULL, 'ZONA_CENTROIDE', 'MANUAL', 3),
  (gen_random_uuid(), 'El Sauce', true, NULL, NULL, 'ZONA_CENTROIDE', 'MANUAL', 3),
  (gen_random_uuid(), 'Villa Elena', true, NULL, NULL, 'ZONA_CENTROIDE', 'MANUAL', 3)
RETURNING zone_id, zona INTO TEMP TABLE new_zones(zone_id uuid, zona text);

-- Captura los UUIDs para usar en los siguientes pasos
-- (En producción, estos se leerían de un script con transacción controlada)

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CREAR 3 COLONIAS NUEVAS (Residencial X dentro de las zonas nuevas)
-- ─────────────────────────────────────────────────────────────────────────────

-- Necesitamos los zone_id que acabamos de crear. Para eso, los obtenemos aquí:
WITH new_zone_data AS (
  SELECT zone_id FROM core.dim_zone WHERE zona = 'Las Casitas' AND activo = true
),
colonia_insert AS (
  INSERT INTO core.dim_colonia (colonia_id, zone_id, colonia, activo)
  SELECT
    gen_random_uuid(),
    (SELECT zone_id FROM new_zone_data LIMIT 1),
    'Residencial Las Casitas',
    true
  RETURNING colonia_id, zone_id
)
SELECT * FROM colonia_insert;

WITH new_zone_data AS (
  SELECT zone_id FROM core.dim_zone WHERE zona = 'El Sauce' AND activo = true
),
colonia_insert AS (
  INSERT INTO core.dim_colonia (colonia_id, zone_id, colonia, activo)
  SELECT
    gen_random_uuid(),
    (SELECT zone_id FROM new_zone_data LIMIT 1),
    'Residencial El Sauce',
    true
  RETURNING colonia_id, zone_id
)
SELECT * FROM colonia_insert;

WITH new_zone_data AS (
  SELECT zone_id FROM core.dim_zone WHERE zona = 'Villa Elena' AND activo = true
),
colonia_insert AS (
  INSERT INTO core.dim_colonia (colonia_id, zone_id, colonia, activo)
  SELECT
    gen_random_uuid(),
    (SELECT zone_id FROM new_zone_data LIMIT 1),
    'Residencial Villa Elena',
    true
  RETURNING colonia_id, zone_id
)
SELECT * FROM colonia_insert;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. MIGRAR PROPERTIES: reasignar zone_id + asignar colonia_id
-- ─────────────────────────────────────────────────────────────────────────────

-- Las Casitas: 1 property
UPDATE core.property
SET
  zone_id = (SELECT zone_id FROM core.dim_zone WHERE zona = 'Las Casitas' LIMIT 1),
  colonia_id = (SELECT colonia_id FROM core.dim_colonia WHERE colonia = 'Residencial Las Casitas' LIMIT 1)
WHERE zone_id = (SELECT zone_id FROM core.dim_zone WHERE zona = 'Residencial Las Casitas' LIMIT 1);

-- El Sauce: 5 properties
UPDATE core.property
SET
  zone_id = (SELECT zone_id FROM core.dim_zone WHERE zona = 'El Sauce' LIMIT 1),
  colonia_id = (SELECT colonia_id FROM core.dim_colonia WHERE colonia = 'Residencial El Sauce' LIMIT 1)
WHERE zone_id = (SELECT zone_id FROM core.dim_zone WHERE zona = 'Residencial El Sauce' LIMIT 1);

-- Villa Elena: 4 properties
UPDATE core.property
SET
  zone_id = (SELECT zone_id FROM core.dim_zone WHERE zona = 'Villa Elena' LIMIT 1),
  colonia_id = (SELECT colonia_id FROM core.dim_colonia WHERE colonia = 'Residencial Villa Elena' LIMIT 1)
WHERE zone_id = (SELECT zone_id FROM core.dim_zone WHERE zona = 'Residencial Villa Elena' LIMIT 1);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. DESACTIVAR ZONAS ANTIGUAS (preservar historial, marcar como inactivas)
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE core.dim_zone
SET activo = false
WHERE zona IN ('Residencial Las Casitas', 'Residencial El Sauce', 'Residencial Villa Elena');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. VALIDACIÓN (verificar que la migración fue correcta)
-- ─────────────────────────────────────────────────────────────────────────────

-- Contar properties en las nuevas zonas
SELECT
  z.zona,
  COUNT(p.property_id) as total_properties,
  COUNT(DISTINCT p.colonia_id) as colonias_asignadas
FROM core.dim_zone z
LEFT JOIN core.property p ON p.zone_id = z.zone_id
WHERE z.zona IN ('Las Casitas', 'El Sauce', 'Villa Elena')
GROUP BY z.zona
ORDER BY z.zona;

-- Verificar que las zonas antiguas están inactivas
SELECT zona, activo FROM core.dim_zone
WHERE zona IN ('Residencial Las Casitas', 'Residencial El Sauce', 'Residencial Villa Elena')
ORDER BY zona;

-- Verificar que colonias nuevas existen
SELECT zona, colonia, activo FROM core.dim_zone z
JOIN core.dim_colonia c ON c.zone_id = z.zone_id
WHERE z.zona IN ('Las Casitas', 'El Sauce', 'Villa Elena')
ORDER BY z.zona, c.colonia;
