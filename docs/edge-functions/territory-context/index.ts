import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ ok: false, error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const unitId = url.searchParams.get("unit_id");
  if (!unitId) return json({ ok: false, error: "unit_id es requerido" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ ok: false, error: "Configuración interna incompleta" }, 500);

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json",
    "Accept-Profile": "geo"
  };

  try {
    const unitUrl = `${supabaseUrl}/rest/v1/territorial_unit?unit_id=eq.${encodeURIComponent(unitId)}&select=unit_id,type_id,source_id,name_official,municipality_code,status&limit=1`;
    const unitResponse = await fetch(unitUrl, { headers });
    if (!unitResponse.ok) return json({ ok: false, error: "No fue posible consultar la unidad territorial" }, 502);
    const units = await unitResponse.json();
    if (!Array.isArray(units) || !units.length) return json({ ok: true, data: [] });

    const unit = units[0];
    const [typeResponse, sourceResponse, gisResponse] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/territorial_unit_type?type_id=eq.${encodeURIComponent(unit.type_id)}&select=type_key,name,level&limit=1`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/data_source?source_id=eq.${encodeURIComponent(unit.source_id)}&select=source_key,name,institution,version&limit=1`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/rpc/get_territory_gis?p_unit_id=${encodeURIComponent(unitId)}`, { headers }).catch(() => null)
    ]);

    const types = typeResponse.ok ? await typeResponse.json() : [];
    const sources = sourceResponse.ok ? await sourceResponse.json() : [];
    const territoryGis = gisResponse?.ok ? await gisResponse.json().catch(() => null) : null;

    return json({
      ok: true,
      data: [{
        unit_id: unit.unit_id,
        name_official: unit.name_official,
        type: types[0] ? (types[0].name || types[0].type_key || "") : "",
        municipality_code: unit.municipality_code,
        status: unit.status,
        source: sources[0] ? (sources[0].source_key || sources[0].name || "") : "",
        territory_gis: territoryGis
      }]
    });
  } catch (_error) {
    return json({ ok: false, error: "Error interno al resolver territorio" }, 500);
  }
});
