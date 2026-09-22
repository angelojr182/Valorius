# CIERRE — ETAPA 2 / 2b — TERRITORY → GIS

Estado: EN VALIDACIÓN

## Identificación

- Proyecto: Valorius
- Etapa: 2 — Property + Territory
- Subetapa: 2b — Territory → GIS
- Flujo: Property → territorial_unit → territory → territory_gis → Analyzer/Report
- Documento rector: VALORIUS_ARQUITECTURA_DB_v2.md

## Objetivo

Enriquecer el contexto territorial de cada propiedad con las intersecciones entre su unidad territorial canónica y las cuatro capas GIS oficiales ya integradas:

- amenaza_inundacion
- amenaza_ladera
- areas_protegidas
- pu_zonas

## Evidencia implementada

- geo.get_territory_gis() implementada y validada.
- territory-context v9 devuelve territory_gis.
- TerritorialAdapter conserva territoryGis sin inferencias.
- ReportDataBuilder transporta territoryGis separado de territory.
- No se modifican las métricas comerciales del Analyzer.

## Evidencia pendiente para cierre

- Validación end-to-end del endpoint territory-context.
- Validación en Analyzer/Report del caso real.
- Prueba de no regresión de métricas comerciales.
- Registro de commits y evidencia final.

## Regla de cierre

Esta subetapa no se marca como CERRADA hasta que el flujo habilitado funcione con evidencia real y la prueba de no regresión sea satisfactoria.

## Alcance

No se incorporan capas SINIT adicionales en 2b. La ubicación exacta de la propiedad y los análisis espaciales que dependen de ella corresponden a 2c.

## Resultado final

Pendiente de validación final.
