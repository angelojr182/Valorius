# ADR-0002 — Gobernanza documental de Valorius

- **Estado:** Aceptado
- **Fecha:** 2026-06-04
- **Decisores:** Miguel (Valorius)
- **Reemplaza a:** —

## Contexto
Hasta ahora, decisiones, métodos y reglas de Valorius se acordaban en el chat y
quedaban dispersos. Eso impide trazabilidad y vuelve al chat la "memoria
principal" del proyecto, lo cual es frágil y no auditable. Ingeniería de software
y data analytics serias formalizan esto con artefactos versionados.

## Decisión
Se adopta un sistema mínimo de gobernanza documental, versionado en Git:

**Regla operativa:** *Si no está documentado, versionado y trazable en este repo,
no existe como decisión formal.*

**Regla de cobertura:** todo cambio importante debe tener al menos una de:
- **ADR** si es una decisión difícil de revertir.
- **RFC** si es una mejora que debe diseñarse antes de construir.
- **Actualización del método canónico** si cambia cómo se calcula/interpreta.

**Definition of Done:** un cambio no está cerrado sin (1) código/SQL aplicado si
corresponde, (2) documento actualizado, (3) registro en CHANGELOG, (4) validación
o evidencia del resultado.

**Convenciones:**
- ADR: numeración global secuencial e inmutable (`ADR-0001`…). Una decisión que
  cambia no se reescribe: se crea otra que la reemplaza.
- RFC: numeración alineada a la FASE para legibilidad (`RFC-005` = FASE 5). Si una
  fase necesitara más de un RFC, se usa `005a`, `005b`.
- Nombres de archivo en `kebab-case`: `ADR-0001-titulo-corto.md`.
- [`/docs/INDEX.md`](../INDEX.md) es el índice maestro y debe mantenerse al día.

**Alcance inicial (mínimo viable):** ADR, RFC, método canónico, INDEX, CHANGELOG.

**Diferido (entra cuando la ingesta dirigida lo requiera, p. ej. FASE 5-D/5-E):**
diccionario de datos formal, SOP de ingesta, linaje de registro completo.
Nota: el **diccionario de datos hoy vive de facto en `CLAUDE.md`** y se migrará a
`/docs/database/data_dictionary.md` cuando se formalice.

## Alternativas consideradas
- **Seguir documentando en el chat / CLAUDE.md únicamente** — rechazado: no es
  auditable por artefacto ni separa decisión, diseño y método.
- **Adoptar gobernanza enterprise completa desde el día uno** — rechazado: se
  vuelve burocracia insostenible para una operación chica y muere.

## Consecuencias
- (+) Trazabilidad real; el proyecto deja de depender del chat como memoria.
- (+) Separa decisiones (ADR), diseño (RFC) y método vigente (spec).
- (−) Disciplina extra por cambio; se mitiga manteniendo el alcance mínimo.

## Referencias
- [INDEX](../INDEX.md) · Plantillas: [ADR](ADR-TEMPLATE.md), [RFC](../design/RFC-TEMPLATE.md)
- FASE 5 es el primer trabajo que estrena esta gobernanza (ver RFC-005).
