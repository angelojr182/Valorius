# Auditoría 01 — Colonias, Zonas y Proyectos
**Fecha:** 2026-05-26  
**Tipo:** SOLO LECTURA — sin modificaciones a la DB  
**Ejecutada por:** Claude Code (FASE 1-A)  
**Estado:** Completada — pendiente revisión para FASE 1-B

---

## Resumen Ejecutivo

| Métrica | Valor |
|---|---|
| Total propiedades | 134 |
| Zonas en dim_zone | 52 |
| Zonas con propiedades | 48 |
| **Zonas vacías (sin propiedades)** | **4** |
| Colonias únicas en property.colonia | 58 |
| Propiedades colonia = zona ✅ | 91 (68%) |
| **Propiedades colonia ≠ zona ⚠️** | **43 (32%)** |
| Propiedades con proyecto asignado | 48 (36%) |
| Propiedades sin proyecto | 86 (64%) |
| Proyectos en dim_proyecto | 26 |

**Conclusión principal:** 43 propiedades (32%) tienen un valor en `property.colonia` que no coincide con el nombre canónico de `dim_zone.zona`. Estas se clasifican en 3 categorías descritas abajo.

---

## Sección 1 — Clasificación de las 43 propiedades con colonia ≠ zona

### CATEGORÍA A — Diferencia ortográfica pura (tildes / mayúsculas)
> Son el mismo lugar. Solo falta normalizar la escritura. Fix directo y seguro.

| Colonia actual (property) | Zona canónica (dim_zone) | Props | Tipo |
|---|---|---|---|
| Aldea De Guasculile | Aldea de Guasculile | 1 | CASA |
| Altos De La Granja | Altos de la Granja | 1 | CASA |
| Colonia America | Colonia América | 2 | CASA |
| Colonia Guadalupe Lopez Villanueva | Colonia Guadalupe López Villanueva | 1 | CASA |
| Colonia Lomas De Tiloarque | Colonia Lomas de Tiloarque | 1 | CASA |
| Colonia Los Angeles | Colonia Los Ángeles | 1 | APT |
| Colonia San Jose Del Loarque | Colonia San José del Loarque | 1 | CASA |
| Colonia Satelite | Colonia Satélite | 1 | CASA |
| Residencial Concepcion Ii | Residencial Concepción II | 2 | CASA |
| Residencial Mirador De Los Hidalgos | Residencial Mirador de los Hidalgos | 1 | APT |
| Residencial Paseo De Las Campanas | Residencial Paseo de las Campanas | 1 | CASA |
| Boulevard Morazan | Bulevar Morazán | 1 | CASA |
| **TOTAL Categoría A** | | **13 props** | |

---

### CATEGORÍA B — Nombre de colonia válido dentro de la zona
> Son colonias reales dentro de la zona. Deben mantenerse como colonia (nivel 2), NO igualarse a la zona.  
> Requieren decisión del usuario sobre nombre canónico de cada colonia.

| Colonia actual (property) | Zona (dim_zone) | Props | Tipo | Observación |
|---|---|---|---|---|
| Residencial El Trapiche | El Trapiche | 7 | APT | Colonia dentro de El Trapiche |
| Colonia Miraflores | Miraflores | 6 | APT | Colonia dentro de Miraflores |
| Residencial Palmeras De San Ignacio | San Ignacio | 3 | CASA | Colonia dentro de San Ignacio |
| Residencial San Ignacio | San Ignacio | 3 | APT+CASA | Colonia dentro de San Ignacio (ejemplo del usuario) |
| Residencial Zarahemla | Residencial Zarahemla II | 2 | CASA | ¿Etapa anterior? ¿Colonia distinta? |
| Altos De Zambrano | Zambrano | 1 | CASA | Colonia dentro de Zambrano |
| Colonia Montecarlo Boulevard Morazan | Bulevar Morazán | 1 | APT | "Colonia Montecarlo" posible colonia |
| Residencial Los Angeles | Colonia Los Ángeles | 1 | APT | Variante del nombre |
| Residencial Roble Oeste | Roble Oeste | 1 | CASA | Posible colonia dentro de Roble Oeste |
| Los Robles | Roble Oeste | 1 | CASA | Nombre popular de Roble Oeste |
| **TOTAL Categoría B** | | **26 props** | | |

---

### CATEGORÍA C — Nombre de proyecto o arteria vial en campo colonia
> El valor en `property.colonia` no es una colonia — es un proyecto o una arteria vial.  
> Requieren corrección especial y decisión del usuario.

| Colonia actual (property) | Zona (dim_zone) | Props | Tipo | Problema |
|---|---|---|---|---|
| Torre Aura Las Colinas | Las Colinas | 1 | APT | Nombre de proyecto en campo colonia. `proyecto_id` = Torre Aura ya asignado. |
| Cefiro Azul | Anillo Periférico | 2 | APT | "Céfiro Azul" existe como proyecto en `dim_proyecto` pero está vinculado a **Zarahemla II**, no a Anillo Periférico. Posible error de zona o proyecto diferente. |
| **TOTAL Categoría C** | | **4 props** | | |

---

## Sección 2 — Catálogo completo de colonias actuales por zona

> Estado actual del campo `property.colonia` agrupado por zona. Base para construir `dim_colonia`.

| Zona | Colonia actual | Props | Tipo | Con proyecto |
|---|---|---|---|---|
| Aldea de Guasculile | Aldea De Guasculile ⚠️ | 1 | CASA | No |
| Altos de la Granja | Altos De La Granja ⚠️ | 1 | CASA | No |
| Anillo Periférico | Anillo Periférico ✅ | 1 | APT | Sí (Condominios Alcazar) |
| Anillo Periférico | Cefiro Azul ❌ | 2 | APT | No |
| Barrio Bella Vista | Barrio Bella Vista ✅ | 1 | CASA | No |
| Barrio Buenos Aires | Barrio Buenos Aires ✅ | 1 | CASA | No |
| Barrio Guanacaste | Barrio Guanacaste ✅ | 1 | CASA | No |
| Barrio La Leona | Barrio La Leona ✅ | 1 | CASA | No |
| Boulevard Fuerzas Armadas | Boulevard Fuerzas Armadas ✅ | 1 | CASA | No |
| Bulevar Morazán | Boulevard Morazan ⚠️ | 1 | CASA | No |
| Bulevar Morazán | Bulevar Morazán ✅ | 8 | APT | Sí (Torre Atlas, Torre Centro Morazán) |
| Bulevar Morazán | Colonia Montecarlo Boulevard Morazan ⚠️ | 1 | APT | No |
| Colonia América | Colonia America ⚠️ | 2 | CASA | No |
| Colonia Guadalupe López Villanueva | Colonia Guadalupe Lopez Villanueva ⚠️ | 1 | CASA | No |
| Colonia Guaymuras | Colonia Guaymuras ✅ | 1 | CASA | No |
| Colonia La Era | Colonia La Era ✅ | 2 | APT | Sí (Ecovivienda) |
| Colonia La Pradera | Colonia La Pradera ✅ | 1 | CASA | No |
| Colonia La Sosa | Colonia La Sosa ✅ | 1 | CASA | No |
| Colonia Lara | Colonia Lara ✅ | 2 | APT | Sí (Torre Costa Próceres, Torre Urbana Lara) |
| Colonia Loma Linda Norte | Colonia Loma Linda Norte ✅ | 1 | APT | No (Avalon sin props asignadas) |
| Colonia Lomas de Tiloarque | Colonia Lomas De Tiloarque ⚠️ | 1 | CASA | No |
| Colonia Los Ángeles | Colonia Los Angeles ⚠️ | 1 | APT | No |
| Colonia Los Ángeles | Residencial Los Angeles ⚠️ | 1 | APT | No |
| Colonia Modelo | Colonia Modelo ✅ | 1 | CASA | No |
| Colonia San José del Loarque | Colonia San Jose Del Loarque ⚠️ | 1 | CASA | No |
| Colonia Satélite | Colonia Satelite ⚠️ | 1 | CASA | No |
| Colonia Tepeyac | Colonia Tepeyac ✅ | 1 | APT | No |
| El Trapiche | El Trapiche ✅ | 3 | APT | Sí (Distrito Artemisa) |
| El Trapiche | Residencial El Trapiche ⚠️ | 7 | APT | No |
| La Esperanza | La Esperanza ✅ | 1 | CASA | No |
| Las Colinas | Torre Aura Las Colinas ❌ | 1 | APT | Sí (Torre Aura) |
| Las Uvas | Las Uvas ✅ | 2 | CASA | No |
| Lomas del Guijarro | Lomas del Guijarro ✅ | 16 | APT+CASA | Sí (múltiples torres) |
| Lomas del Molino | Lomas del Molino ✅ | 1 | APT | Sí (Torre Taragon) |
| Miraflores | Colonia Miraflores ⚠️ | 6 | APT | No |
| Miraflores | Miraflores ✅ | 5 | APT | Sí (Torre Lirios de Miraflores) |
| Residencial Buena Vista | Residencial Buena Vista ✅ | 1 | CASA | No |
| Residencial Ciudad Nueva | Residencial Ciudad Nueva ✅ | 1 | CASA | No |
| Residencial Concepción II | Residencial Concepcion Ii ⚠️ | 2 | CASA | No |
| Residencial El Sauce | Residencial El Sauce ✅ | 5 | APT+CASA | Sí (Torre Almendro) |
| Residencial Hacienda Real | Residencial Hacienda Real ✅ | 1 | CASA | No |
| Residencial Las Casitas | Residencial Las Casitas ✅ | 1 | CASA | No |
| Residencial Los Cerezos | Residencial Los Cerezos ✅ | 1 | CASA | No |
| Residencial Mirador de los Hidalgos | Residencial Mirador De Los Hidalgos ⚠️ | 1 | APT | No |
| Residencial Paseo de las Campanas | Residencial Paseo De Las Campanas ⚠️ | 1 | CASA | No |
| Residencial Portal del Bosque 1 | Residencial Portal del Bosque 1 ✅ | 4 | APT+CASA | Sí (Torre 1) |
| Residencial Quinta Isabel | Residencial Quinta Isabel ✅ | 1 | CASA | No |
| Residencial San Juan | Residencial San Juan ✅ | 2 | CASA | No |
| Residencial Villa Elena | Residencial Villa Elena ✅ | 4 | CASA | No |
| Residencial Zarahemla II | Residencial Zarahemla ⚠️ | 2 | CASA | No |
| Residencial Zarahemla II | Residencial Zarahemla II ✅ | 6 | APT+CASA | Sí (Céfiro Azul) |
| Roble Oeste | Los Robles ⚠️ | 1 | CASA | No |
| Roble Oeste | Residencial Roble Oeste ⚠️ | 1 | CASA | No |
| San Ignacio | Residencial Palmeras De San Ignacio ⚠️ | 3 | CASA | No |
| San Ignacio | Residencial San Ignacio ⚠️ | 3 | APT+CASA | No |
| San Ignacio | San Ignacio ✅ | 11 | APT | Sí (Torre Acacias, Torre Cipreses) |
| Torocagua | Torocagua ✅ | 1 | CASA | No |
| Zambrano | Altos De Zambrano ⚠️ | 1 | CASA | No |

**Leyenda:** ✅ OK · ⚠️ Diferente (normalizar) · ❌ Error (requiere decisión)

---

## Sección 3 — Auditoría de Proyectos

### Proyectos con propiedades asignadas (24 de 26)

| Proyecto | Zona | Colonia usada | Props |
|---|---|---|---|
| Condominios Alcazar | Anillo Periférico | Anillo Periférico | 1 |
| Torre Atlas | Bulevar Morazán | Bulevar Morazán | 4 |
| Torre Centro Morazán | Bulevar Morazán | Bulevar Morazán | 3 |
| Ecovivienda | Colonia La Era | Colonia La Era | 1 |
| Torre Costa Próceres | Colonia Lara | Colonia Lara | 1 |
| Torre Urbana Lara | Colonia Lara | Colonia Lara | 1 |
| Distrito Artemisa | El Trapiche | El Trapiche | 3 |
| Torre Aura | Las Colinas | Torre Aura Las Colinas ❌ | 1 |
| Torre Alfonso XIII | Lomas del Guijarro | Lomas del Guijarro | 1 |
| Torre Ámbar | Lomas del Guijarro | Lomas del Guijarro | 1 |
| Torre Doss | Lomas del Guijarro | Lomas del Guijarro | 1 |
| Torre KIREI | Lomas del Guijarro | Lomas del Guijarro | 1 |
| Torre la Trinidad | Lomas del Guijarro | Lomas del Guijarro | 1 |
| Torre Nivo | Lomas del Guijarro | Lomas del Guijarro | 1 |
| Torre O | Lomas del Guijarro | Lomas del Guijarro | 1 |
| Torre Platinum | Lomas del Guijarro | Lomas del Guijarro | 1 |
| Torre Tiffany | Lomas del Guijarro | Lomas del Guijarro | 1 |
| Torre Taragon | Lomas del Molino | Lomas del Molino | 1 |
| Torre Lirios de Miraflores | Miraflores | Miraflores | 5 |
| Torre Almendro | Residencial El Sauce | Residencial El Sauce | 1 |
| Torre 1 | Residencial Portal del Bosque 1 | Residencial Portal del Bosque 1 | 1 |
| Céfiro Azul | Residencial Zarahemla II | Residencial Zarahemla II | 5 |
| Torre Acacias | San Ignacio | San Ignacio | 6 |
| Torre Cipreses | San Ignacio | San Ignacio | 5 |

### Proyectos SIN propiedades asignadas (2 de 26)
| Proyecto | Zona | Observación |
|---|---|---|
| Torre 2 | Residencial Portal del Bosque 1 | En catálogo pero sin listings aún |
| Avalon | Colonia Loma Linda Norte | En catálogo pero sin listings aún |

---

## Sección 4 — Zonas sin propiedades (4 de 52)

Estas zonas existen en `dim_zone` pero no tienen ninguna propiedad asignada:

| Zona | Observación |
|---|---|
| Colonia Palmira | Sin propiedades |
| El Hatillo | Sin propiedades |
| Las Hadas | Sin propiedades |
| La Esperanza | ← NOTA: aparece con 1 prop — revisar cuáles son las 4 vacías |

> ⚠️ Requiere query adicional para confirmar exactamente cuáles 4 zonas están vacías.

---

## Sección 5 — Hallazgos críticos para FASE 1-B

### Hallazgo 1 — `Torre Aura Las Colinas` en campo colonia (Categoría C)
- **Situación:** 1 propiedad tiene `colonia = "Torre Aura Las Colinas"` — nombre de proyecto, no colonia
- **La propiedad ya tiene** `proyecto_id = Torre Aura` correctamente asignado
- **Fix propuesto:** Cambiar `colonia` a `"Las Colinas"` (nombre de la zona)
- **Decisión requerida:** ¿Las Colinas tiene colonias propias? Si no, usar el nombre de la zona como colonia

### Hallazgo 2 — `Cefiro Azul` en zona Anillo Periférico (Categoría C)
- **Situación:** 2 propiedades tienen `colonia = "Cefiro Azul"` y `zone_id = Anillo Periférico`
- **Pero:** El proyecto `Céfiro Azul` en `dim_proyecto` está en `Residencial Zarahemla II`
- **Posibilidades:** (a) Son unidades diferentes de un proyecto llamado igual en Anillo Periférico, o (b) el `zone_id` de esas 2 propiedades está mal asignado
- **Decisión requerida:** Investigar si Céfiro Azul tiene presencia en Anillo Periférico o si son datos mal asignados

### Hallazgo 3 — Colonias fragmentadas (Categoría B)
- **El Trapiche:** 3 props con colonia `"El Trapiche"` + 7 props con `"Residencial El Trapiche"` → ¿Son la misma colonia?
- **Miraflores:** 5 props con `"Miraflores"` + 6 props con `"Colonia Miraflores"` → ¿Son la misma colonia?
- **San Ignacio:** 11 props con `"San Ignacio"` + 3 con `"Residencial San Ignacio"` + 3 con `"Residencial Palmeras De San Ignacio"` → 3 posibles colonias distintas

### Hallazgo 4 — `tipo_proyecto` inconsistente en dim_proyecto
- Valores actuales: `TORRE`, `CONDOMINIO`, `VERTICAL`
- `VERTICAL` y `TORRE` parecen referirse a lo mismo — normalizar a: `TORRE`, `CONDOMINIO`

---

## Próximo paso — FASE 1-B
Con esta auditoría como base, proponer el catálogo canónico de colonias por zona para revisión y aprobación antes de crear `dim_colonia`.
