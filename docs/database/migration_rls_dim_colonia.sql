-- migration_rls_dim_colonia.sql — Valorius
-- Fecha: 2026-06-06 · Ref: ADR-0003 · Aplicada vía Supabase migration "enable_rls_dim_colonia"
--
-- Cierra un hueco de seguridad: core.dim_colonia era la UNICA tabla de core con RLS
-- desactivado. Con la anon key (publica en el front del analizador) se podia leer y
-- MODIFICAR toda la tabla.
--
-- Patron identico al de dim_zone / dim_proyecto: RLS activado + lectura publica,
-- escritura permitida solo a service_role (que ignora RLS). El analizador, que LEE
-- colonias con la anon key, sigue funcionando; la ingesta de colonias sigue via admin
-- / service_role.
--
-- Verificado tras aplicar: rls_activo=true, policy presente, REST read con anon key -> 200.

ALTER TABLE core.dim_colonia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura colonias"
  ON core.dim_colonia
  FOR SELECT
  TO public
  USING (true);
