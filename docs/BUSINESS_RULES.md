# Reglas de negocio del analizador

**Versión:** 1.0  
**Fecha:** 2026-06-09  
**Propósito:** Números duros del analizador — umbrales, rangos, fórmulas

---

## PRECIOS

### Rango válido

| Propiedad | Mínimo | Máximo | Fuente |
|-----------|--------|--------|--------|
| Precio USD | $20,000 | $5,000,000 | PRECIO_MIN/MAX en analizador.html línea 1295 |
| Precio máximo observable | — | $4,000/m² | Sanity: si tu_pm2 > $4k, advertencia |

### Validación de entrada

```javascript
if (precio < PRECIO_MIN) {
  // Rechazo: "El precio ingresado parece demasiado bajo"
  // Rango: < $20,000
}
if (precio > PRECIO_MAX) {
  // Rechazo: "El precio ingresado parece demasiado alto"
  // Rango: > $5,000,000
}
```

**Regla de oro:** Si precio/m² en entrada está fuera de rango normal de zona → alerta sanity (pero NO rechazo, usuario puede confirmar).

---

## ÁREAS POR TIPO

### Rangos de validez (sanity check)

| Tipo | Mínimo | Máximo | Por qué |
|------|--------|--------|---------|
| **APARTAMENTO** | 25 m² | 600 m² | Estudios desde 25; penthouses raros >600 |
| **CASA** | 45 m² | 1,200 m² | Casas muy pequeñas <45 rarísimas; >1,200 es finca |
| **TERRENO** | 100 m² | 5,000 m² | Lotes de inversión: 100–5,000m² típicos |

```javascript
const RANGOS_AREA = {
  'APARTAMENTO': { min: 25,  max: 600 },
  'CASA':        { min: 45,  max: 1200 },
  'TERRENO':     { min: 100, max: 5000 }
};
```

**Si el usuario ingresa área fuera de rango:**
- Alerta sanity visible: "El tamaño de X m² es inusualmente [pequeño|grande] para [tipo]..."
- NO rechaza automático — usuario puede confirmar si lo ingresó correctamente

---

## PERÍODO DE DATOS (Lookback)

```
DIAS_COMPARABLES = 100 días
```

**Fundamento:** El mercado de bienes raíces cambia cada 3–4 meses. Datos más antiguos de 100 días pueden ser obsoletos.

**Regla:** Solo se incluyen listings con `fecha_registro >= hoy - 100 días`.

---

## CANTIDAD DE COMPARABLES

### Mínimos y umbrales

| Cantidad | Significado | Acción |
|----------|-------------|--------|
| **n ≥ 15** | Ideal | Confianza ALTA (UI no advierte nada especial) |
| **3 ≤ n < 15** | Aceptable | Confianza MEDIA (UI puede mostrar badge de cobertura) |
| **n < 3** | Insuficiente | Confianza BAJA (alerta: "Pocas propiedades similares") |
| **n = 0** | Sin datos | ERROR: "Sin propiedades similares registradas" |

```javascript
const MIN_COMPARABLES = 3;
const IDEAL_COMPARABLES = 15;
```

**Fallback de 3 niveles:**
1. **Colonia:** Si n ≥ 3 en colonia específica → analiza por colonia
2. **Zona:** Si n < 3 en colonia pero n ≥ 3 en toda la zona → fallback a zona
3. **Limitado:** Si n < 3 en zona → análisis orientativo (sin veredicto claro)

---

## DETECCIÓN DE OUTLIERS (IQR)

### Fórmula

```
1. Ordena todos los precios/m² de los n comparables
2. Calcula Q1 (percentil 25) y Q3 (percentil 75)
3. IQR = Q3 - Q1

4. Outlier BAJO si:   precio < (Q1 - 1.8 × IQR)
5. Outlier ALTO si:   precio > (Q3 + 1.8 × IQR)

Factor: 1.8
  (probado estadísticamente — ni muy permisivo, ni muy estricto)
```

**Aplicación:**
- Se excluyen outliers del cálculo de mediana, p25, p75
- Usuario ve aviso (opcional): "Se excluyeron X propiedades atípicas"

**Ejemplo con 15 precios:**
```
Original: $100k, $150k, $160k, $170k, $180k, $190k, $200k, $210k, $220k, $230k, $240k, $250k, $260k, $800k, $5k

Detectado outlier alto: $800k
Detectado outlier bajo: $5k

Quedan 13: $100k–$260k → mediana = $210k, p25 = $165k, p75 = $245k
```

---

## CÁLCULO DE MEDIANA

```
NO se usa promedio.
SE CALCULA mediana (valor del medio).
```

**Por qué?**
- Mediana es robusta: un apartamento de $1M no distorsiona el resultado
- Promedio es vulnerable: (200k + 250k + 1000k) / 3 = 483k (falso)
- Mediana: 250k (valor real del mercado)

**Fórmula:**
```
1. Ordena n comparables por precio/m²
2. Si n es impar: mediana = valor posición (n+1)/2
3. Si n es par: mediana = promedio de posiciones n/2 y n/2+1
```

---

## ÍNDICE DE PRECIO RELATIVO (IPR)

### Fórmula

```
IPR = tu_precio_m2 / mediana_zona_m2
```

### Clasificación

| IPR | Categoría | Significado | Color |
|-----|-----------|-------------|-------|
| **IPR < 0.85** | **BAJO** | 15%+ por debajo mediana | Verde |
| **0.85 ≤ IPR ≤ 1.15** | **RANGO** | ±15% de mediana (normal) | Ámbar |
| **IPR > 1.15** | **SOBRE** | 15%+ por encima mediana | Rojo |
| **IPR = null** | **REFERENCIA LIMITADA** | Sin datos suficientes | Gris |

```javascript
function interpretarIPR(ipr) {
  if (!ipr) return {cat:'ref', label:'Referencia limitada'};
  if (ipr < 0.85)  return {cat:'bajo',  label:'Por debajo del mercado observable'};
  if (ipr <= 1.15) return {cat:'rango', label:'Dentro del rango observable'};
  return               {cat:'sobre', label:'Por encima del mercado observable'};
}
```

**Fundamento:** ±15% es el rango que compradores de Tegucigalpa consideran "justo" al tomar decisiones. Empírico del mercado local.

---

## INDICADOR DE ACTIVIDAD OBSERVABLE (IAO)

### Rangos discretos

| Rango | Categoría | Icono | Significado |
|-------|-----------|-------|-------------|
| **n ≤ 3** | Baja | ○ | Pocas referencias; análisis orientativo |
| **4 ≤ n ≤ 8** | Moderada | ◎ | Contexto razonable; confianza media |
| **n ≥ 9** | Alta | ● | Buena base de comparación disponible |

```javascript
function interpretarIAO(n) {
  if (n <= 3) return {clase:'iao-baja',  label:'Actividad baja'};
  if (n <= 8) return {clase:'iao-media', label:'Actividad moderada'};
  return              {clase:'iao-alta',  label:'Actividad alta'};
}
```

**Uso:** Comunica la fortaleza de los datos al usuario (transparencia).

---

## ALERTA CONTEXTUAL (Atipicidad)

### Umbral de ratio

```
UMBRAL_ATIPICO = 1.8
```

**Si `ratio = tu_pm2 / mediana > 1.8` O `ratio < (1/1.8)`:**
- Alerta contextual visible
- Usuario debe confirmar que quiere analizar (no es rechazo automático)

### Severidad (f(desviación, cobertura))

```javascript
function getSeveridad(pctDesviacion, n) {
  var abs = Math.abs(pctDesviacion);
  var cobAlta  = n >= 10, cobMedia = n >= 5;
  
  if (abs >= 100) return cobAlta||cobMedia ? 'EXTREMO' : 'MODERADO';
  if (abs >= 60)  return cobAlta ? 'MODERADO' : 'LEVE';
  return 'LEVE';
}
```

**Interpretación:**
- Desviación ≥ 100% + cobertura baja → EXTREMO (rojo)
- Desviación 60–99% + cobertura alta → MODERADO (naranja)
- Resto → LEVE (amarillo)

---

## PERÍODOS Y CADENCIAS

| Período | Definición | Fuente |
|---------|-------------|--------|
| **Lookback comparables** | 100 días | `DIAS_COMPARABLES` línea 752 |
| **Moneda de referencia** | USD | Snapshots y cálculos en USD |
| **Tasa de cambio** | Diaria | `core.exchange_rate` (actualizada por Edge Function) |

---

## RESUMEN RÁPIDO

### 1 línea por veredicto

| Veredicto | Conclusión |
|-----------|-----------|
| BAJO | "Precio por debajo del mercado. Puede ser una oportunidad. Inspecciona el inmueble..." |
| RANGO | "Precio en línea con el mercado. Compara acabados, parqueos, mantenimiento..." |
| SOBRE | "Precio por encima del mercado. Negocia con datos; similares se ofrecen alrededor de $X/m²..." |
| LIMITADO | "Pocas propiedades similares. El análisis es orientativo..." |

---

## OBSERVACIONES Y LÍMITES

### Qué el analizador **NO** captura

- Calidad (acabados, estado, antigüedad)
- Ubicación exacta (frente a calle, calle sin salida, etc.)
- Amenities (piscina, seguridad, vista)
- Negociabilidad del precio (urgencia vendedor, flexibilidad)
- Precios de **cierre** reales (solo precios de **oferta** publicados)

### Confianza nunca es 100%

- Mínimo: 0.3 (muy bajo, datos limitados)
- Máximo: ~0.95 (nunca 1.0, siempre hay incertidumbre)

---

## Versionado

- **v1.0 (2026-06-09):** Números duros congelados. FASE 0 baseline.
- (v1.1, v1.2, etc. después de FASE 5 si se ajustan umbrales tras RFC-005)

---
