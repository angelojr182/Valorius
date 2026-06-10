# PHASE 0 — Baseline congelado

**Fecha:** 2026-06-10  
**Estado:** Completado ✅  
**Propósito:** Documentar el comportamiento actual del analizador ANTES de refactorizar

---

## Artefactos generados

### 1. test-cases.js
6 casos de prueba documentados que cubren:
- Caso 1: Apartamento zona con buena cobertura, precio en rango
- Caso 2: Apartamento precio bajo (ganga potencial)
- Caso 3: Apartamento precio alto (sobre mercado)
- Caso 4: Zona con pocas referencias (fallback a zona)
- Caso 5: Entrada inválida: precio fuera de rango (sanity check rechaza)
- Caso 6: Entrada inválida: área fuera de rango (sanity check rechaza)

**Propósito:** Cada caso define input → expected output. Usado para verificar que nada cambió después de refactorizar.

### 2. docs/BUSINESS_RULES.md (v1.0)
Números duros versionados:
- **Precios:** $20k–$5M USD
- **Áreas:** APTO 25–600m², CASA 45–1200m², TERRENO 100–5000m²
- **IPR (Índice Precio Relativo):**
  - < 0.85 = BAJO (gana ≥15% vs mediana)
  - 0.85–1.15 = RANGO (normal)
  - > 1.15 = SOBRE (caro ≥15% vs mediana)
- **IAO (Actividad Observable):**
  - ≤ 3 = Baja
  - 4–8 = Moderada
  - ≥ 9 = Alta
- **Comparables:** 100 días lookback, mínimo 3
- **Outliers:** IQR con factor 1.8
- **Fallback:** Colonia (≥3) → Zona (≥3) → Limitado (<3)

**Propósito:** Documento de referencia para números que no cambiarán sin decisión formal (ADR/RFC).

### 3. test-runner.html
Herramienta interactiva para ejecutar casos manualmente:
- Muestra instrucciones claras
- Lista los 6 casos con datos a ingresar
- Botones para marcar "✓ Hecho" o "✕ Diferente"
- Campo de notas para reportar diferencias

**Acceso:** http://localhost:8000/test-runner.html

### 4. screenshots/phase0-test-runner-baseline.png
Screenshot del test-runner (baseline visual).

---

## Cómo usar el baseline

### Después de cada refactor en FASE 1:

1. **Ejecutar test-cases.js manualmente en analizador.html**
   ```
   Abre analizador.html
   Para cada caso en test-cases.js:
     - Ingresa datos (zona, tipo, precio, área)
     - Haz clic "Analizar"
     - Verifica que el resultado coincida con expectedOutput
     - Si NO coincide → detener y debuggear
   ```

2. **Verificar visualmente**
   ```
   Compara screenshot del resultado con baseline
   Si hay cambios visuales no esperados → revertir
   ```

3. **Regla de oro:**
   ```
   Si CUALQUIER caso falla → REVERTIR INMEDIATAMENTE
   No hay "deuda" aceptable en FASE 1
   Cada commit debe dejar el analizador funcionando idéntico a antes
   ```

---

## Resumen de comportamiento CONGELADO (v1.0)

### Input validation
- ✅ Rechaza precio < $20k con alerta sanity
- ✅ Rechaza precio > $5M con alerta sanity
- ✅ Rechaza área fuera de rangos por tipo
- ✅ Acepta solo APARTAMENTO | CASA | TERRENO
- ✅ Valida zona en dropdown (obligatoria)

### Fallback de comparables
- ✅ Si colonia tiene ≥3 comparables → analiza por colonia
- ✅ Si colonia < 3 pero zona ≥3 → fallback a zona (badge visible)
- ✅ Si zona < 3 → análisis limitado (sin veredicto claro)
- ✅ Si 0 comparables → ERROR

### Cálculos
- ✅ IPR = tu_precio_m2 / mediana_zona_m2
- ✅ Mediana (NO promedio)
- ✅ IQR outlier detection (factor 1.8)
- ✅ p25, p75, min, max sobre comparables filtrados

### Veredictos
- ✅ IPR < 0.85 → BAJO (verde)
- ✅ 0.85 ≤ IPR ≤ 1.15 → RANGO (ámbar)
- ✅ IPR > 1.15 → SOBRE (rojo)
- ✅ Sin datos → REFERENCIA LIMITADA (gris)

### UI
- ✅ Gauge muestra signo literal (±X%)
- ✅ Leyenda con badges "Tu propiedad"
- ✅ Gráfico scatter con comparables
- ✅ Métricas: tu_precio/m², mediana, diferencia %, rango
- ✅ IAO card (actividad baja/moderada/alta)
- ✅ Resumen rápido contextual
- ✅ Badge cobertura cuando aplica

### Alertas
- ✅ Alerta sanity si entrada fuera de rangos
- ✅ Alerta contextual si ratio > 1.8 (atípico)
- ✅ Badge cobertura si colonia < 3 o zona < 3

### Moneda
- ✅ Toggle USD/LPS
- ✅ Conversión con tasa de core.exchange_rate

---

## Qué NO se refactoriza en FASE 1

- ❌ HTML structure (todavía inline en analizador.html)
- ❌ Datos (Supabase seguirá siendo fuente de verdad)
- ❌ Visual design (mismo CSS, mismos colores)
- ❌ Comportamiento del usuario (mismo flujo, mismos resultados)

---

## Próximo paso: FASE 1

Comenzar a extraer lógica a `lib/`:
1. **comparable.js** — selección y estadísticas
2. **analyzer.js** — orquestación
3. **validator.js** — validaciones
4. **formatter.js** — formato visual
5. **constants.js** — números duros

**Principio:** Después de cada commit, los 6 test-cases deben seguir pasando.

---

## Notas

- Test-runner.html está para uso manual/exploratorio. NO es automatizado (Supabase auth bloquea Playwright).
- Los 6 casos cubren happy path + edge cases sanity.
- Baseline congelado = seguridad. Si algo cambía, se nota inmediatamente.

---
