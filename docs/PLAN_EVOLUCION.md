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

**Paso 1.6: Actualizar `analizador.html` para usar librerías (ORIGINAL)**
- Import `lib/analyzer.js`
- Import `lib/constants.js`
- Import `lib/formatter.js`
- El HTML SOLO orquesta: recolecta datos → llama analyzer → muestra resultado
- < 300 líneas
- ✅ Auth integrado (2026-06-11): /login/ centralizado, POST form, sin credenciales en URL

**Paso 1.7: Verificar con test-cases (ORIGINAL)**
```bash
node test-runner.js
# Si todos los tests pasan: ✅ FASE 1 exitosa
# Si alguno falla: ❌ Revertir y debuggear
```

**Paso 1.8: Prueba manual en navegador (ORIGINAL)**
- Para cada test-case: ingresa datos, verifica que resultado sea igual a before
- Compara screenshots con originales
- Si coinciden: ✅ OK

**Paso 1.9: Auditoría de Principios (NUEVO — bloqueantes)**
- [ ] Medir Lighthouse (FCP < 1.5s, TTI < 3s, score > 80)
- [ ] Documentar "extension points" en `docs/EXTENSION_GUIDE.md`
  - Cómo agregar nuevo tipo de propiedad
  - Cómo agregar nuevo filtro
  - Cómo agregar nuevo componente
- [ ] Validar que test-cases pasen CON la nueva auth
- [ ] Verificar seguridad: credenciales NO en logs, NO en URL, NO en localStorage sin cipher

**Paso 1.10: Validar Desacoplamiento (NUEVO — refuerzo)**
- [ ] Verificar: Cambiar constants.js NO rompe tests ✓
- [ ] Verificar: Remover /login/ NO rompe analizador (solo no autentica) ✓
- [ ] Verificar: Agregar nuevo componente NO afecta lib/ ✓

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

### FASE 2: Datos de configuración + Resiliencia (1-2 semanas, 6-8 horas)

**Objetivo:** Zonas, colonias, proyectos → JSON. Agregar fallbacks ante fallos.

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

**Paso 2.3: Auditoría de Resiliencia (NUEVO — refuerzo)**
- [ ] Cachear listings en localStorage al primer load exitoso
- [ ] Si fetch falla → usar datos de caché (modo degradado)
- [ ] Mostrar banner "Modo offline — datos cacheados"
- [ ] Optimizar sesión caching: no revalidar en cada load, solo si token expira
- [ ] Validar: Si Supabase down 5 min → analizador sigue funcionando ✓

**Paso 2.4: Verificar con test-cases**
```bash
node test-runner.js
# Todos deben seguir pasando
```

**Paso 2.5: Prueba manual**
- Selecciona zona → se llenan colonias correctas ✅
- Cambias de zona → cambian colonias ✅
- Análisis funciona igual ✅
- (BONUS) Desactiva WiFi → analizador funciona con caché ✅

**Paso 2.6: Auditoría de Reutilización (NUEVO — refuerzo)**
- [ ] Crear `docs/REUTILIZABLE.md` (qué módulos pueden usar cada librería)
  - formatter.js → PDF, email, APIs
  - comparable.js → analytics, historial, alertas
  - analyzer.js → dashboard, reporting, exports
- [ ] Documentar sem-versioning (v1.0 compatible con ...)
- [ ] Verificar: Dashboard futuro puede usar lib/ sin copiar código ✓

**Paso 2.7: Auditoría de Escalabilidad (NUEVO — refuerzo)**
- [ ] Verificar: Agregar 1000 listings más → ¿impacto performance?
- [ ] Verificar: Cacheing de JSON → bundle size aceptable?
- [ ] Documentar: "A 10k usuarios, agregar load balancer aquí"

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

### FASE 3: Componentes visuales + Auditoría (3-4 semanas, 12-14 horas)

**Objetivo:** HTML modular, reutilizable, sin caos.

**NOTA:** Solo después de FASE 1 y 2. Espera a que esté claro cómo importar.

**Estado actual:** 3/6 componentes completos (ConfidenceIndicator, PriceCard, AnalysisSummary)

**Qué hacer:**

**Paso 3.1: Terminar componentes faltantes**
- [ ] Crear `components/ComparableTable.html` (tabla comparables)
- [ ] Crear `components/MarketRangeChart.html` (gráfico p25/med/p75)
- [ ] Crear `components/MapPanel.html` (Leaflet interactivo)
- [ ] Actualizar `analizador.html` para usar todos los componentes

**Paso 3.2: Auditoría de Extensibilidad (REFORZADA)**
- [ ] Verificar: ¿Podemos agregar nuevo componente sin romper existentes?
- [ ] Verificar: ¿Puedo extender ConfidenceIndicator sin editar el módulo? (plugin pattern)
- [ ] Documentar patrón de componentes (props → render)
- [ ] Crear `docs/COMPONENT_PATTERN.md` con ejemplos
- [ ] Validar: Agregar 3 componentes nuevos NO requiere refactoring ✓

**Paso 3.3: Auditoría de Performance (REFORZADA)**
- [ ] Re-medir Lighthouse (debe mantener score > 80)
- [ ] Verificar bundle size con 6 componentes (< 100KB gzip)
- [ ] Lazy load componentes grandes (MapPanel) si necesario
- [ ] Validar: Agregar 6 componentes NO aumentó FCP > 0.5s ✓
- [ ] Benchmarking: Renderizar 1000 comparables → tiempo aceptable ✓

**Paso 3.4: Verificar con test-cases**
```bash
node test-runner.js
# Todos deben seguir pasando
```

**Paso 3.5: Prueba manual**
- Todos los componentes rendean correctamente ✅
- Interacciones funcionan (hover, click) ✅
- Responsive en móvil ✅
- Análisis funciona igual que antes ✅

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

### FASE 4: Seguridad + Auditoría final (1-2 semanas, 4-6 horas) — VPS only

**Objetivo:** Preparar para VPS. Auditoría final de principios.

**Nota:** GitHub Pages no permite custom headers. Hacer cuando migres a VPS (8-12 meses).

**Qué hacer:**

**Paso 4.1: Seguridad (VPS)**
- [ ] Agregar CSP headers (bloquear XSS)
- [ ] Cambiar localStorage → httpOnly cookies
- [ ] Rate limiting en /login/ (Supabase)
- [ ] Auditoría de CORS

**Paso 4.2: Performance (Final)**
- [ ] Medir Lighthouse final (score > 80)
- [ ] Verificar bundle gzip < 100KB
- [ ] Tests de carga (load testing)

**Paso 4.3: Documentación final**
- [ ] Actualizar REUTILIZABLE.md
- [ ] Crear SECURITY.md (qué está protegido, cómo)
- [ ] Crear EXTENSION_GUIDE.md (cómo agregar features)

**Paso 4.4: Preparar para producción VPS**
- [ ] Environment variables (.env)
- [ ] Docker setup (opcional pero recomendado)
- [ ] CI/CD pipeline (GitHub Actions)

---

## TIMELINE ACTUALIZADO (Plan original + Auditoría integrada)

| Semana | FASE | Horas | Resultado | Status |
|---|---|---|---|---|
| 1 | 0: Congelar | 2-3 | Test-cases + baseline | ✅ |
| 2-3 | 1A: Comparable.js | 4-6 | Lógica de selección | ✅ |
| 3-4 | 1B: Analyzer.js + Auth | 6-8 | Coordinador + auth | ✅ |
| 5 | 1.6-1.8: Refactor HTML + tests | 2-3 | Integración librerías + validación | ⏳ NEXT |
| 5 | 1.9-1.10: Auditoría PHASE 1 | 4-5 | Lighthouse + docs + desacoplamiento | ⏳ NEXT |
| 6 | 2: Datos JSON + Resiliencia | 7-9 | JSON + caché + fallback + reutilizable | 🔜 |
| 7-9 | 3: Componentes + Auditoría | 14-16 | 6 componentes + extensibilidad + performance | 🔜 |
| 10 | 4: Seguridad VPS | 4-6 | CSP + rate limit + httpOnly | 🔜 (VPS) |
| 11 | Buffer | — | Fixes, optimizaciones, docs final | 🔜 |

---

## RESULTADO FINAL

✅ **Código profesional** (modular, limpio)  
✅ **Zero dinero gastado**  
✅ **Cero cambios visuales** (usuario no nota diferencia)  
✅ **100% funcional** (igual que antes)  
✅ **Documentado** (extension guides, reutilización)  
✅ **Testeado** (test-cases + Lighthouse)  
✅ **Seguro** (defensa en profundidad)  
✅ **Resiliente** (fallbacks, caché)  
✅ **Escalable** (sin rediseño hasta 10k usuarios)  
✅ **Listo para VPS** (8-12 meses)  

---

## AUDITORÍA DE PRINCIPIOS (Integrada en cada FASE)

| Principio | FASE 1 (1.6-1.10) | FASE 2 | FASE 3 | FASE 4 |
|-----------|-----------|--------|--------|--------|
| 1. Escalabilidad | Refactor ✓ | 1000 listings test | Componentes scale | Load test |
| 2. Disponibilidad | Auth integrado | Caché fallback ✓ | — | — |
| 3. Performance | Lighthouse medir | Optimizar | Re-medir + bench | Final audit |
| 4. Seguridad | Creds safe ✓ | — | — | CSP + httpOnly |
| 5. Desacoplamiento | Validar ✓ | ✓ | ✓ | ✓ |
| 6. Extensibilidad | Extension guide | Inventario | Pattern doc + test | Full guide |
| 7. Reutilización | Verificar | Inventario ✓ | Dashboard compat | Docs final |

**Clave:** Cada fase valida 1-2 principios a fondo. No es "listo" hasta que TODOS pasen auditoría en su fase.

---

## PRÓXIMOS PASOS DESPUÉS (OPCIONAL)

- **FASE 5:** Dashboard (React/Vue) + integración analizador
- **FASE 6:** Tests automáticos (Vitest)
- **FASE 7:** Reporting + exportación (PDF, Excel)
- **FUTURE:** Migración a Next.js (si necesitas SSR/API)

---

## REGLA DE ORO

**Si después de cada commit el analizador NO funciona exactamente como antes, REVERTIR INMEDIATAMENTE.**

No hay "deuda" aceptable. No hay "lo arreglamos después".

**Cada commit = analizador funcionando.**

---
