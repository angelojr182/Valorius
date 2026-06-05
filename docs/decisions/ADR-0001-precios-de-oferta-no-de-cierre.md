# ADR-0001 — Trabajamos con precios de oferta, no de cierre

- **Estado:** Aceptado
- **Fecha:** 2026-06-04
- **Decisores:** Miguel (Valorius)
- **Reemplaza a:** —

## Contexto
Las fuentes de datos de Valorius (Rentify, CS Bienes Raíces y futuros portales)
publican **precios pedidos / de oferta**, no precios de transacción (cierre).
Un precio de oferta puede diferir significativamente del precio al que la
propiedad realmente se vende.

A diferencia de tasadoras institucionales (p. ej. Tinsa/Accumin, con +6M de
tasaciones físicas como "verdad de campo"), Valorius **no dispone hoy de una
fuente confiable de precios de cierre**.

## Decisión
Todo análisis de Valorius se trata y se comunica como una **referencia basada en
precios publicados (de oferta)**, nunca como una valoración o tasación formal.
El **score de confianza** del análisis nace atado a esta limitación: la calidad
del dato base pone un techo a la confianza, independientemente del número de
comparables disponibles.

## Alternativas consideradas
- **Esperar/conseguir datos de cierre antes de operar** — inviable hoy: no existe
  una fuente abierta y confiable de transacciones en Tegucigalpa.
- **Presentar el resultado como "valor real / precio justo"** — rechazado: es
  impreciso y expone a Valorius en credibilidad y en lo legal.

## Consecuencias
- (+) Honestidad metodológica y protección de credibilidad/legal.
- (+) Da un eje claro para el score de confianza y para el copy del producto.
- (−) Hay un techo de confianza inherente; se compensa con método (estratificación,
  limpieza de atípicos), volumen dirigido y transparencia, no fingiendo precisión.

## Referencias
- [RFC-005 — Motor de comparables ajustado por tamaño](../design/RFC-005-motor-comparables-ajustado.md)
- Análisis de evolución de Accumin/Tinsa (sesión 2026-06-04): su confianza se
  apoyaba en *ground truth* de tasaciones reales — capa que Valorius no tiene.
