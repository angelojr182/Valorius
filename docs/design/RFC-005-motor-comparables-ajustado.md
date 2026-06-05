# RFC-005 — Motor de comparables ajustado por tamaño (FASE 5)

- **Estado:** Borrador
- **Fecha:** 2026-06-04
- **Autor(es):** Miguel (Valorius) + asesoría Claude
- **FASE relacionada:** FASE 5 — Motor de Comparables Confiables
- **ADRs relacionados:** [ADR-0001](../decisions/ADR-0001-precios-de-oferta-no-de-cierre.md) (precio de oferta), [ADR-0002](../decisions/ADR-0002-gobernanza-documental.md) (gobernanza)

> Nota: los **umbrales de este documento son propuestos (DRAFT)**. Se confirman
> antes de pasar el estado a "Aceptado". Hasta entonces no se modifica el cálculo
> principal del analizador.

## 1. Problema
Hoy el analizador compara el precio/m² del inmueble contra la **mediana de todos**
los inmuebles del mismo tipo en la zona, sin importar el tamaño. Pero el precio/m²
varía con el tamaño (los inmuebles chicos tienen mayor $/m²), así que una mediana
"de toda la zona" puede distorsionar el veredicto. Además, la limpieza de atípicos
actual usa una sola variable (umbral fijo global de $/m²), que descarta datos
buenos y conserva datos malos según el estrato.

Restricción de base: trabajamos con **precios de oferta** ([ADR-0001](../decisions/ADR-0001-precios-de-oferta-no-de-cierre.md)).

## 2. Propuesta
Agregar un **motor de comparables ajustado por tamaño** como **métrica SECUNDARIA
paralela** (no reemplaza el veredicto principal todavía), basado en dos técnicas
estadísticas estándar, implementables con los datos actuales y sin nuevas licencias:

1. **Estratificación** por zona / tipo / **banda de tamaño**: comparar contra los
   inmuebles parecidos, no contra toda la zona.
2. **Limpieza de atípicos multivariante dentro del estrato**: decidir si un dato es
   basura relativo a sus pares reales, no contra un número fijo global.

Más una **capa visible de confianza (Alto / Medio / Bajo)** derivada del mismo
cálculo, y la salvedad permanente de precio de oferta.

## 3. Detalle / método (DRAFT — solo apartamentos en v1)

### 3.1 Estratificación por tamaño
Dada un área `A`, se buscan comparables del mismo tipo y zona dentro de bandas:
- **Banda 1 (estrecha):** `A×0.65` a `A×1.35` (±35%). Si `n ≥ 5` → se usa.
- **Banda 2 (ampliada):** `A×0.50` a `A×1.50` (±50%). Si banda 1 < 5 y banda 2 `n ≥ 5`
  → se usa, etiquetada "rango ampliado".
- `n` entre **3 y 4** → se usa con etiqueta "baja confianza".
- `n < 3` → se cae a la **referencia general de la zona** (cálculo actual),
  etiqueta "sin comparables de tamaño similar".

Siempre se usa **mediana** (nunca promedio) y se muestra: `n`, rango de m² usado y
nivel de confianza.

### 3.2 Limpieza de atípicos dentro del estrato (DRAFT)
Sobre el conjunto ya estratificado, se descartan outliers de $/m² por criterio
robusto **dentro del estrato** (propuesta v1: regla de IQR — fuera de
`[p25 − 1.5·IQR, p75 + 1.5·IQR]`). Alternativa a evaluar: desviación respecto a la
mediana vía MAD. Se documenta cuántos se descartan y por qué (trazabilidad).

### 3.3 Score de confianza (DRAFT)
Combina cantidad y calidad del estrato, con techo por precio de oferta:
- **Alta:** estrato (banda 1) con `n ≥ 8` y datos recientes.
- **Media:** `n` 5–7, o uso de banda ampliada.
- **Baja:** `n` 3–4, o caída a referencia general de zona.
- **Insuficiente:** `n < 3` (lectura preliminar).

## 4. Plan por etapas
```
5-A · Documentar el método (este RFC + calculo_analizador.md)   [sin código]
5-B · Implementar métrica secundaria por tamaño + limpieza atípicos
       (no toca el veredicto principal)
5-C · Mostrar score de confianza (Alto/Medio/Bajo)
5-D · GATE — medir cobertura: % de análisis con comparables suficientes
       → gobierna promoción de B.4 y prioridad de ingesta
5-E · Ingesta dirigida por huecos (continua, re-priorizada por 5-D)
5-F · Zonas gemelas — SOLO con volumen + criterio validado,
       siempre reflejado en el score de confianza
```

## 5. Criterios de aceptación
- **5-A:** método con umbrales concretos, revisado y aceptado; `calculo_analizador.md`
  v1.0 publicado.
- **5-B:** la métrica aparece como bloque secundario, no altera el veredicto
  principal; se ve `n`, rango de m² y comparables usados.
- **5-C:** todo análisis muestra confianza Alto/Medio/Bajo coherente con §3.3.
- **5-D:** existe una medición reproducible del % de análisis con confianza ≥ Media.
- **5-F (gate de entrada):** solo se activa si 5-D muestra estratos aún ralos **y**
  el clustering tiene criterio de similitud validado (nivel de precio +
  características).

## 6. Riesgos y mitigaciones
- **Estratificar gasta la muestra escasa** (134 listings) → muchos estratos con
  `n` bajo. *Mitigación:* fallback por bandas + score de confianza honesto + 5-F.
- **Zonas gemelas mezcladas sin criterio** corromperían la mediana. *Mitigación:*
  5-F va al final, con similitud validada y reflejada en la confianza.
- **Confundir métrica secundaria con veredicto.** *Mitigación:* se mantiene
  secundaria hasta cumplir el gate de 5-D.

## 7. Plan de medición
Métrica norte: **% de análisis que arrojan confianza ≥ Media**. Hoy muchos caen en
"limitado". Esa cifra sube con ingesta dirigida (5-E) y, eventualmente, zonas
gemelas (5-F). Se reporta antes/después de cada cambio.

## 8. Preguntas abiertas
- Confirmar bandas (±35% / ±50%) y mínimos (5 / 3) con datos reales por zona.
- Elegir regla de outlier definitiva (IQR vs MAD) y validarla en 2–3 zonas.
- Definir umbrales exactos del score de confianza (§3.3) tras ver cobertura real.
- ¿Casas se tratan en un RFC aparte (construcción vs terreno)? (Probablemente sí.)
