# PHASE 3 Verification Checklist

**Objetivo:** Asegurar que cada componente es sólido antes de pasar al siguiente.

---

## PHASE 3-B: PriceCard ✅ PENDIENTE VERIFICACIÓN

### 1. ✅ Analizador sigue dando mismo resultado
- [ ] Abrir analizador.html en navegador
- [ ] Llenar formulario con valores de prueba (ej: Apartamento, San Ignacio, 120m², $250k)
- [ ] Comparar resultado visual CON versión anterior (sin PriceCard)
- [ ] Los números (IPR, mediana, precio/m², etc.) deben ser IDÉNTICOS
- [ ] No debe haber cambios en el veredicto (BAJO/RANGO/SOBRE)

### 2. ✅ PriceCard NO calcula mediana ni clasificación
- [ ] Revisar código: PriceCard.js solo tiene `render()` y `mount()`
- [ ] ✅ Confirmado: No hace cálculos, solo presenta props
- [ ] Los props vienen ya calculados desde motor (analizador.html)
- [ ] No hay `Math.` para IPR, p25, p75, etc. en PriceCard

### 3. ✅ PriceCard maneja valores nulos/undefined sin romper
- [ ] Código tiene validación: `if (!props)`
- [ ] Código tiene fallbacks: `|| 0` para cada prop
- [ ] Probar: Abrir consola y llamar `PriceCard.render(null)` → debe devolver error HTML limpio
- [ ] Probar: `PriceCard.render({})` → debe devolver valores por defecto

### 4. ✅ En móvil se ve bien
- [ ] Abrir analizador.html en móvil (F12 → responsive design mode)
- [ ] Probar breakpoint 640px (tablet/móvil)
- [ ] Verificar:
  - [ ] Texto se ajusta sin overflow
  - [ ] Estilos de fuente son legibles
  - [ ] Bordes y colores están presentes
  - [ ] Números no se cortan

### 5. ✅ No duplica estilos de analizador.css
- [ ] Buscar en `analizador.css` clases `.pc-` → debe estar VACÍO
- [ ] Buscar en `analizador.css` clases `.price-card` → debe estar VACÍO
- [ ] Todas las clases de PriceCard viven SOLO en `components/components.css`
- [ ] Si hay duplicación, eliminar de analizador.css y dejar en components/components.css

---

## PHASE 3-C: AnalysisSummary (pendiente — después de verificar 3-B)

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
- Estado: ✅ Código listo, pendiente verificación manual
- Riesgo: BAJO (solo presentación)
- Next step: Ejecutar checklist 1-5 arriba
- Decision: AVANZAR a PHASE 3-C solo si todos los puntos pasan

**Bloqueos conocidos:**
- 🔴 SECURITY_RISKS_OPEN: core.listing expuesto a anon (NO tocar Supabase)
- 🟡 Sin cambios en analizador.html lógica (vuela seguro)

---

**Actualizar este checklist conforme se verifica cada punto.**
