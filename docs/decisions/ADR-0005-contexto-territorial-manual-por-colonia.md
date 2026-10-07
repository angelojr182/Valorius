# ADR-0005 — Puente territorial para análisis manual por colonia

**Estado:** Aceptada  
**Fecha:** 2026-10-07

## Contexto

El Analyzer ya resuelve correctamente el flujo de una propiedad real mediante:

`property_id → territorial_unit_id → territory-context → territory_gis`

Sin embargo, el flujo normal de análisis manual no recibe `property_id`. El usuario selecciona tipo, zona y, opcionalmente, colonia/proyecto. Por ello el contexto GIS no aparecía en análisis manuales.

El objetivo de la reestructuración territorial es que el contexto esté disponible dentro del análisis, sin depender de una URL específica y sin inferir territorio desde la zona comercial.

## Decisión

Se agrega una columna nullable:

`core.dim_colonia.territorial_unit_id TEXT NULL`

con FK hacia:

`geo.territorial_unit(unit_id)`

Esta columna funciona como **puente de compatibilidad para el flujo manual**. No reemplaza la relación canónica:

`core.property.territorial_unit_id → geo.territorial_unit`

La asignación del puente se realiza únicamente para registros respaldados por el mapeo territorial v34:

- 54 registros `MAPEADO`
- 3 registros `DUPLICADO_DB` con correspondencia territorial documentada
- `PENDIENTE_CRITERIO_HUMANO` permanece NULL
- `SIN_CORRESPONDENCIA` permanece NULL

## Reglas

1. Si existe `property_id`, se mantiene el flujo territorial actual.
2. Si no existe `property_id`, el Analyzer puede resolver territorio desde la colonia seleccionada únicamente mediante `dim_colonia.territorial_unit_id`.
3. Nunca se deriva territorio desde `zone_id`.
4. Si la colonia no tiene correspondencia validada, el análisis continúa y el bloque territorial muestra "Contexto territorial no disponible para esta ubicación".
5. Los datos GIS siguen siendo contexto y no modifican scoring, precio/m², comparables, IPR o IAO.
6. La fuente de asignación debe distinguir "propiedad registrada" de "colonia seleccionada".

## Consecuencia

`core.dim_colonia` sigue siendo legacy/deprecated. Esta columna es una excepción de transición para evitar duplicar lógica o exigir una URL con `property_id`.

La relación puede eliminarse posteriormente cuando el flujo de Property/Listing sea capaz de conservar siempre una identidad de propiedad durante el análisis manual.

## Validación inicial

- 161 propiedades.
- 149 ya tienen `property.territorial_unit_id`.
- 12 permanecen sin territorio directo.
- Tras el puente, ninguna propiedad presenta conflicto entre `property.territorial_unit_id` y `dim_colonia.territorial_unit_id`.
