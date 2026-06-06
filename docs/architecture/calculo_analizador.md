# Cálculo del Analizador — Método Canónico

**Versión:** 1.1 · **Estado:** Vigente (as-built capturado) · **Última actualización:** 2026-06-06

| Versión | Fecha | Cambio | Ref |
|---|---|---|---|
| 1.1 | 2026-06-06 | Tasa LPS ahora se lee de `core.exchange_rate` al iniciar (resuelve deuda §4.1). | CHANGELOG |
| 1.0 | 2026-06-05 | Captura COMPLETA del método vigente, verificada contra `analizador.html`. Documenta el cálculo que hasta ahora vivía solo en el JS. | as-built |
| 0.1 | 2026-06-04 | Stub inicial. | RFC-005 |

> Documento de referencia de **cómo Valorius calcula e interpreta** precios. Vivo y
> versionado: cualquier cambio en el cálculo exige actualizar aquí la versión y la
> tabla de cambios (ver [ADR-0002](../decisions/ADR-0002-gobernanza-documental.md)).
> **Fuente de verdad del código:** `analizador.html` (idéntico a `analizador_prototipo.html` salvo el bloque de auth).

---

## 0. Premisa de base
Valorius trabaja con **precios de oferta (publicados), no de cierre** — ver
[ADR-0001](../decisions/ADR-0001-precios-de-oferta-no-de-cierre.md). Todo resultado
es una **referencia**, no una valoración formal. Esta premisa pone un techo a la
confianza del análisis.

---

## 1. Método VIGENTE (as-built, v1.0)

### 1.1 Constantes
| Constante | Valor | Significado |
|---|---|---|
| `DIAS_COMPARABLES` | 100 | Ventana: solo listings con `fecha_registro` ≥ hoy − 100 días |
| `UMBRAL_ATIPICO` | 1.8 | Si `tuPM2/mediana` > 1.8 o < 1/1.8 (≈0.56) → alerta de precio atípico |
| `tasaLPS` | live (fallback 26.58) | Tasa LPS→USD leída de `core.exchange_rate` (la más reciente) al iniciar; 26.58 solo si el fetch falla |
| `RANGOS_AREA` | APARTAMENTO {25–600} · CASA {45–1200} | Rango de m² plausible por tipo (sanity) |
| `PRECIO_MIN` / `PRECIO_MAX` | 10 000 / 5 000 000 USD | Rango de precio total plausible (sanity) |
| Filtro de carga pm² | descarta si `pm2 ≤ 50` o `pm2 ≥ 15 000` | Limpieza cruda de datos imposibles al cargar |

### 1.2 Pipeline de datos (al iniciar)
1. `GET /rest/v1/listing` con filtros `fecha_registro ≥ hoy−100d`, `area_construccion > 0`,
   `precio_original > 0`. Trae precio, moneda, tipo_cambio, y vía join:
   `zone_id, colonia_id, proyecto_id, habitaciones, banos, zona, colonia, tipo_inmueble`.
2. También carga `dim_colonia`, `dim_proyecto`, `dim_zone` (activos).
3. Por cada fila:
   - `pUSD = moneda==='USD' ? precio_original : precio_original / (tipo_cambio || 26.5)`
   - `pm2 = pUSD / area_construccion`
   - **Descarta** si `pm2 ≤ 50` o `pm2 ≥ 15 000`.
4. Agrupa en dos llaves:
   - **Zona:** `zone_id || tipo`
   - **Colonia:** `zone_id || colonia_id || tipo` (solo si hay `colonia_id`)
   - Cada grupo guarda `precios[]` e `items[]` (pm2, area, total, colonia, hab, banos).

### 1.3 Estadística por grupo (`computeStats`)
Sobre los `pm2` ordenados (`n` = cantidad):
- **mediana** = `p[floor(n/2)]` (elemento medio, **no interpolada**).
- **p25** = `p[floor(n*0.25)]` · **p75** = `p[floor(n*0.75)]` (por índice, no interpolados).
- **Rango (min/max):**
  - si `n ≥ 5`: P10 = `p[floor(n*0.10)]`, P90 = `p[floor(n*0.90)]`.
  - si `n < 5`: `IQR = p75−p25`; `min = max(p[0], p25 − 1.5·IQR)`, `max = min(p[n−1], p75 + 1.5·IQR)`.

### 1.4 Resolución de comparables — fallback de 3 niveles (`resolverComparables`)
1. Si hay grupo de **colonia** con `n ≥ 3` → nivel **`colonia`**.
2. Si no, y el grupo de **zona** tiene `n ≥ 3` → nivel **`zona`**.
3. Si no → nivel **`limitado`** (usa lo que haya; lectura orientativa).

### 1.5 Veredicto
- `tuPM2 = round(precio / area)`
- `desv% = ((tuPM2 − mediana) / mediana) · 100`
- `precioMercado = round(mediana · area)` · `diferenciaPesos = round(precio − precioMercado)`
- **Convención de signo (literal):** `+` = sobre el mercado (más caro) · `−` = bajo el mercado (más barato).

### 1.6 IPR y umbrales (`calcIPR` / `interpretarIPR`)
- `IPR = tuPM2 / mediana`
- `IPR < 0.85` → **bajo** mercado · `0.85 ≤ IPR ≤ 1.15` → **en rango** · `IPR > 1.15` → **sobre** mercado · sin mediana → **referencia limitada**.
- Leyenda de rangos: `uBajo = round(mediana·0.85)`, `uSobre = round(mediana·1.15)`.

### 1.7 Actividad observable IAO (`interpretarIAO`) — por nº de comparables
- `n ≤ 3` → Actividad **baja** · `4 ≤ n ≤ 8` → **moderada** · `n ≥ 9` → **alta**.

### 1.8 Severidad de alerta atípica (`getSeveridad`) — f(desviación, n)
- `|desv| ≥ 100%` → EXTREMO (si `n ≥ 5`), si no MODERADO.
- `|desv| ≥ 60%` → MODERADO (si `n ≥ 10`), si no LEVE.
- resto → LEVE.

### 1.9 Validaciones antes de analizar
- **Sanity:** área fuera de `RANGOS_AREA[tipo]` o precio fuera de `[PRECIO_MIN, PRECIO_MAX]` → alerta explícita, no analiza.
- **Atípico:** `ratio = tuPM2/mediana`; si `> 1.8` o `< 1/1.8` → alerta de precio atípico y pide confirmación antes de continuar.

### 1.10 Moneda
Entrada en USD o LPS (toggle). LPS se convierte a USD con `tasaLPS` **solo para el
cálculo**; en pantalla se muestra en la moneda ingresada, con separador de miles (comas).

### 1.11 Salidas
Gauge (desv%), veredicto principal, interpretación, conclusión, métricas, leyenda de
rangos con la categoría activa marcada, gráfico de comparables, mapa de contexto
(zonas coloreadas por precio relativo) y exportación PDF.

---

## 2. Método PROPUESTO (en diseño — RFC-005)
Estratificación por tamaño + limpieza de atípicos multivariante + score de confianza,
como **métrica secundaria**. Especificado en
[RFC-005](../design/RFC-005-motor-comparables-ajustado.md). Se trasladará aquí, con
umbrales finales, cuando el RFC pase a "Aceptado". Reemplazaría las §1.3–1.4 por una
versión estratificada.

---

## 3. Decisiones relacionadas
- [ADR-0001](../decisions/ADR-0001-precios-de-oferta-no-de-cierre.md) — precio de oferta.
- [ADR-0002](../decisions/ADR-0002-gobernanza-documental.md) — gobernanza.

---

## 4. Notas y deudas técnicas detectadas (al capturar el as-built)
> Estas discrepancias salieron al documentar lo que el código realmente hace vs. las
> reglas escritas en `CLAUDE.md`. Se registran aquí; resolverlas es trabajo aparte.

1. ~~**Tasa LPS hardcodeada (`tasaLPS = 26.58`)**~~ — **RESUELTO (2026-06-06):** el
   analizador ahora lee la tasa más reciente de `core.exchange_rate` al iniciar
   (fallback 26.58 si el fetch falla). Verificado en navegador: cargó 26.5943.
2. **Filtro de pm² de carga (≤50 / ≥15 000) mucho más laxo** que la regla de negocio
   documentada (`CLAUDE.md`: descartar `pm² < $500`, revisar `> $4 000`). El código deja
   pasar datos que la regla escrita descartaría.
3. **`PRECIO_MIN = 10 000`** en código, pero `CLAUDE.md` dice "descartar `< $20 000`".
   Inconsistencia de umbral.
4. **Mediana no interpolada** (`p[floor(n/2)]`): con `n` par toma el elemento superior
   del centro, no el promedio de los dos centrales. Simplificación aceptable, pero a
   tener presente al comparar con cálculos externos.
5. **p25/p75 por índice, no interpolados** — misma observación que (4).
