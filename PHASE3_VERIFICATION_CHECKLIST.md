# PHASE 3 Verification Checklist

**Objetivo:** Asegurar que cada componente es sólido antes de pasar al siguiente.

---

## PHASE 3-B: PriceCard — COMPONENTE VALIDADO, INTEGRACIÓN PENDIENTE

### 1. Analizador mantiene su resultado actual
- [x] Abrir `analizador.html` en navegador
- [x] Llenar formulario con valores de prueba (ej: Apartamento, San Ignacio, 120m², $250k)
- [x] Comparar resultado visual con la versión anterior
- [x] Los números (IPR, mediana, precio/m², etc.) permanecen idénticos
- [x] No hay cambios en el veredicto (BAJO/RANGO/SOBRE)

### 2. PriceCard es presentación, no motor de negocio
- [x] `PriceCard.js` expone `render()`, `mount()` y `update()`
- [x] No calcula métricas de negocio como IPR, mediana, P25, P75 o comparables
- [x] Las operaciones `Math.*` existentes son únicamente de presentación/formateo
- [x] El contrato documentado recibe datos ya calculados por el motor

### 3. PriceCard maneja valores nulos/undefined sin romper
- [x] Código tiene validación: `if (!props)`
- [x] Código tiene fallbacks: `|| 0` para cada prop utilizado
- [x] `PriceCard.render(null)` devuelve error HTML limpio
- [x] `PriceCard.render({})` devuelve valores por defecto
- [x] `PriceCard.render()` con valores reales devuelve HTML válido

### 4. En móvil se ve bien
- [x] Verificado en breakpoint de 640px
- [x] Texto sin overflow
- [x] Fuentes legibles
- [x] Bordes y colores presentes
- [x] Números no se cortan

### 5. No duplica estilos de analizador.css
- [x] Las clases `.pc-*` pertenecen a `components/components.css`
- [x] La clase `.price-card` pertenece a `components/components.css`
- [x] No se creó una segunda definición de PriceCard en `analizador.css`

### 6. Integración con el Analyzer — DELIBERADAMENTE PENDIENTE
- [x] Confirmado que `PriceCard.js` está cargado en el Analyzer
- [x] Confirmado que `PriceCard` está disponible en navegador
- [x] Confirmado que `PriceCard.mount()` funciona en un contenedor controlado
- [ ] `PriceCard.js` NO se fuerza dentro del flujo productivo actual
- [ ] La tarjeta productiva actual sigue siendo `renderPriceCard(data)`
- [ ] No se reemplaza la tarjeta actual hasta diseñar una migración que preserve gauge, métricas, rangos y comportamiento existente

**Decisión arquitectónica:** No integrar `PriceCard.js` únicamente para marcar la fase como completa. El Analyzer actual ya posee una implementación productiva de la tarjeta que además controla gauge, mediana, rango, umbrales y estado de referencia. Forzar una segunda implementación produciría duplicación o exigiría modificar `analizador.html` sin una ganancia funcional inmediata.

La estrategia segura es mantener `PriceCard.js` como componente modular validado y realizar su integración durante una refactorización de presentación explícita, con pruebas de regresión antes de sustituir la implementación existente.

---

## PHASE 3-C: AnalysisSummary (pendiente — después de cerrar 3-B)

**Precaución:** Este componente es más delicado porque:
- Toca veredicto (BAJO/RANGO/SOBRE) — lógica sensible
- Incluye gauge SVG — cálculos de ángulos/posiciones
- Es el "bloque principal" de resultados

Requerimientos especiales:
1. SVG debe renderizarse sin errores
2. Gauge debe mostrar IPR correctamente
3. NO debe modificar el cálculo de IPR
4. Debe validar datos antes de dibujar

---

## Resumen ejecutivo

**PHASE 3-B (PriceCard):**
- Estado: COMPONENTE VALIDADO / INTEGRACIÓN PENDIENTE
- Riesgo actual: BAJO (componente aislado de presentación)
- Verificación completada: render, mount, valores nulos, valores reales, responsive y aislamiento CSS
- Integración productiva: pendiente de una refactorización de presentación controlada
- Next step: documentar y aprobar la arquitectura antes de sustituir `renderPriceCard()`
- Decision: NO avanzar a una integración forzada solo para cerrar la fase

**Bloqueos conocidos:**
- 🔴 SECURITY_RISKS_OPEN: core.listing expuesto a anon (NO tocar Supabase)
- 🔴 `SECRETS.SKEY` permanece expuesto en frontend y debe tratarse como riesgo crítico si corresponde a una clave privilegiada; no se modifica como parte de PHASE 3-B
- 🟡 Sin cambios en lógica del Analyzer para forzar la integración de PriceCard

**Criterio de seguridad:** Ningún cambio de PHASE 3-B debe relajar RLS, exponer nuevas credenciales, ampliar permisos ni introducir datos sensibles en el cliente.

---

**Actualizar este checklist conforme se verifiquen nuevos puntos.**
