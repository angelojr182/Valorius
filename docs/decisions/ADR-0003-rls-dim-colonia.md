# ADR-0003 — RLS en core.dim_colonia (lectura pública, escritura service_role)

- **Estado:** Aceptado
- **Fecha:** 2026-06-06
- **Decisores:** Miguel (Valorius)
- **Reemplaza a:** —

## Contexto
Al capturar el diccionario de datos as-built se detectó que `core.dim_colonia` era la
**única tabla de `core` con Row Level Security desactivado**. Con la anon key —que es
pública en el front del analizador— cualquiera podía **leer y modificar** las 60
colonias. Las demás 13 tablas de `core` ya tenían RLS.

## Decisión
Activar RLS en `core.dim_colonia` y crear una policy de **lectura pública**, replicando
el patrón ya usado en `dim_zone` y `dim_proyecto`:

```sql
ALTER TABLE core.dim_colonia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura colonias" ON core.dim_colonia FOR SELECT TO public USING (true);
```

Resultado: lectura abierta (el analizador sigue funcionando), **escritura solo vía
`service_role`** (que ignora RLS) — es decir, ingesta solo por admin/MCP.

## Alternativas consideradas
- **Dejar la tabla sin RLS** — rechazado: hueco de seguridad real (escritura anónima).
- **Activar RLS sin policy de SELECT** — rechazado: rompería el analizador, que lee
  colonias con la anon key (la remediación automática de Supabase haría justo esto).

## Consecuencias
- (+) Cierra el hueco de escritura anónima; deja `dim_colonia` consistente con las demás dimensiones.
- (+) El analizador sigue leyendo sin cambios.
- (−) La escritura en `dim_colonia` ahora exige `service_role`/admin (ya era el flujo real de ingesta).

## Referencias
- [data_dictionary.md](../database/data_dictionary.md) §9.1 (hallazgo, marcado RESUELTO)
- [migration_rls_dim_colonia.sql](../database/migration_rls_dim_colonia.sql)
- Migración Supabase: `enable_rls_dim_colonia`
