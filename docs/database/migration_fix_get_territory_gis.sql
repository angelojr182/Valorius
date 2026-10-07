-- Fix: geo.get_territory_gis must resolve PostGIS ST_Intersects
-- through the core schema because the function intentionally restricts
-- search_path to pg_catalog, geo.
--
-- No tables, data, RLS policies, grants, or JSON contract are changed.

create or replace function geo.get_territory_gis(p_unit_id text)
returns jsonb
language sql
stable
set search_path to 'pg_catalog', 'geo'
as $function$
  select jsonb_build_object(
    'amenaza_inundacion', coalesce((
      select jsonb_agg(jsonb_build_object(
        'feature_id', gf.feature_id,
        'amenaza', gf.attributes->>'amenaza'
      ))
      from geo.geographic_feature gf
      join geo.geographic_layer gl on gf.layer_id = gl.layer_id
      join geo.territorial_unit tu on core.ST_Intersects(tu.geometry, gf.geometry)
      where tu.unit_id = p_unit_id
        and gl.layer_key = 'amenaza_inundacion'
    ), '[]'::jsonb),
    'amenaza_ladera', coalesce((
      select jsonb_agg(jsonb_build_object(
        'feature_id', gf.feature_id,
        'amenaza', gf.attributes->>'amenaza',
        'area_m2', (gf.attributes->>'area_m2')::float,
        'volumen_m3', (gf.attributes->>'volumen_m3')::float
      ))
      from geo.geographic_feature gf
      join geo.geographic_layer gl on gf.layer_id = gl.layer_id
      join geo.territorial_unit tu on core.ST_Intersects(tu.geometry, gf.geometry)
      where tu.unit_id = p_unit_id
        and gl.layer_key = 'amenaza_ladera'
    ), '[]'::jsonb),
    'areas_protegidas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'feature_id', gf.feature_id,
        'nombre', gf.attributes->>'nombre',
        'categoria', gf.attributes->>'categoria',
        'inst_legal', gf.attributes->>'inst_legal',
        'zona', gf.attributes->>'zona',
        'area_ha', (gf.attributes->>'area_ha')::float
      ))
      from geo.geographic_feature gf
      join geo.geographic_layer gl on gf.layer_id = gl.layer_id
      join geo.territorial_unit tu on core.ST_Intersects(tu.geometry, gf.geometry)
      where tu.unit_id = p_unit_id
        and gl.layer_key = 'areas_protegidas'
    ), '[]'::jsonb),
    'pu_zonas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'feature_id', gf.feature_id,
        'zona', gf.attributes->>'zona',
        'sub_zona', gf.attributes->>'sub_zona',
        'pertenece', gf.attributes->>'pertenece'
      ))
      from geo.geographic_feature gf
      join geo.geographic_layer gl on gf.layer_id = gl.layer_id
      join geo.territorial_unit tu on core.ST_Intersects(tu.geometry, gf.geometry)
      where tu.unit_id = p_unit_id
        and gl.layer_key = 'pu_zonas'
    ), '[]'::jsonb)
  );
$function$;
