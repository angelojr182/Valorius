#!/usr/bin/env python3
"""
rentify/casas.py — Valorius Market Intelligence
Extrae CASAS de Rentify.hn y genera CSV revisable.
CERO escritura en Supabase. Solo lectura para dedup.
"""

import os
import re
import csv
import json
import hashlib
import unicodedata
from datetime import date
from pathlib import Path
from collections import Counter

import httpx
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright
from rich.live import Live

# Módulos compartidos — un nivel arriba
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from display import ScraperDisplay, console
from shared.excel import csv_to_excel

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).parent          # scripts/rentify/
SCRIPTS_DIR  = SCRIPT_DIR.parent             # scripts/
OUTPUTS_DIR  = SCRIPTS_DIR.parent / "outputs"
ALIASES_PATH = SCRIPTS_DIR / "config" / "zone_aliases.json"
OUTPUTS_DIR.mkdir(exist_ok=True)

load_dotenv(SCRIPTS_DIR / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

HOY        = date.today().isoformat()
OUTPUT_CSV = OUTPUTS_DIR / f"rentify_casas_{HOY}.csv"

# URL de búsqueda: casas en venta, Tegucigalpa
SEARCH_URL_P1 = (
    "https://rentify.hn/resultados-de-busqueda/"
    "?keyword=&status%5B%5D=a-la-venta&type%5B%5D=casas-bienes-raices"
    "&states%5B%5D=&location%5B%5D=tegucigalpa&bedrooms=&min-area=&max-area="
    "&min-price=200&max-price=6000000&property_id="
)
SEARCH_URL_PN = (
    "https://rentify.hn/resultados-de-busqueda/page/{n}/"
    "?keyword=&status%5B%5D=a-la-venta&type%5B%5D=casas-bienes-raices"
    "&states%5B%5D=&location%5B%5D=tegucigalpa&bedrooms=&min-area=&max-area="
    "&min-price=200&max-price=6000000&property_id="
)
MAX_PAGES = 15

PRECIO_MIN = 20_000
PRECIO_MAX = 6_000_000
AREA_MIN   = 40    # casas suelen ser más grandes que apts
AREA_MAX   = 2000
PM2_MIN    = 300
PM2_MAX    = 8_000

CSV_COLUMNS = [
    "estado_revision",
    "alertas",
    "match_motivo",
    "match_listing_id",
    "fingerprint_status",
    "fuente",
    "url",
    "titulo",
    "precio_usd",
    "moneda",
    "area_construccion",
    "area_terreno",
    "precio_m2",
    "habitaciones",
    "banos",
    "estacionamientos",
    "tipo_inmueble",
    "ubicacion_raw",
    "ubicacion_normalizada",
    "zone_id_sugerido",
    "zona_canonica_sugerida",
    "zona_match_confianza",
    "zona_match_motivo",
    "fingerprint_base",
    "calidad_dato",
    "fecha_scraping",
    "proyecto_texto",
]


# ─────────────────────────────────────────────────────────────────────────────
# NORMALIZACIÓN Y RESOLUCIÓN DE ZONA
# ─────────────────────────────────────────────────────────────────────────────

def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.lower().replace(".", "")
    return re.sub(r"\s+", " ", text).strip()


def load_aliases() -> dict:
    with open(ALIASES_PATH, encoding="utf-8") as f:
        return json.load(f)


def resolve_zone(ubicacion_raw: str, aliases: dict) -> tuple:
    if not ubicacion_raw:
        return None, None, "BAJA", "Sin ubicación", ""

    norm = normalize_text(ubicacion_raw)

    if norm in aliases and not norm.startswith("_"):
        entry = aliases[norm]
        zone_id   = entry.get("zone_id")
        confianza = entry.get("confianza", "BAJA")
        canonica  = entry.get("zona_canonica", "")
        nota      = entry.get("nota", "")
        motivo    = f"Match exacto: '{norm}'" + (f" — {nota}" if nota else "")
        if zone_id:
            return zone_id, canonica, confianza, motivo, norm
        return None, None, "BAJA", nota or f"Alias ambiguo: '{norm}'", norm

    best_alias, best_entry, best_len = None, None, 0
    for alias, entry in aliases.items():
        if alias.startswith("_") or len(alias) < 6:
            continue
        if alias in norm and len(alias) > best_len:
            best_alias, best_entry, best_len = alias, entry, len(alias)

    if best_alias:
        zone_id   = best_entry.get("zone_id")
        confianza = "MEDIA" if best_entry.get("confianza") == "ALTA" else best_entry.get("confianza", "BAJA")
        canonica  = best_entry.get("zona_canonica", "")
        nota      = best_entry.get("nota", "")
        motivo    = f"Match parcial: '{best_alias}' en '{norm}'" + (f" — {nota}" if nota else "")
        if zone_id:
            return zone_id, canonica, confianza, motivo, norm
        return None, None, "BAJA", nota or f"Alias ambiguo parcial: '{best_alias}'", norm

    return None, None, "BAJA", f"Sin match en diccionario: '{norm}'", norm


# ─────────────────────────────────────────────────────────────────────────────
# FINGERPRINT
# ─────────────────────────────────────────────────────────────────────────────

def build_fingerprint(zone_id, colonia_norm, tipo, habitaciones, banos, area_m2) -> str | None:
    if not zone_id or not tipo or area_m2 is None:
        return None
    area_bucket = round(area_m2 / 10) * 10  # casas: tramos de 10m²
    raw = "|".join([
        str(zone_id),
        str(colonia_norm or ""),
        str(tipo),
        str(int(habitaciones) if habitaciones is not None else ""),
        str(float(banos) if banos is not None else ""),
        str(area_bucket),
    ])
    return hashlib.md5(raw.encode()).hexdigest()


# ─────────────────────────────────────────────────────────────────────────────
# SUPABASE — SOLO LECTURA
# ─────────────────────────────────────────────────────────────────────────────

def supabase_get(path: str, params: dict = None) -> list:
    headers = {
        "apikey":         SUPABASE_KEY,
        "Authorization":  f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "core",
    }
    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers=headers,
        params=params,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def load_existing_data() -> tuple[set, dict]:
    print("Cargando datos existentes de Supabase (solo lectura)...")

    rows_urls = supabase_get("listing", {"select": "url"})
    existing_urls = {r["url"] for r in rows_urls if r.get("url")}
    print(f"  {len(existing_urls)} URLs existentes")

    rows_fp = supabase_get(
        "listing",
        {"select": "listing_id,area_construccion,property(zone_id,colonia,habitaciones,banos,property_type_id)"}
    )
    existing_fps = {}
    for row in rows_fp:
        prop = row.get("property") or {}
        # Solo fingerprints de casas
        if prop.get("property_type_id") != "8c4efee8-42c2-43ee-b4de-82a64798365e":
            continue
        fp = build_fingerprint(
            zone_id      = prop.get("zone_id"),
            colonia_norm = normalize_text(prop.get("colonia") or ""),
            tipo         = "CASA",
            habitaciones = prop.get("habitaciones"),
            banos        = prop.get("banos"),
            area_m2      = row.get("area_construccion"),
        )
        if fp:
            existing_fps[fp] = row.get("listing_id", "")
    print(f"  {len(existing_fps)} fingerprints existentes (casas)")

    return existing_urls, existing_fps


# ─────────────────────────────────────────────────────────────────────────────
# SCRAPER — RECOPILACIÓN DE URLs
# ─────────────────────────────────────────────────────────────────────────────

def collect_property_urls(browser) -> set:
    urls = set()
    search_pages = [SEARCH_URL_P1] + [SEARCH_URL_PN.format(n=n) for n in range(2, MAX_PAGES + 1)]
    print(f"\nRecopilando URLs (max. {MAX_PAGES} paginas)...")

    for i, search_url in enumerate(search_pages, start=1):
        page = browser.new_page()
        try:
            page.goto(search_url, timeout=30_000)
            page.wait_for_load_state("domcontentloaded", timeout=15_000)
            page.wait_for_timeout(3_000)

            if i == 1:
                debug_dir = OUTPUTS_DIR / "debug"
                debug_dir.mkdir(exist_ok=True)
                try:
                    page.screenshot(path=str(debug_dir / "casas_page1.png"), full_page=True)
                except Exception:
                    pass
                all_links = page.eval_on_selector_all("a", "els => els.map(e => e.href)")
                prop_links = [l for l in all_links if "/propiedad/" in l]
                print(f"  [DEBUG] Links /propiedad/: {len(prop_links)}")

            links = page.eval_on_selector_all(
                "a[href*='/propiedad/']",
                "els => [...new Set(els.map(e => e.href))]"
            )
            links = [l for l in links if "/propiedad/" in l]
            if not links:
                print(f"  Pagina {i}: vacia - fin de paginacion")
                break
            prev = len(urls)
            urls.update(links)
            print(f"  Pagina {i}: {len(links)} encontradas | +{len(urls)-prev} nuevas | total: {len(urls)}")
        except Exception as e:
            print(f"  Pagina {i}: error - {e}")
            break
        finally:
            page.close()

    return urls


# ─────────────────────────────────────────────────────────────────────────────
# SCRAPER — EXTRACCIÓN POR PROPIEDAD
# ─────────────────────────────────────────────────────────────────────────────

def extract_property(page, url: str) -> dict | None:
    try:
        page.goto(url, timeout=30_000)
        page.wait_for_load_state("domcontentloaded", timeout=15_000)
        page.wait_for_timeout(2_000)
    except Exception as e:
        return {"_error": str(e), "url": url}

    # Rentify ya filtra status[]=a-la-venta y type[]=casas-bienes-raices en la URL.
    # No aplicamos filtros internos de tipo ni estado — confiamos en el portal.

    titulo = ""
    try:
        titulo = page.locator("h1").first.inner_text().strip()
    except Exception:
        pass

    txt = ""
    for sel in ["main", ".property-detail", ".property-content", ".site-main", "article"]:
        try:
            txt = page.locator(sel).first.inner_text()
            if txt:
                break
        except Exception:
            pass
    if not txt:
        try:
            txt = page.locator("body").inner_text()
        except Exception:
            pass

    txt_lower    = txt.lower()
    titulo_lower = titulo.lower()

    # Precio
    precio_usd   = None
    precio_texto = ""
    for sel in [".property-price", ".listing-price", ".price", ".rh_price", ".item-price", ".property-item-price"]:
        try:
            precio_texto = page.locator(sel).first.inner_text().strip()
            if precio_texto:
                break
        except Exception:
            pass

    if not precio_texto:
        matches = re.findall(r"\$\s*[\d,]+", txt)
        validos = []
        for m in matches:
            try:
                n = float(m.replace("$", "").replace(",", "").strip())
                if PRECIO_MIN <= n <= PRECIO_MAX:
                    validos.append(m)
            except ValueError:
                pass
        if validos:
            precio_texto = validos[0]

    m = re.search(r"\$\s*([\d,]+)", precio_texto)
    if m:
        try:
            precio_usd = float(m.group(1).replace(",", ""))
        except ValueError:
            pass

    if precio_usd and not (PRECIO_MIN <= precio_usd <= PRECIO_MAX):
        precio_usd = None

    # Área de construcción
    area_construccion = None
    m = re.search(r"(?:Área|Area|Construcción|Construccion)\s*:?\s*([\d.]+)\s*m[²2]", txt, re.IGNORECASE)
    if not m:
        m = re.search(r"([\d.]+)\s*m[²2]", txt, re.IGNORECASE)
    if m:
        try:
            area_construccion = float(m.group(1))
        except ValueError:
            pass
    if area_construccion and not (AREA_MIN <= area_construccion <= AREA_MAX):
        area_construccion = None

    # Área de terreno
    area_terreno = None
    m = re.search(r"(?:Terreno|Lote|Suelo)\s*:?\s*([\d.]+)\s*m[²2]", txt, re.IGNORECASE)
    if m:
        try:
            area_terreno = float(m.group(1))
        except ValueError:
            pass

    # Precio/m² (basado en área de construcción)
    precio_m2 = None
    if precio_usd and area_construccion:
        precio_m2 = round(precio_usd / area_construccion)
        if not (PM2_MIN <= precio_m2 <= PM2_MAX):
            precio_m2 = None

    # Habitaciones
    habitaciones = None
    m = re.search(r"(\d+)\s*(?:habitaciones?|habitación|dormitorios?)", txt, re.IGNORECASE)
    if not m:
        m = re.search(r"Camas?\s*:?\s*(\d+)", txt, re.IGNORECASE)
    if m:
        try:
            habitaciones = int(m.group(1))
        except ValueError:
            pass

    # Baños
    banos = None
    m = re.search(r"([\d.]+)\s*(?:baños?|banos?)", txt, re.IGNORECASE)
    if not m:
        m = re.search(r"Duchas?\s*:?\s*([\d.]+)", txt, re.IGNORECASE)
    if m:
        try:
            banos = float(m.group(1))
        except ValueError:
            pass

    # Estacionamientos
    estacionamientos = None
    m = re.search(r"(\d+)\s*(?:estacionamientos?|parqueos?|garajes?|cocheras?)", txt, re.IGNORECASE)
    if m:
        try:
            estacionamientos = int(m.group(1))
        except ValueError:
            pass

    # Ubicación — estrategia en capas para evitar capturar propiedades relacionadas
    ubicacion_raw = ""

    # 1. Extraer del slug de la URL — toma el ÚLTIMO segmento tras "-en-"
    slug = url.rstrip("/").split("/")[-1]
    slug_parts = slug.split("-en-")
    if len(slug_parts) > 1:
        ubicacion_raw = slug_parts[-1].replace("-", " ").strip()

    # 2. Selectores HTML específicos de Rentify (antes del bloque de relacionadas)
    if not ubicacion_raw:
        for sel in [".property-location", ".rh_prop_location", ".property-address",
                    ".location", "[class*='location']", ".property-meta .address"]:
            try:
                loc = page.locator(sel).first.inner_text(timeout=2000).strip()
                if loc and len(loc) < 80:
                    ubicacion_raw = loc
                    break
            except Exception:
                pass

    # 3. Fallback: regex solo en los primeros 800 caracteres del texto (antes de relacionadas)
    if not ubicacion_raw:
        txt_head = txt[:800]
        m = re.search(r"([^\n,]{3,60}),\s*Tegucigalpa", txt_head, re.IGNORECASE)
        if m:
            ubicacion_raw = m.group(1).strip()

    # Proyecto
    proyecto_texto = None
    m = re.search(r"(?:Residencial|Urbanización|Condominio)\s+[^\-–|,\n]{2,50}", titulo, re.IGNORECASE)
    if m:
        proyecto_texto = m.group(0).strip()[:80]

    calidad = "ALTA" if all([titulo, precio_usd, area_construccion, habitaciones, banos]) else "MEDIA"

    return {
        "url":               url,
        "titulo":            titulo,
        "precio_usd":        precio_usd,
        "area_construccion": area_construccion,
        "area_terreno":      area_terreno,
        "precio_m2":         precio_m2,
        "habitaciones":      habitaciones,
        "banos":             banos,
        "estacionamientos":  estacionamientos,
        "tipo_inmueble":     "CASA",
        "ubicacion_raw":     ubicacion_raw,
        "proyecto_texto":    proyecto_texto,
        "calidad_dato":      calidad,
    }


# ─────────────────────────────────────────────────────────────────────────────
# PROCESO: NORMALIZACIÓN + DEDUP + ESTADO
# ─────────────────────────────────────────────────────────────────────────────

def process_listing(raw: dict, aliases: dict, existing_urls: set, existing_fps: set) -> dict:
    url        = raw["url"]
    area_m2    = raw.get("area_construccion")
    precio_usd = raw.get("precio_usd")

    zone_id, zona_canonica, confianza, zona_motivo, ubicacion_norm = resolve_zone(
        raw.get("ubicacion_raw", ""), aliases
    )

    fingerprint = None
    if confianza == "ALTA" and zone_id:
        fingerprint = build_fingerprint(
            zone_id      = zone_id,
            colonia_norm = ubicacion_norm,
            tipo         = "CASA",
            habitaciones = raw.get("habitaciones"),
            banos        = raw.get("banos"),
            area_m2      = area_m2,
        )

    alertas = []
    if not area_m2:
        alertas.append("SIN_AREA")
    if not precio_usd:
        alertas.append("SIN_PRECIO")
    if not zone_id:
        alertas.append("ZONA_NO_MAPEADA")
    if precio_usd and precio_usd < 20_000:
        alertas.append("PRECIO_BAJO")
    if raw.get("precio_m2") and raw["precio_m2"] < 300:
        alertas.append("PRECIO_M2_SOSPECHOSO")
    if "renta" in url.lower() or "alquiler" in url.lower():
        alertas.append("POSIBLE_RENTA")

    match_listing_id = ""
    if url in existing_urls:
        estado       = "DUPLICADO_URL"
        match_motivo = "URL ya existe en Supabase"
        fp_status    = "N/A"
    elif not zone_id or confianza == "BAJA":
        estado       = "REVISAR"
        match_motivo = zona_motivo
        fp_status    = "SIN_ZONA"
    elif confianza == "MEDIA":
        estado       = "REVISAR"
        match_motivo = f"Zona con confianza MEDIA: {zona_canonica or 'desconocida'}"
        fp_status    = "SIN_FINGERPRINT"
    elif fingerprint and fingerprint in existing_fps:
        estado           = "PROBABLE_DUPLICADO"
        match_listing_id = existing_fps[fingerprint]
        match_motivo     = f"Fingerprint coincide con listing {match_listing_id} en {zona_canonica}"
        fp_status        = "MATCH"
    elif not fingerprint:
        estado       = "REVISAR"
        match_motivo = "Datos insuficientes para construir fingerprint"
        fp_status    = "INCOMPLETO"
    else:
        estado       = "NUEVO"
        match_motivo = ""
        fp_status    = "OK"

    return {
        "estado_revision":       estado,
        "alertas":               "|".join(alertas),
        "match_motivo":          match_motivo,
        "match_listing_id":      match_listing_id,
        "fingerprint_status":    fp_status,
        "fuente":                "Rentify",
        "url":                   url,
        "titulo":                raw.get("titulo", ""),
        "precio_usd":            precio_usd,
        "moneda":                "USD",
        "area_construccion":     area_m2,
        "area_terreno":          raw.get("area_terreno"),
        "precio_m2":             raw.get("precio_m2"),
        "habitaciones":          raw.get("habitaciones"),
        "banos":                 raw.get("banos"),
        "estacionamientos":      raw.get("estacionamientos"),
        "tipo_inmueble":         "CASA",
        "ubicacion_raw":         raw.get("ubicacion_raw", ""),
        "ubicacion_normalizada": ubicacion_norm,
        "zone_id_sugerido":      zone_id or "",
        "zona_canonica_sugerida": zona_canonica or "",
        "zona_match_confianza":  confianza,
        "zona_match_motivo":     zona_motivo,
        "fingerprint_base":      fingerprint or "",
        "calidad_dato":          raw.get("calidad_dato", "MEDIA"),
        "fecha_scraping":        HOY,
        "proyecto_texto":        raw.get("proyecto_texto", ""),
    }


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    aliases = load_aliases()
    existing_urls, existing_fps = load_existing_data()

    results = []
    ui = ScraperDisplay(nombre="Rentify — Casas", fuente="rentify.hn/casas")

    with Live(ui._render(), console=console, refresh_per_second=4, screen=False) as live:
        ui._live = live

        ui.fase("Recopilando URLs de casas...")
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            property_urls = collect_property_urls(browser)
            ui.set_total(len(property_urls))

            ui.fase("Extrayendo casas...")
            page = browser.new_page()
            for url in sorted(property_urls):
                ui.set_url_actual(url)
                raw = extract_property(page, url)

                if raw is None:
                    ui.descartar()
                    ui.avanzar()
                    continue
                if "_error" in raw:
                    ui.error()
                    ui.avanzar()
                    continue

                processed = process_listing(raw, aliases, existing_urls, existing_fps)
                results.append(processed)
                alertas = [a for a in processed["alertas"].split("|") if a]
                ui.registrar(processed["estado_revision"], alertas)
                ui.avanzar()

            page.close()
            browser.close()

        ui.fase(f"Escribiendo CSV... ({len(results)} filas)")

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(results)

    ui.resumen()
    console.print(f"\n  [bold green]CSV generado:[/] {OUTPUT_CSV}")

    xlsx_path = csv_to_excel(OUTPUT_CSV)
    console.print(f"  [bold green]Excel generado:[/] {xlsx_path}")


if __name__ == "__main__":
    main()
