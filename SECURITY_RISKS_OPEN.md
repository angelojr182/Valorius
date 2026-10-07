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


---

## ACTUALIZACIÓN DE AUDITORÍA — 2026-10-07

La situación descrita arriba corresponde a un estado histórico y ya no representa el estado actual de producción.

### 1. `core.listing` / `core.property`

Estado actual verificado:
- RLS habilitado.
- Acceso SELECT de `anon` revocado.
- INSERT de `anon` revocado.
- El Analyzer opera con JWT de usuario en `Authorization: Bearer <access_token>` y mantiene la anon/publishable key únicamente como `apikey`.
- No se debe reabrir `anon` para resolver errores de frontend.

### 2. Hallazgos nuevos que requieren tratamiento

**Alta prioridad — credenciales GitHub expuestas en Edge Functions**
- `github-deploy` v9 contiene una credencial GitHub embebida en el código y tiene capacidad de modificar archivos de `main`.
- `github-push` v13 contiene otra credencial GitHub embebida en el código y también puede escribir en `main`.
- Ambas funciones tienen `verify_jwt=false`.
- No se encontró referencia a estos slugs en el árbol actual del repositorio ni en el workflow de scraper revisado.
- Esto no demuestra ausencia de consumidores externos; por esa razón las funciones NO se desactivan ni eliminan todavía.
- Acción requerida: identificar consumidores externos, rotar/revocar las credenciales expuestas y migrar cualquier credencial necesaria a Secrets antes de retirar o modificar las funciones.

**Alta prioridad — `scraper-webhook` v9**
- Usa una anon key embebida en el código y realiza inserciones directas en `core.property` y `core.listing`.
- Su flujo es incompatible con el endurecimiento que revocó INSERT para `anon`.
- El workflow actual `.github/workflows/scraper_rentify.yml` no invoca esta función; actualmente el scraper corre manualmente y recibe sus credenciales mediante GitHub Actions Secrets.
- No se debe eliminar la función sin confirmar si existe un consumidor externo.

**Media/alta prioridad — `ingesta-ui` v12 / `ingesta.html`**
- `ingesta-ui` es una UI servida por Edge Function pero contiene lógica antigua que intenta insertar usando la anon key.
- `ingesta.html` también mantiene inserción REST directa y actualmente construye `Authorization` con la anon key.
- El acceso directo ya no es un camino válido después del endurecimiento de RLS.
- La corrección debe usar una sesión autenticada o un backend protegido; no se debe reabrir INSERT para `anon`.
- Existe `rapid-handler`/ `insert-listing` con `verify_jwt=true`, pero su versión desplegada usa nombres de campos antiguos y debe alinearse con el esquema actual antes de convertirlo en la vía de ingesta.

### 3. Edge Functions que permanecen activas por dependencia potencial

No se desactivaron automáticamente:
- `update-exchange-rate`
- `generar-snapshot`
- `territory-context`
- `valorius-ai-prototype`
- `github-deploy`
- `github-push`
- `scraper-webhook`
- `ingesta-ui`
- `rapid-handler`

La regla aplicada es: evidencia → dependencia → impacto → cambio mínimo → validación.

### 4. Estado de GIS

`territory-context` está activo y protegido con JWT. Su backend ya devuelve `territory_gis`, pero la implementación visible del Analyzer todavía no muestra evidencia de un bloque de contexto GIS en pantalla. Esto debe tratarse como trabajo pendiente de presentación, sin alterar la lógica determinista de precio, comparables o clasificación.

### 5. Nota sobre Security Advisor

Persisten hallazgos que requieren reconciliación antes de cerrar la auditoría:
- RLS enabled without policies en tablas internas.
- `core.spatial_ref_sys` con RLS deshabilitado.
- Advertencias sobre `st_estimatedextent`.
- Protección contra contraseñas filtradas deshabilitada.

Las revocaciones de privilegios sobre las tablas internas ya fueron verificadas directamente. Las advertencias de `st_estimatedextent` requieren una validación específica de privilegios antes de afirmar que están resueltas.

### 6. Regla de no eliminación

Ninguna función, tabla, vista o flujo se considerará obsoleto únicamente por su apariencia o por no tener referencias en el repositorio. Antes de desactivar o eliminar se debe comprobar dependencia externa, propósito y efecto sobre producción.
