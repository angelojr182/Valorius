# 🔴 RIESGOS DE SEGURIDAD ABIERTOS

**Fecha:** 2026-06-11  
**Status:** PENDIENTE — NO CERRADO

---

## 1. Exposición de core.listing al rol anon

**Severidad:** 🔴 ALTA

**Problema:**
- El rol `anon` (usuarios sin autenticar) puede leer la tabla `core.listing` completa
- Esto expone: precios, ubicaciones, características de TODAS las propiedades
- No hay restricción por filas (RLS) actualmente

**Cambios realizados en PHASE 2 (2026-06-11):**
- ✅ Vista `core.v_public_comparables` creada (datos limitados + públicos)
- ❌ RLS bloqueó anon completamente → rompió analizador.html
- ✅ Reverted: `ALTER TABLE core.listing DISABLE ROW LEVEL SECURITY`
- ✅ Reverted: Ejecutados GRANT SELECT para permitir anon acceso temporal

**Estado actual:**
- anon PUEDE leer `core.listing` (sin restricción)
- analizador.html funciona (pero sin seguridad)
- Vista `core.v_public_comparables` existe pero NO se usa

**Solución correcta (PENDIENTE):**
1. Crear RLS policy que PERMITA a anon leer listing (no bloquearlo completamente)
2. Implementar filtros por fila (ej: solo propiedades con `calidad_dato != 'BAJA'`)
3. O migrar analizador.html a usar `v_public_comparables` con estructura correcta
4. Verificar cada cambio antes de aplicarlo

**Riesgo de NO arreglar:**
- ⚠️ Competencia puede leer precios/ubicaciones completos
- ⚠️ Scraping masivo de datos
- ⚠️ Pérdida de ventaja competitiva
- ⚠️ Violación de privacidad de propiedades

**Riesgo de arreglar mal (como en PHASE 2):**
- ⚠️ Romper analizador.html (requiere tester manual)
- ⚠️ No poder revertir cambios (sin acceso a psql)
- ⚠️ Dejar BD en estado incierto

**Acción requerida:**
- [ ] Diseñar RLS policy correcta (sin romper analizador)
- [ ] Crear plan reversible con pasos verificables
- [ ] Documentar cambios antes de aplicar
- [ ] Verificar con anon key después de cada cambio

---

## 2. Otros riesgos abiertos

(Agregar conforme se descubran)

---

**No continuar con cambios de seguridad hasta que esta exposición esté CERRADA Y VERIFICADA.**
