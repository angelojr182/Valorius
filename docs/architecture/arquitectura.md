# Arquitectura del Sistema — Valorius (as-built)

**Versión:** 1.0 · **Estado:** Vigente (as-built) · **Última actualización:** 2026-06-06

| Versión | Fecha | Cambio | Ref |
|---|---|---|---|
| 1.0 | 2026-06-06 | Inventario inicial del sistema, verificado contra `/scripts`, archivos del front y Edge Functions reales. | as-built |

> Inventario de las piezas del sistema y cómo se conectan. Verificado contra el código y
> la infraestructura (no de memoria). Documento vivo (ver [ADR-0002](../decisions/ADR-0002-gobernanza-documental.md)).
> El **modelo de datos** está en [data_dictionary.md](../database/data_dictionary.md); el
> **cálculo del analizador** en [calculo_analizador.md](calculo_analizador.md).

---

## 0. Vista general — dos audiencias

```
INTERNO / ADMIN                          BETA / USUARIO FINAL
  index.html (terminal login)              analizador.html (token)
  ingesta.html (alta manual)                     │
        │                                        │ lee en vivo (REST)
        ▼                                        ▼
            ┌─────────── Supabase (core + beta) ───────────┐
            │  Postgres  ·  Edge Functions  ·  Auth        │
            └──────────────────────────────────────────────┘
                        ▲
                        │ ingesta aprobada (manual)
  Scrapers (scripts/, Python+Playwright) → CSV → Excel → revisión
```

---

## 1. Front-end (HTML estáticos, sin framework)

| Archivo | Título | Audiencia | Rol |
|---|---|---|---|
| `index.html` | *Valorius — Operaciones* / "VALORIUS TERMINAL" | Admin | Login (email+password, Supabase Auth) → terminal/dashboard de operaciones. Setea `localStorage.valorius_token` (= modo admin del analizador). |
| `ingesta.html` | *Ingesta de Propiedades* | Admin | Formulario de alta manual de propiedades (backend: Edge Function `insert-listing`). |
| `analizador.html` | *Property Analyzer* | Beta (token) | **El analizador de precios** (producción). Auth por token o admin. |
| `analizador_prototipo.html` | *(ídem)* | Dev | Copia de pruebas con auth deshabilitada. **Nunca se despliega**; no trackeado en git. Idéntico a `analizador.html` salvo el bloque de auth. |
| `style.css` | — | — | Estilos del terminal/dashboard. |

### Modelo de autenticación (del analizador)
- **Beta:** token vía URL (`?token=`) o `localStorage.valorius_beta_token`, validado contra
  `beta.access_tokens` (chequea `activo`, `expira_en`; registra accesos). Eventos de uso → `beta.usage_events`.
- **Admin:** `localStorage.valorius_token` (sesión de Supabase Auth desde `index.html`) →
  acceso completo, sin tracking de beta.

## 2. Backend — Supabase (proyecto `oxhzxistgyfvkhzncxpz`)

### 2.1 Base de datos
Esquema `core` (datos del dominio) + esquema `beta` (tokens/uso). Detalle completo en
[data_dictionary.md](../database/data_dictionary.md). RLS activo en todas las tablas de `core`.

### 2.2 Edge Functions (7 activas)
> Verificadas por nombre/slug/`verify_jwt`. El código TS **no está auditado** en este doc;
> los propósitos marcados *(inf.)* se infieren del nombre.

| Función (slug) | verify_jwt | Propósito |
|---|---|---|
| `insert-listing` (`rapid-handler`) | **sí** | Inserta `property`+`listing` — backend de la ingesta. |
| `ingesta-ui` | no | Sirve una UI de ingesta desde Supabase *(inf.)*. |
| `scraper-webhook` | no | Endpoint para que scrapers envíen datos *(inf.)*. |
| `github-deploy` | no | Automatización de deploy a GitHub *(inf.)*. |
| `github-push` | no | Push de archivos a GitHub *(inf.)*. |
| `update-exchange-rate` | no | **Cron diario:** trae tasa USD/HNL de exchangerate-api → `core.exchange_rate`. Confirmado: filas diarias ~01:00 UTC. |
| `generar-snapshot` | no | **Periódico (≥15 días):** ejecuta `core.recalcular_snapshots()` → `market_snapshot`/`market_metrics`. |

## 3. Scrapers / pipeline de ingesta (`scripts/`)

Python + Playwright (Chrome headless). **Cero escritura en Supabase**: usan la anon key
**solo lectura** para dedup. Salida = CSV revisable; nunca insertan solos.

```
Portal (Rentify) → scraper (Playwright) → normaliza zona → dedup → CSV → Excel → revisión manual → ingesta
```

| Archivo | Rol |
|---|---|
| `rentify/apartamentos.py` | Scraper de **apartamentos** en venta (Rentify.hn, Tegucigalpa). |
| `rentify/casas.py` | Scraper de **casas**. |
| `shared/excel.py` | Convierte el CSV a Excel formateado por estado (colores). |
| `display.py` | Display en vivo en consola (librería `rich`): progreso, tabla de estados. |
| `config/zone_aliases.json` | Normalización de zona: texto del portal → `zone_id`, con `confianza` ALTA/MEDIA/BAJA (ALTA = dedup fuerte; MEDIA/BAJA = manda a REVISAR). |
| `setup.ps1` / `run.ps1` | Instalación única / atajo de ejecución. |
| `requirements.txt` | `playwright`, `httpx`, `python-dotenv`. |
| `.env` | **Local, NO en git** — `SUPABASE_URL` + anon key (solo lectura). |

**Estados del CSV:** `NUEVO`, `DUPLICADO_URL`, `PROBABLE_DUPLICADO` (mismo fingerprint, otra URL), `REVISAR` (zona ambigua / datos incompletos / confianza MEDIA), `RECHAZADO`.

**Reglas inamovibles del scraper:** nunca auto-insertar, nunca auto-crear zonas/colonias, nunca subir `.env`, siempre revisar el CSV antes de aprobar.

**Portales:** Rentify (preferido, con fecha) · CS Bienes Raíces (funciona, sin fecha) · Trébol (pendiente) · FazWaz (futuro) · Encuentra24 (descartado, 403). Existe `.github/workflows/scraper_rentify.yml`, pero Rentify usa Cloudflare que bloquea las IPs de GitHub Actions → **se corre localmente**. GHA queda para portales sin Cloudflare.

## 4. Flujo de datos extremo a extremo

```
1. Scraper (Rentify, local) ─► CSV ─► Excel ─► revisión/aprobación manual
2. Ingesta aprobada ─► ingesta.html / insert-listing (o SQL directo) ─► core.property + core.listing
3. Analizador (beta) ─► lee listings en vivo por REST ─► calcula veredicto (ver calculo_analizador.md)
   ├─ tasa LPS: lee core.exchange_rate (poblada por update-exchange-rate diaria)
   └─ snapshots: generar-snapshot (≥15d) escribe market_snapshot/metrics  [NO consumido aún por el analizador]
```

## 5. Versionado y despliegue
- **GitHub:** `https://github.com/angelojr182/Valorius.git` (rama `main`) — control de versiones principal. `gh` CLI no instalado; se usa git nativo.
- Edge Functions `github-deploy` / `github-push` sugieren automatización hacia GitHub *(inf., no auditado)*.
- **Hosting del front:** no confirmado en este doc (GitHub + posible `ingesta-ui` en Supabase). → por confirmar.

---

## 6. Hallazgos y deudas (al capturar el as-built)

1. **CLAUDE.md documentaba solo 2 Edge Functions; hay 7.** Sin documentar: `insert-listing`,
   `ingesta-ui`, `scraper-webhook`, `github-deploy`, `github-push`. Conviene auditar su código TS.
2. **`scripts/LEEME.txt` está desactualizado:** menciona un único `scraper_rentify.py`; en
   realidad el scraper se dividió en `rentify/apartamentos.py` + `rentify/casas.py`.
3. **Código TS de las Edge Functions no auditado** aquí (solo nombre/`verify_jwt`/propósito inferido).
4. **Hosting del front no confirmado** (GitHub Pages vs Supabase vs otro).
5. **`market_snapshot` se genera pero el analizador no lo consume** (calcula todo en vivo) —
   ya anotado en data_dictionary §5 y calculo_analizador §1.
