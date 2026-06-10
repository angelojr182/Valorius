# Plan de Evolución — Valorius sin presupuesto

**Versión:** 1.0  
**Fecha:** 2026-06-09  
**Estado:** Listo para implementar  
**Duración total:** 9 semanas (3-4 horas/semana, tiempo libre)

---

## OBJETIVO

Convertir `analizador.html` (caos de 1000+ líneas) en una **aplicación profesional, modular, mantenible** sin gastar dinero. Cero presupuesto. Tu tiempo libre.

---

## PRINCIPIOS INAMOVIBLES

1. **Cada fase = analizador funcionando igual que antes**
   - Nada de "semanas rotas esperando que todo encaje"
   - Cambios pequeños, commit funcional por cada cambio
   - Git como checkpoints de seguridad

2. **Lógica separada de presentación**
   - HTML = SOLO orquestador visual
   - Lógica = librerías reutilizables, testeable
   - Una función = un trabajo claro

3. **Validaciones y formatos centralizados**
   - Una sola fuente de verdad para cada regla
   - Si cambias "precio mínimo es $20k", afecta TODO automáticamente
   - No duplicación (HTML + JS + backend diciendo lo mismo)

4. **Datos de configuración versionados**
   - Zonas, colonias, proyectos en JSON (copia operativa)
   - Cada cambio en catálogo = nuevo archivo, nuevo version
   - NO hardcodeado en HTML

5. **Pruebas continuas, manual pero efectivas**
   - Después de cada commit: probar en navegador
   - Si no funciona exactamente como antes → revertir y fix
   - GitHub como bitácora de "esto funciona"

---

## ARQUITECTURA FINAL (9 semanas después)

```
lib/
  ├─ analyzer.js            (COORDINADOR: orquestación final)
  ├─ comparable.js          (EXPERTO: seleccionar, filtrar, estadísticas)
  ├─ validator.js           (VALIDACIONES: entrada)
  ├─ formatter.js           (FORMATO: visual)
  └─ constants.js           (REGLAS: códigos estables, no UUIDs)

data/
  ├─ property_types.json    (APARTAMENTO → UUID mapping)
  ├─ zones.json             (52 zonas)
  ├─ colonias.json          (60 colonias)
  └─ projects.json          (32 proyectos)

components/                 (FASE 3 solamente)
  ├─ AnalysisSummary.html
  ├─ PriceCard.html
  ├─ ComparableTable.html
  ├─ ConfidenceIndicator.html
  ├─ MarketRangeChart.html
  └─ MapPanel.html

test-cases.js              (Casos de prueba documentados)
test-runner.js             (Verificador de casos)

analizador.html            (200-300 líneas, solo orquestación)
```

---

## FASES DE IMPLEMENTACIÓN

### FASE 0: Congelar comportamiento (1 semana, 2-3 horas)

**Objetivo:** Documentar qué hace hoy ANTES de refactorizar.

**Qué hacer:**
- [ ] Crear `test-cases.js` con 6 casos de prueba (input → expected output)
- [ ] Tomar screenshots del comportamiento actual
- [ ] Crear archivo `docs/COMO_FUNCIONA_ANALIZADOR.md`
- [ ] Documentar `docs/BUSINESS_RULES.md` (números duros)

**Beneficio:** Después de cada refactor, verificas que nada cambió.

**Commit:**
```
FASE 0: Congelar comportamiento del analizador

- test-cases.js: 6 casos de prueba documentados
- test-runner.js: función para verificar casos
- screenshots/: evidencia visual del comportamiento esperado
- docs/COMO_FUNCIONA_ANALIZADOR.md: explicación en palabras claras
- docs/BUSINESS_RULES.md: reglas duros (precios, áreas, umbrales)

Propósito: tener punto de referencia antes de refactorizar.
Cualquier cambio se nota inmediatamente.
```

---

### FASE 1: Separar lógica (2-3 semanas, 8-12 horas)

**Objetivo:** Todo cálculo sale del HTML → librerías JavaScript.

**CLAVE:** Separación de responsabilidades
- `comparable.js` = EXPERTO (seleccionar, filtrar, estadísticas)
- `analyzer.js` = COORDINADOR (orquestar, no calcular)
- `validator.js` = VALIDACIONES
- `formatter.js` = FORMATO
- `constants.js` = REGLAS (códigos estables, no UUIDs)

**Qué hacer:**

**Paso 1.1: Crear `lib/comparable.js` (EL CORAZÓN)**
- Filtrar por fecha (últimos 100 días)
- Filtrar por área válida
- Detectar y excluir outliers (IQR)
- Calcular estadísticas (mediana, p25, p75)
- TODO de selección y estratificación va acá

**Paso 1.2: Crear `lib/analyzer.js` (COORDINADOR)**
- Punto de entrada: `analyze(input, listings)`
- Valida entrada
- Delega a ComparableSelector
- Calcula IPR (Índice de Precio Relativo)
- Clasifica veredicto (BAJO/RANGO/SOBRE)
- Calcula confianza
- Genera alertas
- Retorna resultado

**Paso 1.3: Crear `lib/constants.js` (REGLAS)**
- RANGE_AREA: usar CÓDIGOS (APARTAMENTO, CASA, TERRENO), no UUIDs
- DIAS_COMPARABLES: 100
- MIN_COMPARABLES: 3
- IDEAL_COMPARABLES: 15
- OUTLIER_FACTOR: 1.8
- IPR_THRESHOLDS: LOW=0.85, HIGH=1.15
- PRECIOS: MIN=20000, MAX=5000000
- MONEDAS: USD, LPS

**Paso 1.4: Crear `lib/validator.js` (VALIDACIONES)**
- Validar precio (entre $20k y $5M)
- Validar área (mínimo 25m², máximo por tipo)
- Validar tipo (APARTAMENTO, CASA, TERRENO)
- Validar moneda (USD, LPS)

**Paso 1.5: Crear `lib/formatter.js` (FORMATO)**
- Precio con comas ($250,000)
- Precio por m² ($2,083/m²)
- Porcentaje de IPR (-11%, +5%)
- Etiqueta de confianza (BAJA/MEDIA/ALTA)

**Paso 1.6: Actualizar `analizador.html` para usar librerías**
- Import `lib/analyzer.js`
- Import `lib/constants.js`
- Import `lib/formatter.js`
- El HTML SOLO orquesta: recolecta datos → llama analyzer → muestra resultado
- < 300 líneas

**Paso 1.7: Verificar con test-cases**
```bash
node test-runner.js
# Si todos los tests pasan: ✅ FASE 1 exitosa
# Si alguno falla: ❌ Revertir y debuggear
```

**Paso 1.8: Prueba manual en navegador**
- Para cada test-case: ingresa datos, verifica que resultado sea igual a before
- Compara screenshots con originales
- Si coinciden: ✅ OK

**Commit:**
```
FASE 1: Separar lógica de presentación

lib/
  - analyzer.js: COORDINADOR (orquestación final)
  - comparable.js: EXPERTO (seleccionar, filtrar, estadísticas)
  - validator.js: VALIDACIONES
  - formatter.js: FORMATO
  - constants.js: REGLAS (códigos estables, no UUIDs)

CAMBIOS KEY:
  ✅ Comparable.js: TODO lo de filtrado, selección, stats
  ✅ Analyzer.js: SOLO orquestar, no calcular detalles
  ✅ Constants: usar APARTAMENTO/CASA/TERRENO, no UUIDs
  ✅ analizador.html: 200-300 líneas (solo orquestación)

VERIFICACIÓN:
  ✅ Todos test-cases pasaron
  ✅ Screenshots coinciden
  ✅ Analizador funciona idéntico a antes
```

---

### FASE 2: Datos de configuración (1-2 semanas, 4-6 horas)

**Objetivo:** Zonas, colonias, proyectos → JSON, fuera del HTML.

**Qué hacer:**

**Paso 2.1: Exportar de Supabase → JSON**
- [ ] Ejecutar query en Supabase: SELECT * FROM dim_zone
- [ ] Guardar como `data/zones.json`
- [ ] Ejecutar query: SELECT * FROM dim_colonia
- [ ] Guardar como `data/colonias.json`
- [ ] Ejecutar query: SELECT * FROM dim_proyecto
- [ ] Guardar como `data/projects.json`
- [ ] Crear `data/property_types.json` (mapeo CÓDIGO → UUID)

**Paso 2.2: Actualizar `analizador.html` para cargar JSON**
- Import `data/zones.json`, `data/colonias.json`, etc.
- Llenar dropdowns dinámicamente (sin hardcoding)
- Cuando selecciona zona → llenar colonias de esa zona

**Paso 2.3: Verificar con test-cases**
```bash
node test-runner.js
# Todos deben seguir pasando
```

**Paso 2.4: Prueba manual**
- Selecciona zona → se llenan colonias correctas ✅
- Cambias de zona → cambian colonias ✅
- Análisis funciona igual ✅

**Commit:**
```
FASE 2: Datos de configuración en JSON

data/
  - zones.json: 52 zonas
  - colonias.json: 60 colonias
  - projects.json: 32 proyectos
  - property_types.json: mapeo CÓDIGO → UUID

analizador.html carga datos dinámicamente (sin hardcoding)

VERIFICACIÓN:
  ✅ Dropdowns se llenan correctamente
  ✅ Analizador sigue funcionando igual
  ✅ Todos test-cases pasan
```

---

### FASE 3: Componentes visuales (3-4 semanas, 10-12 horas)

**Objetivo:** HTML modular, reutilizable, sin caos.

**NOTA:** Solo después de FASE 1 y 2. Espera a que esté claro cómo importar.

**Qué hacer:**
- [ ] Crear `components/AnalysisSummary.html` (gauge + veredicto)
- [ ] Crear `components/PriceCard.html` (precio usuario, m², IPR)
- [ ] Crear `components/ConfidenceIndicator.html` (score visual)
- [ ] Crear `components/ComparableTable.html` (tabla comparables)
- [ ] Crear `components/MarketRangeChart.html` (gráfico p25/med/p75)
- [ ] Crear `components/MapPanel.html` (Leaflet interactivo)
- [ ] Actualizar `analizador.html` para usar componentes

**Commit:**
```
FASE 3: Componentes HTML modulares

components/
  - AnalysisSummary.html
  - PriceCard.html
  - ConfidenceIndicator.html
  - ComparableTable.html
  - MarketRangeChart.html
  - MapPanel.html

analizador.html: 150-200 líneas (solo orquestación)

VERIFICACIÓN:
  ✅ Componentes reutilizables
  ✅ Cambios visuales sin tocar analizador.html
  ✅ Todos test-cases pasan
```

---

## TIMELINE

| Semana | FASE | Horas | Resultado |
|---|---|---|---|
| 1 | 0: Congelar | 2-3 | Test-cases + comportamiento documentado |
| 2-3 | 1A: Comparable.js | 4-6 | Lógica de selección extraída |
| 3-4 | 1B: Analyzer.js | 4-6 | Coordinador + validator + formatter |
| 5 | 2: Datos JSON | 4-6 | Zonas/colonias/proyectos en JSON |
| 6-8 | 3: Componentes | 10-12 | HTML modular |
| 9 | Buffer | — | Fixes, optimizaciones, validación final |

---

## RESULTADO FINAL

✅ **Código profesional** (modular, limpio)  
✅ **Zero dinero gastado**  
✅ **Cero cambios visuales** (usuario no nota diferencia)  
✅ **100% funcional** (igual que antes)  
✅ **Documentado**  
✅ **Testeado**  
✅ **Listo para escalar gradualmente**  

---

## PRÓXIMOS PASOS DESPUÉS (SI QUIERES)

- **FASE 4:** Tests automáticos (Vitest)
- **FASE 5:** Documentación técnica completa
- **FASE 6:** Dashboard simple (estadísticas)
- **FUTURE:** Migración a Next.js/React (si necesitas)

---

## REGLA DE ORO

**Si después de cada commit el analizador NO funciona exactamente como antes, REVERTIR INMEDIATAMENTE.**

No hay "deuda" aceptable. No hay "lo arreglamos después".

**Cada commit = analizador funcionando.**

---
