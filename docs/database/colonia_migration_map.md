# Catálogo Canónico de Colonias — Valorius
> FASE 1-C1 — Aprobado 2026-05-28
> FASE 1-C2 — Ejecutado 2026-05-28
> Estado: COMPLETADO

---

## Resumen de cambios requeridos

| Tipo de cambio | Cantidad |
|---------------|---------|
| Sin cambio (colonia ya es canónica) | 118 propiedades |
| Normalizar texto (mismo significado, diferente escritura) | 2 propiedades |
| Cambiar colonia (propiedad mal clasificada) | 8 propiedades |
| Cambiar zona completa (Zarahemla II → Anillo Periférico) | 6 propiedades |
| **Total propiedades** | **134** |

---

## Sección 1 — Cambios requeridos

### 1-A: Normalización de texto (misma colonia, escritura diferente)

| Zona | Colonia actual | Colonia canónica | Props |
|------|---------------|-----------------|-------|
| Anillo Periférico | `Zarahemla II` | `Residencial Zarahemla II` | 2 |

### 1-B: Corrección de colonia asignada

| Zona | Colonia actual | Colonia canónica | Motivo | Props |
|------|---------------|-----------------|--------|-------|
| Anillo Periférico | `Anillo Periférico` | `Residencial Alcázar` | Proyecto Condominios Alcazar está en Residencial Alcázar (confirmado Google Maps 2026-05-28) | 1 |
| Lomas del Guijarro | `Lomas del Guijarro` | `Lomas del Guijarro Sur` | Torres Nivo, KIREI, Tiffany, Trinidad + 3 props CS La Cumbre (confirmado por fuentes inmobiliarias) | 7 |

> **Nota Torre Doss:** se mantiene en `Lomas del Guijarro` (general). Fuente oficial del proyecto no especifica Norte ni Sur. Confirmado por el equipo 2026-05-28.

### 1-C: Cambio de zona (decisión de arquitectura confirmada 2026-05-28)

| Zona actual | Zona destino | Colonia | Motivo | Props |
|------------|-------------|---------|--------|-------|
| `Residencial Zarahemla II` | `Anillo Periférico` | `Residencial Zarahemla II` | Zarahemla II es colonia dentro del Anillo, no zona independiente — decisión de modelo confirmada | 6 |

> ⚠️ Tras este cambio, la zona `Residencial Zarahemla II` en dim_zone quedará sin propiedades.
> No eliminar — FASE 1-G se encargará de deprecarla formalmente junto a dim_subzona.

### 1-D: Sin cambio (ya canónicas)

Estas colonias están correctas y solo se insertan en dim_colonia:

| Zona | Colonia canónica | Props | Nota |
|------|-----------------|-------|------|
| Anillo Periférico | `Residencial Mirador de Los Ángeles` | 1 | |
| Anillo Periférico | `Residencial Zarahemla II` | 2 | Ya en zona correcta |
| Boulevard Centroamerica | `Las Colinas` | 1 | `Las Colinas` era zona hasta 2026-05-27 (FASE 1-B). Eliminada de dim_zone, ahora es colonia dentro de Boulevard Centroamerica. Torre Aura es el proyecto. |
| Bulevar Morazán | `Bulevar Morazán` | 10 | Colonia provisional — no hay información suficiente para subdividir |
| El Trapiche | `Colonia El Trapiche` | 10 | |
| Lomas del Guijarro | `Lomas del Guijarro` | 9 | General — incluye Torre Doss, Torre O, Torre Platinum, Torre Alfonso XIII, Torre Ámbar y casas sin proyecto |
| Los Robles | `Residencial Roble Oeste` | 2 | Los Robles es la zona (renombrada de "Roble Oeste" 2026-05-27). Residencial Roble Oeste es la colonia dentro de esa zona. Confirmado por múltiples portales inmobiliarios. |
| Miraflores | `Colonia Miraflores` | 11 | |
| San Ignacio | `Residencial San Ignacio` | 14 | |
| San Ignacio | `Residencial Palmeras de San Ignacio` | 3 | |
| Zambrano | `Altos de Zambrano` | 1 | |
| *(zonas donde colonia = zona)* | *(ver Sección 2)* | 54 | Fallback canónico aceptado |

---

## Sección 2 — Catálogo completo de dim_colonia

51 colonias canónicas a crear, ordenadas por zona:

| # | Zona | Colonia canónica | Nota |
|---|------|-----------------|------|
| 1 | Aldea de Guasculile | Aldea de Guasculile | |
| 2 | Altos de la Granja | Altos de la Granja | |
| 3 | Anillo Periférico | Residencial Alcázar | Nueva — no existía antes |
| 4 | Anillo Periférico | Residencial Mirador de Los Ángeles | |
| 5 | Anillo Periférico | Residencial Zarahemla II | Recibirá 6 props adicionales de 1-C |
| 6 | Barrio Bella Vista | Barrio Bella Vista | |
| 7 | Barrio Buenos Aires | Barrio Buenos Aires | |
| 8 | Barrio Guanacaste | Barrio Guanacaste | |
| 9 | Barrio La Leona | Barrio La Leona | |
| 10 | Boulevard Centroamerica | Las Colinas | Antes zona, ahora colonia (FASE 1-B, 2026-05-27) |
| 11 | Boulevard Fuerzas Armadas | Boulevard Fuerzas Armadas | |
| 12 | Bulevar Morazán | Bulevar Morazán | Provisional |
| 13 | Colonia América | Colonia América | |
| 14 | Colonia Guadalupe López Villanueva | Colonia Guadalupe López Villanueva | |
| 15 | Colonia Guaymuras | Colonia Guaymuras | |
| 16 | Colonia La Era | Colonia La Era | |
| 17 | Colonia La Pradera | Colonia La Pradera | |
| 18 | Colonia La Sosa | Colonia La Sosa | |
| 19 | Colonia Lara | Colonia Lara | |
| 20 | Colonia Loma Linda Norte | Colonia Loma Linda Norte | |
| 21 | Colonia Lomas de Tiloarque | Colonia Lomas de Tiloarque | |
| 22 | Colonia Los Ángeles | Colonia Los Ángeles | |
| 23 | Colonia Modelo | Colonia Modelo | |
| 24 | Colonia San José del Loarque | Colonia San José del Loarque | |
| 25 | Colonia Satélite | Colonia Satélite | |
| 26 | Colonia Tepeyac | Colonia Tepeyac | |
| 27 | El Trapiche | Colonia El Trapiche | |
| 28 | La Esperanza | La Esperanza | |
| 29 | Las Uvas | Las Uvas | |
| 30 | Lomas del Guijarro | Lomas del Guijarro | General |
| 31 | Lomas del Guijarro | Lomas del Guijarro Sur | Confirmado por fuentes |
| 32 | Lomas del Molino | Lomas del Molino | |
| 33 | Los Robles | Residencial Roble Oeste | Zona renombrada de "Roble Oeste" — colonia mantiene nombre original |
| 34 | Miraflores | Colonia Miraflores | |
| 35 | Residencial Buena Vista | Residencial Buena Vista | |
| 36 | Residencial Ciudad Nueva | Residencial Ciudad Nueva | |
| 37 | Residencial Concepción II | Residencial Concepción II | |
| 38 | Residencial El Sauce | Residencial El Sauce | |
| 39 | Residencial Hacienda Real | Residencial Hacienda Real | |
| 40 | Residencial Las Casitas | Residencial Las Casitas | |
| 41 | Residencial Los Cerezos | Residencial Los Cerezos | |
| 42 | Residencial Mirador de los Hidalgos | Residencial Mirador de los Hidalgos | |
| 43 | Residencial Paseo de las Campanas | Residencial Paseo de las Campanas | |
| 44 | Residencial Portal del Bosque 1 | Residencial Portal del Bosque 1 | |
| 45 | Residencial Quinta Isabel | Residencial Quinta Isabel | |
| 46 | Residencial San Juan | Residencial San Juan | |
| 47 | Residencial Villa Elena | Residencial Villa Elena | |
| 48 | San Ignacio | Residencial Palmeras de San Ignacio | |
| 49 | San Ignacio | Residencial San Ignacio | |
| 50 | Torocagua | Torocagua | |
| 51 | Zambrano | Altos de Zambrano | |

**Total: 51 entradas en dim_colonia**

---

## Sección 3 — Propiedades que van a Lomas del Guijarro Sur

Las siguientes 7 propiedades pasan de colonia `Lomas del Guijarro` → `Lomas del Guijarro Sur`:

| Proyecto | Fuente | Criterio |
|---------|--------|---------|
| Torre Nivo | Rentify | Confirmado: Ave. República de Costa Rica, Lomas del Guijarro Sur |
| Torre KIREI | Rentify | Confirmado: Bloque R, Calle París, Lomas del Guijarro Sur |
| Torre Tiffany | Rentify | Confirmado por equipo 2026-05-28 |
| Torre la Trinidad | Rentify | Confirmado por equipo 2026-05-28 |
| Sin proyecto (La Cumbre) | CS Bienes Raíces | URL contiene "La-Cumbre" → Residencial La Cumbre = Lomas del Guijarro Sur |
| Sin proyecto (La Cumbre) | CS Bienes Raíces | Igual |
| Sin proyecto (La Cumbre) | CS Bienes Raíces | Igual |

Las siguientes 9 propiedades se mantienen en `Lomas del Guijarro` (general):

| Proyecto | Fuente |
|---------|--------|
| Torre Doss | Marketplace |
| Torre O | Marketplace |
| Torre Platinum | Marketplace |
| Torre Alfonso XIII | Marketplace |
| Torre Ámbar | Rentify |
| Sin proyecto (casa) | Bienes Raíces Mariposa |
| Sin proyecto (casa) | Encuentra24 |
| Sin proyecto (casa) | Encuentra24 |
| Sin proyecto (apto) | Marketplace |

---

## Estado de aprobación

- [x] Sección 1-A aprobada y ejecutada (2 props: normalizar Zarahemla II)
- [x] Sección 1-B aprobada y ejecutada (8 props: Alcázar + Lomas Sur)
- [x] Sección 1-C aprobada y ejecutada (6 props: cambio de zona Zarahemla II → Anillo Periférico)
- [x] Catálogo dim_colonia (51 entradas) aprobado e insertado
- [x] FASE 1-C2 ejecutada — 134/134 colonia_id vinculados, 0 NULLs
