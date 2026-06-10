# Índice de documentación — Valorius

> **Regla operativa del proyecto:**
> **Si no está documentado, versionado y trazable en este repo, no existe como decisión formal.**
> El chat es para pensar; Git es la fuente de verdad.

Este índice es el punto de entrada a toda la documentación formal de Valorius.
Mantenerlo al día es parte de la *Definition of Done* (ver abajo).

---

## Tipos de artefacto

| Tipo | Para qué | Carpeta | Inmutable |
|---|---|---|---|
| **ADR** (Architecture Decision Record) | Registrar una decisión difícil de revertir | [`/docs/decisions/`](decisions/) | Sí |
| **RFC / Design Doc** | Diseñar una mejora **antes** de construirla | [`/docs/design/`](design/) | Se congela al aceptarse |
| **Método canónico** | Cómo Valorius calcula e interpreta resultados (versionado) | [`/docs/architecture/`](architecture/) | No (vive) |
| **Diccionario de datos** | Definición de tablas/campos/calidad | [`/docs/database/data_dictionary.md`](database/data_dictionary.md) | No |
| **CHANGELOG** | Historial legible de cambios | [`/docs/changelog/`](changelog/CHANGELOG.md) | No |

---

## Regla de cobertura

> Todo cambio importante en Valorius debe tener **al menos una** de estas tres cosas:
> - **ADR** — si es una decisión difícil de revertir.
> - **RFC** — si es una mejora que debe diseñarse antes de construir.
> - **Actualización del método** — si cambia cómo Valorius calcula o interpreta resultados.

## Definition of Done

Un cambio **no está cerrado** si no tiene:
1. Código o SQL aplicado, si corresponde.
2. Documento actualizado (ADR / RFC / método / este índice).
3. Registro en el CHANGELOG.
4. Validación o evidencia del resultado.

---

## Registro de Decisiones (ADR)

| ID | Título | Estado | Fecha |
|---|---|---|---|
| [ADR-0001](decisions/ADR-0001-precios-de-oferta-no-de-cierre.md) | Trabajamos con precios de oferta, no de cierre | Aceptado | 2026-06-04 |
| [ADR-0002](decisions/ADR-0002-gobernanza-documental.md) | Gobernanza documental de Valorius | Aceptado | 2026-06-04 |
| [ADR-0003](decisions/ADR-0003-rls-dim-colonia.md) | RLS en core.dim_colonia (lectura pública, escritura service_role) | Aceptado | 2026-06-06 |
| [ADR-0004](decisions/ADR-0004-reingenieria-geografica-fase6.md) | Reingeniería geográfica: separar zonas de colonias (Las Casitas, El Sauce, Villa Elena) | Aceptado | 2026-06-08 |

## Diseños (RFC)

| ID | Título | Estado | Fecha |
|---|---|---|---|
| [RFC-005](design/RFC-005-motor-comparables-ajustado.md) | Motor de comparables ajustado por tamaño (FASE 5) | Borrador | 2026-06-04 |

## Método canónico

| Documento | Versión | Estado |
|---|---|---|
| [calculo_analizador.md](architecture/calculo_analizador.md) | 1.1 | Vigente (as-built capturado) |
| [COMO_FUNCIONA_ANALIZADOR.md](COMO_FUNCIONA_ANALIZADOR.md) | 1.0 | Vigente (explicación plain-language) |
| [BUSINESS_RULES.md](BUSINESS_RULES.md) | 1.0 | Vigente (números duros versionados) |

## Documentación base (as-built)

| Documento | Versión | Estado |
|---|---|---|
| [data_dictionary.md](database/data_dictionary.md) | 1.1 | Vigente (modelo de datos `core`) |
| [arquitectura.md](architecture/arquitectura.md) | 1.0 | Vigente (inventario del sistema) |

## Documentación de evolución (Plan maestro)

| Documento | Versión | Fase | Estado |
|---|---|---|---|
| [PLAN_EVOLUCION.md](PLAN_EVOLUCION.md) | 1.0 | 0–3 | Roadmap 9 semanas, CERO presupuesto |
| [PHASE0_BASELINE.md](PHASE0_BASELINE.md) | 1.0 | 0 | Baseline congelado antes de refactorizar |

## Plantillas

- [Plantilla ADR](decisions/ADR-TEMPLATE.md)
- [Plantilla RFC](design/RFC-TEMPLATE.md)
