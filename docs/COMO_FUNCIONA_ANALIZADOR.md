# Cómo funciona el analizador

**Versión:** 1.0  
**Fecha:** 2026-06-09  
**Propósito:** Explicar la lógica del analizador en palabras claras, sin código

---

## Resumen en 30 segundos

1. **Tú das:** zona, tipo, precio, área
2. **El analizador busca:** propiedades PARECIDAS (comparables)
3. **Calcula:** el precio promedio de esas parecidas
4. **Compara:** tu precio vs ese promedio
5. **Te dice:** "Tu precio está BAJO / EN RANGO / CARO"

---

## Paso a paso

### Paso 1: El usuario ingresa datos

```
El usuario abre analizador.html y completa:
  • Zona: "Bulevar Morazán"
  • Tipo: "APARTAMENTO"
  • Precio: $250,000 USD
  • Área: 120 m²
```

### Paso 2: Validar que los datos sean válidos

Antes de hacer cualquier análisis, el analizador verifica:

```
¿Precio está entre $20,000 y $5,000,000?
  ✅ SÍ ($250,000 es válido)

¿Área está entre 25m² y 600m² (para apartamento)?
  ✅ SÍ (120m² es válido)

¿Tipo es válido (APARTAMENTO, CASA, TERRENO)?
  ✅ SÍ (APARTAMENTO es válido)

¿Moneda es válida (USD, LPS)?
  ✅ SÍ (USD es válido)

Si algo NO es válido → ERROR, rechaza análisis
Si todo es válido → sigue adelante
```

### Paso 3: Buscar comparables (propiedades parecidas)

El analizador busca en la base de datos:

```
Criterios de búsqueda:
  • Zona: Bulevar Morazán
  • Tipo: APARTAMENTO
  • Fecha: últimos 100 días
  • Área: entre 25m² y 600m²

Resultado: encuentra 15 apartamentos parecidos
```

**¿Por qué 100 días?**
Porque el mercado cambia cada 3-4 meses. Datos más viejos pueden ser obsoletos.

**¿Por qué esos rangos de área?**
Porque apartamentos menores a 25m² son estudios (muy diferentes), y mayores a 600m² son penthouses (también muy diferentes). Solo comparas con lo parecido.

### Paso 4: Quitar raros (outliers)

De esos 15 apartamentos, algunos pueden ser RAROS:

```
Precios de los 15:
  $200,000
  $210,000
  $220,000
  $230,000
  $240,000
  $250,000  ← precio del usuario
  $260,000
  $270,000
  $280,000
  $290,000
  $300,000
  $310,000
  $320,000
  $100,000  ← RARO (ganga extrema, quitar)
  $800,000  ← RARO (penthouse cara, quitar)

Quedan: 13 apartamentos "normales"
```

**¿Cómo sabe cuál es raro?**
Usa una fórmula estadística llamada IQR:
- Calcula Q1 (25% más barato) y Q3 (25% más caro)
- Cualquier precio fuera de cierto rango es "raro" y se quita
- Esta fórmula es robusta: no se deja engañar por extremos

### Paso 5: Calcular el precio del medio (mediana)

De los 13 apartamentos "normales", calcular:

```
Precios ordenados de menor a mayor:
  $200,000
  $210,000
  $220,000
  $230,000
  $240,000
  $250,000  ← Este es el MEDIO (posición 7 de 13)
  $260,000
  $270,000
  $280,000
  $290,000
  $300,000
  $310,000
  $320,000

MEDIANA = $250,000
```

**¿Mediana o promedio?**
El analizador usa MEDIANA (el valor del medio), no promedio.

¿Por qué? Porque la mediana es más robusta:
- Si hay un pentthouse de $1M, el promedio sube artificialmente
- La mediana NO se afecta, sigue siendo el valor del medio

### Paso 6: Comparar tu precio vs la mediana

```
Tu precio: $250,000
Mediana del mercado: $250,000

Diferencia: 250,000 / 250,000 = 1.0

Traducción:
  1.0 = "100% de la mediana" = "mismo precio que mediana"
  0.9 = "90% de la mediana" = "10% BAJO"
  1.1 = "110% de la mediana" = "10% ALTO"

Tu caso: 1.0 → veredicto = EN RANGO ✅
```

**Clasificación (la regla de ±15%):**
```
Si tu precio es < 85% de mediana (0.85)
  → VEREDICTO: BAJO (ganga)

Si tu precio es entre 85% y 115% de mediana
  → VEREDICTO: EN RANGO (normal)

Si tu precio es > 115% de mediana
  → VEREDICTO: CARO (sobre el mercado)
```

**¿Por qué ±15%?**
Empírico del mercado de Tegucigalpa. Compradores consideran "justo" ese rango.

### Paso 7: Calcular confianza (¿cuánta seguridad tiene este análisis?)

Varios factores afectan la confianza:

```
Factor 1: ¿Cuántos comparables hay?
  • 13 apartamentos = BUENO
  • Mínimo: 3 (analiza pero con warning)
  • Ideal: 15+
  • Influencia: 50% de la confianza

Factor 2: ¿Los precios son parecidos o muy diferentes?
  • Si precios están entre $240k-$260k → MUY parecidos → ALTA confianza
  • Si hay de $100k a $800k → MUY diferentes → BAJA confianza
  • Influencia: 30% de la confianza

Factor 3: ¿Tu apartamento es parecido al de los comparables?
  • Si hay muchos de 120m² → BIEN
  • Si todos son de 50m² o 200m² → menos confianza
  • Influencia: 20% de la confianza

Confianza final = (Factor1 × 0.5) + (Factor2 × 0.3) + (Factor3 × 0.2)

Resultado: 0.85 (ALTA) ✅
```

### Paso 8: Mostrar resultado al usuario

```
┌─────────────────────────────────┐
│ TU PROPIEDAD: EN RANGO          │
│ 📊 Precio justo                 │
│                                 │
│ Tu precio: $250,000             │
│ Precio del mercado: $250,000    │
│ Diferencia: ±0%                 │
│                                 │
│ Apartamentos comparables: 13    │
│ Confianza: ALTA                 │
│                                 │
│ Propiedades parecidas:          │
│  • Apt 1: 120m², $240k          │
│  • Apt 2: 115m², $275k          │
│  • Apt 3: 125m², $255k          │
│  ... (10 más)                   │
│                                 │
│ Nota: 2 apartamentos excluidos  │
│ del análisis por ser atípicos   │
└─────────────────────────────────┘
```

---

## CASOS ESPECIALES

### Caso 1: ¿Qué pasa si hay muy pocos comparables?

```
Situación: El usuario busca en San Ignacio, apartamentos
Búsqueda colonia: encuentra solo 2 apartamentos

Acción del analizador:
  → NO analiza en San Ignacio (necesita mínimo 3)
  → Busca en toda la ZONA (San Ignacio + zonas cercanas)
  → Encuentra 8 apartamentos
  → Analiza CON WARNING: "⚠️ Pocos datos en colonia, usados datos de zona"

Si sigue sin encontrar 3:
  → ERROR: "No hay suficientes datos para analizar"
  → NO muestra resultado
```

### Caso 2: ¿Qué pasa si el usuario ingresa un precio RARÍSIMO?

```
Situación: Usuario ingresa $5,000 (demasiado bajo)

Acción:
  ❌ RECHAZA inmediatamente
  📝 Mensaje: "Precio mínimo es $20,000 USD"
  ❌ NO sigue adelante
  ❌ NO analiza
```

### Caso 3: ¿Qué pasa si el área es fuera de rango?

```
Situación: Usuario dice "apartamento de 800m²"

Acción:
  ❌ RECHAZA inmediatamente
  📝 Mensaje: "Apartamento máximo es 600m². ¿Quizás es una casa?"
  ❌ NO sigue adelante
```

### Caso 4: ¿Qué pasa si hay outliers?

```
Situación: De 15 comparables, 2 son atípicos

Acción:
  ✅ Los excluye automáticamente
  📝 Info: "Se excluyeron 2 propiedades atípicas (precio muy alto/bajo)"
  ✅ Continúa análisis con 13 comparables normales
```

---

## NÚMEROS DUROS (Las reglas)

### Precios
```
Mínimo válido: $20,000 USD
  (Menor a esto es descartado como error de dato)

Máximo válido: $5,000,000 USD
  (Mayor a esto es descartado como error de dato)

Máximo para análisis: $4,000 USD/m²
  (Si precio/m² > $4k, advertencia: "Verifica datos, precio muy alto")
```

### Áreas por tipo
```
APARTAMENTO:
  Mínimo: 25 m² (estudios)
  Máximo: 600 m² (penthouses)

CASA:
  Mínimo: 45 m² (casas muy pequeñas son raras)
  Máximo: 1,200 m² (casas más grandes son raras)

TERRENO:
  Mínimo: 100 m²
  Máximo: 5,000 m²
```

### Período de datos
```
Comparables: Últimos 100 días
  (El mercado cambia cada 3-4 meses, datos viejos = no válidos)
```

### Cantidad de comparables
```
Mínimo para analizar: 3
  (Análisis con confianza BAJA, pero se hace)

Ideal: 15+
  (Confianza ALTA)

Si hay < 3: ERROR, no analiza
```

### Clasificación (IPR)
```
IPR = tu_precio / precio_mediana

BAJO:  IPR < 0.85  (tu precio es 15%+ bajo)
RANGO: 0.85 ≤ IPR ≤ 1.15 (±15% de mediana)
CARO:  IPR > 1.15  (tu precio es 15%+ alto)
```

### Detección de outliers
```
Fórmula: IQR (Rango Intercuartil)

1. Ordena todos los precios/m²
2. Calcula Q1 (25% más barato) y Q3 (25% más caro)
3. IQR = Q3 - Q1
4. Outlier si:
   precio < (Q1 - 1.8 × IQR)  [BAJO extremo]
   o
   precio > (Q3 + 1.8 × IQR)   [ALTO extremo]

Factor 1.8: probado estadísticamente
  (ni muy permisivo, ni muy estricto)
```

### Confianza
```
Score: 0 a 1 (0% a 100%)

< 0.4:   BAJA     (pocas referencias, datos dispersos)
0.4-0.7: MEDIA    (datos aceptables)
> 0.7:   ALTA     (muchas referencias, datos consistentes)

Mínima para analizar: 0.3
  (Puede analizar con confianza baja, pero lo advierte)
```

---

## FLUJO VISUAL SIMPLIFICADO

```
┌─────────────────────────────────────┐
│ Usuario ingresa: zona, tipo,        │
│ precio, área                        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ ¿Datos válidos?                     │
│ (precio, área, tipo, moneda OK)     │
└────────┬──────────────────────┬─────┘
         │ Sí                    │ No
         ▼                       ▼
    Sigue                    ERROR
                             (rechaza)
         │
         ▼
┌─────────────────────────────────────┐
│ Buscar comparables                  │
│ (zona/colonia + tipo + 100 días)    │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ ¿Hay 3+ comparables?                │
└────────┬──────────────────────┬─────┘
         │ Sí                    │ No
         ▼                       ▼
    Sigue               Fallback a zona
                        o ERROR
         │
         ▼
┌─────────────────────────────────────┐
│ Quitar raros (outliers)             │
│ Calcular estadísticas (mediana)     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Comparar tu precio vs mediana       │
│ Calcular IPR                        │
│ Clasificar: BAJO / RANGO / CARO     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Calcular confianza (0-1)            │
│ Generar alertas/warnings            │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ MOSTRAR RESULTADO:                  │
│ • Veredicto (BAJO/RANGO/CARO)       │
│ • IPR (%)                           │
│ • Confianza                         │
│ • Comparables                       │
│ • Alertas                           │
└─────────────────────────────────────┘
```

---

## EJEMPLO REAL COMPLETO

```
ENTRADA:
  Zona: San Ignacio
  Tipo: APARTAMENTO
  Precio: $180,000 USD
  Área: 90 m²

PASO 1 - VALIDAR:
  ✅ Precio $180k entre $20k-$5M
  ✅ Área 90m² entre 25-600m²
  ✅ Tipo APARTAMENTO válido
  → SIGUE

PASO 2 - BUSCAR COMPARABLES:
  Criterios: San Ignacio + APARTAMENTO + últimos 100 días + 25-600m²
  Encontrados: 4 apartamentos

PASO 3 - QUITAR RAROS:
  Precios: $150k, $175k, $190k, $400k
  $400k es raro (outlier) → QUITAR
  Quedan: 3 apartamentos

PASO 4 - ESTADÍSTICAS:
  Precios: $150k, $175k, $190k
  Mediana: $175k (el del medio)

PASO 5 - COMPARAR:
  Tu precio: $180k
  Mediana: $175k
  IPR = 180,000 / 175,000 = 1.029
  Interpretación: +2.9% vs mediana
  Veredicto: EN RANGO ✅

PASO 6 - CONFIANZA:
  Solo 3 comparables (menos de ideal)
  Precios cercanos (poca dispersión)
  Tamaño similar (90m² vs 85-95m² promedio)
  Confianza: 0.65 (MEDIA)

PASO 7 - ALERTAS:
  ⚠️ "Pocos comparables en San Ignacio (3). Datos pueden variar."

RESULTADO FINAL:
  ┌──────────────────────────────┐
  │ EN RANGO                     │
  │ 📊 Precio justo (+2.9%)      │
  │                              │
  │ Tu precio: $180,000          │
  │ Mercado: $175,000            │
  │ Comparables: 3               │
  │ Confianza: MEDIA             │
  │                              │
  │ ⚠️ Pocos datos en San Ignacio│
  │ Verifica en otros portales   │
  └──────────────────────────────┘
```

---

## PREGUNTAS FRECUENTES

**P: ¿Por qué mediana y no promedio?**
R: Si un departamento cuesta $1M y otros $200k, la mediana no se distorsiona (sigue siendo el precio del medio). El promedio sí se va arriba. La mediana es más honesta.

**P: ¿Por qué ±15% exactamente?**
R: Empírico del mercado de Tegucigalpa. Es el rango que compradores consideran "justo" al tomar decisiones.

**P: ¿Qué pasa si hay 0 comparables?**
R: El analizador busca en zona más amplia. Si sigue habiendo < 3, dice "sin datos, no puedo analizar".

**P: ¿Cómo sabe qué es un outlier?**
R: Usa una fórmula estadística (IQR). Si un precio está muy fuera del rango normal, lo marca como raro y lo quita.

**P: ¿Qué significan los 100 días?**
R: El mercado cambia cada 3-4 meses. Datos más viejos pueden no reflejar el precio actual.

**P: ¿Por qué rechaza precios muy bajos?**
R: Porque < $20k es probablemente un error de dato (digit faltante, etc.). Es una guardia contra basura.

**P: ¿Qué significa "confianza baja"?**
R: Que el análisis puede variar. Tal vez solo hay 3 comparables, o los precios están muy dispersos. Siempre es válido, pero menos seguro.

---

## CONCLUSIÓN

El analizador es un **árbitro honesto**:
- No te miente: rechaza datos basura
- No es ingenuo: quita raros, no se deja engañar
- No es sesgado: usa mediana (el valor del medio), no promedio
- Es transparente: te dice la confianza y las limitaciones
- Es pragmático: busca en zona si colonia tiene pocos datos

**En resumen:** busca propiedades parecidas, saca el precio del medio, te compara, te dice si estás abajo/rango/arriba, y te advierte si tiene dudas.

---
