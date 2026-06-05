# Cálculo del Analizador — Método Canónico

**Versión:** 0.1 · **Estado:** En definición (ver [RFC-005](../design/RFC-005-motor-comparables-ajustado.md)) · **Última actualización:** 2026-06-04

| Versión | Fecha | Cambio | Ref |
|---|---|---|---|
| 0.1 | 2026-06-04 | Stub inicial. Documenta el método VIGENTE de hoy; el método ajustado por tamaño está en diseño. | RFC-005 |

> Este es el documento de referencia de **cómo Valorius calcula e interpreta**
> precios. Es un documento **vivo y versionado**. Cualquier cambio en el cálculo
> exige actualizar aquí la versión y la tabla de cambios (ver [ADR-0002](../decisions/ADR-0002-gobernanza-documental.md)).

---

## 0. Premisa de base
Valorius trabaja con **precios de oferta (publicados), no de cierre** — ver
[ADR-0001](../decisions/ADR-0001-precios-de-oferta-no-de-cierre.md). Todo resultado
es una **referencia**, no una valoración formal. Esta premisa pone un techo al
score de confianza.

## 1. Método VIGENTE (v0.1 — lo que hace hoy el analizador)
- Toda la estadística se calcula en **JavaScript en el cliente** a partir de filas
  crudas (`GET /rest/v1/listing` + dim_*). **No** existe una vista
  `core.v_property_analysis`.
- Comparables = inmuebles del **mismo tipo y zona** (con fallback a colonia/zona
  según cobertura). Se calcula **mediana, p25, p75, min, max** de $/m².
- **IPR** (Índice de Precio Relativo) = `tu_pm2 / mediana`. Umbrales:
  `< 0.85` bajo · `0.85–1.15` en rango · `> 1.15` sobre mercado.
- Nivel de cobertura actual: `colonia` (≥3) · `zona` (≥3 en zona) · `limitado` (<3).

## 2. Método EN DISEÑO (v1.0 — ajustado por tamaño)
Estratificación por tamaño + limpieza de atípicos multivariante + score de
confianza. Especificado en [RFC-005](../design/RFC-005-motor-comparables-ajustado.md).
**Se trasladará aquí, con umbrales finales, cuando el RFC pase a "Aceptado".**

### Secciones a completar al aceptar RFC-005
- [ ] 2.1 Estratificación: bandas finales y mínimos.
- [ ] 2.2 Limpieza de atípicos: regla definitiva (IQR / MAD) y validación.
- [ ] 2.3 Score de confianza: umbrales finales Alto/Medio/Bajo.
- [ ] 2.4 Relación métrica secundaria ↔ veredicto principal.
