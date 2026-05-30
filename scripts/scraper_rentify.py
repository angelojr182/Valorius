#!/usr/bin/env python3
"""
scraper_rentify.py — Valorius Market Intelligence
Extrae propiedades de Rentify.hn y genera CSV revisable.
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

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────────────────────────────────────────

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]  # anon key — solo lectura

SCRIPT_DIR  = Path(__file__).parent
OUTPUTS_DIR = SCRIPT_DIR.parent / "outputs"
ALIASES_PATH = SCRIPT_DIR / "config" / "zone_aliases.json"
OUTPUTS_DIR.mkdir(exist_ok=True)

HOY        = date.today().isoformat()
OUTPUT_CSV = OUTPUTS_DIR / f"rentify_{HOY}.csv"

# URL de búsqueda: apartamentos en venta, Tegucigalpa
SEARCH_URL_P1 = (
    "https://rentify.hn/resultados-de-busqueda/"
    "?keyword=&status%5B%5D=a-la-venta&type%5B%5D=apartamentos-bienes-raices"
    "&states%5B%5D=&location%5B%5D=tegucigalpa&bedrooms=&min-area=&max-area="
    "&min-price=200&max-price=6000000&property_id="
)
SEARCH_URL_PN = (
    "https://rentify.hn/resultados-de-busqueda/page/{n}/"
    "?keyword=&status%5B%5D=a-la-venta&type%5B%5D=apartamentos-bienes-raices"
    "&states%5B%5D=&location%5B%5D=tegucigalpa&bedrooms=&min-area=&max-area="
    "&min-price=200&max-price=6000000&property_id="
)
MAX_PAGES = 15

PRECIO_MIN = 20_000
PRECIO_MAX = 6_000_000
AREA_MIN   = 20
AREA_MAX   = 600
PM2_MIN    = 400
PM2_MAX    = 10_000

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
    "area_m2",
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
    """Minúsculas, sin tildes, sin puntos, espacios simples."""
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
    """
    Retorna (zone_id, zona_canonica, confianza, motivo, ubicacion_normalizada).

    Estrategia:
      1. Match exacto sobre el texto normalizado.
      2. Si no, busca el alias más largo conocido dentro del texto.
         Los matches parciales bajan a MEDIA máximo.
    """
    if not ubicacion_raw:
        return None, None, "BAJA", "Sin ubicación", ""

    norm = normalize_text(ubicacion_raw)

    # 1. Match exacto
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

    # 2. Match parcial — alias más largo presente en el texto normalizado
    best_alias, best_entry, best_len = None, None, 0
    for alias, entry in aliases.items():
        if alias.startswith("_") or len(alias) < 6:
            continue
        if alias in norm and len(alias) > best_len:
            best_alias, best_entry, best_len = alias, entry, len(alias)

    if best_alias:
        zone_id   = best_entry.get("zone_id")
        # Match parcial siempre baja un nivel: ALTA → MEDIA, MEDIA → MEDIA, BAJA → BAJA
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
    """
    Solo se construye si hay zone_id, tipo y área.
    Área redondeada a tramos de 5 m² para absorber variaciones menores.
    """
    if not zone_id or not tipo or area_m2 is None:
        return None
    area_bucket = round(area_m2 / 5) * 5
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
    """Hace un GET al API REST de Supabase (schema core). Solo lectura."""
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
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
    """Carga URLs y fingerprints existentes para dedup en memoria."""
    print("Cargando datos existentes de Supabase (solo lectura)...")

    # URLs existentes
    rows_urls = supabase_get("listing", {"select": "url"})
    existing_urls = {r["url"] for r in rows_urls if r.get("url")}
    print(f"  {len(existing_urls)} URLs existentes")

    # Fingerprints existentes
    rows_fp = supabase_get(
        "listing",
        {"select": "listing_id,area_construccion,property(zone_id,colonia,habitaciones,banos)"}
    )
    existing_fps = {}
    for row in rows_fp:
        prop = row.get("property") or {}
        fp = build_fingerprint(
            zone_id      = prop.get("zone_id"),
            colonia_norm = normalize_text(prop.get("colonia") or ""),
            tipo         = "APARTAMENTO",
            habitaciones = prop.get("habitaciones"),
            banos        = prop.get("banos"),
            area_m2      = row.get("area_construccion"),
        )
        if fp:
            existing_fps[fp] = row.get("listing_id", "")
    print(f"  {len(existing_fps)} fingerprints existentes")

    return existing_urls, existing_fps


# ─────────────────────────────────────────────────────────────────────────────
# SCRAPER — RECOPILACIÓN DE URLs
# ─────────────────────────────────────────────────────────────────────────────

def collect_property_urls(browser) -> set:
    """Recorre páginas de resultados y recopila URLs únicas de propiedades."""
    urls = set()
    search_pages = [SEARCH_URL_P1] + [SEARCH_URL_PN.format(n=n) for n in range(2, MAX_PAGES + 1)]
    print(f"\nRecopilando URLs (máx. {MAX_PAGES} páginas)...")

    for i, search_url in enumerate(search_pages, start=1):
        page = browser.new_page()
        try:
            page.goto(search_url, timeout=30_000)
            # domcontentloaded es más rápido y confiable que networkidle
            page.wait_for_load_state("domcontentloaded", timeout=15_000)
            page.wait_for_timeout(3_000)  # espera extra para JS

            # DEBUG siempre en página 1
            if i == 1:
                debug_dir = OUTPUTS_DIR / "debug"
                debug_dir.mkdir(exist_ok=True)
                try:
                    page.screenshot(path=str(debug_dir / "page1_screenshot.png"), full_page=True)
                except Exception:
                    pass
                page_title = page.title()
                page_url   = page.url
                all_links  = page.eval_on_selector_all("a", "els => els.map(e => e.href)")
                propiedad_links = [l for l in all_links if "/propiedad/" in l]
                print(f"  [DEBUG] Título: {page_title}")
                print(f"  [DEBUG] URL final: {page_url}")
                print(f"  [DEBUG] Total links en página: {len(all_links)}")
                print(f"  [DEBUG] Links /propiedad/: {len(propiedad_links)}")
                with open(debug_dir / "page1_links.txt", "w", encoding="utf-8") as f:
                    f.write(f"Título: {page_title}\nURL: {page_url}\n\n")
                    f.write("\n".join(all_links[:100]))

            links = page.eval_on_selector_all(
                "a[href*='/propiedad/']",
                "els => [...new Set(els.map(e => e.href))]"
            )
            links = [l for l in links if "/propiedad/" in l]
            if not links:
                print(f"  Página {i}: vacía — fin de paginación")
                break
            prev = len(urls)
            urls.update(links)
            print(f"  Página {i}: {len(links)} encontradas | +{len(urls)-prev} nuevas | total: {len(urls)}")
        except Exception as e:
            print(f"  Página {i}: error — {e}")
            # en error también tomamos screenshot de debug
            if i == 1:
                debug_dir = OUTPUTS_DIR / "debug"
                debug_dir.mkdir(exist_ok=True)
                try:
                    page.screenshot(path=str(debug_dir / "page1_error_screenshot.png"), full_page=True)
                    print(f"  [DEBUG] Screenshot de error guardado")
                except Exception:
                    pass
            break
        finally:
            page.close()

    return urls


# ─────────────────────────────────────────────────────────────────────────────
# SCRAPER — EXTRACCIÓN POR PROPIEDAD
# ─────────────────────────────────────────────────────────────────────────────

def extract_property(page, url: str) -> dict | None:
    """
    Extrae datos crudos de una URL de propiedad.
    Retorna None si la propiedad debe descartarse en esta etapa.
    Retorna {"_error": msg} si hubo un problema de carga.
    """
    try:
        page.goto(url, timeout=30_000)
        page.wait_for_load_state("domcontentloaded", timeout=15_000)
        page.wait_for_timeout(2_000)
    except Exception as e:
        return {"_error": str(e), "url": url}

    # Descartar renta por URL
    if "/renta-de-" in url and "venta" not in url:
        return None

    # Título
    titulo = ""
    try:
        titulo = page.locator("h1").first.inner_text().strip()
    except Exception:
        pass

    # Texto principal
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

    txt_lower   = txt.lower()
    titulo_lower = titulo.lower()

    # Filtro venta
    es_venta = (
        "venta" in url.lower()
        or "venta" in titulo_lower
        or "a la venta" in txt_lower
        or "en venta" in txt_lower
    )
    if not es_venta:
        return None

    # Filtro apartamento
    if not ("apartamento" in titulo_lower or "apartamento" in txt_lower):
        return None

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

    # Precio fuera de rango → pasa al CSV con alerta, no se descarta
    if precio_usd and not (PRECIO_MIN <= precio_usd <= PRECIO_MAX):
        precio_usd = None

    # Área
    area_m2 = None
    m = re.search(r"(?:Área|Area|Construcción|Construccion|Tamaño|Tamano)\s*:?\s*([\d.]+)\s*m[²2]", txt, re.IGNORECASE)
    if not m:
        m = re.search(r"([\d.]+)\s*m[²2]", txt, re.IGNORECASE)
    if m:
        try:
            area_m2 = float(m.group(1))
        except ValueError:
            pass

    # Área fuera de rango → pasa al CSV con alerta
    if area_m2 and not (AREA_MIN <= area_m2 <= AREA_MAX):
        area_m2 = None

    # Precio/m² — solo calcular si ambos datos existen
    precio_m2 = None
    if precio_usd and area_m2:
        precio_m2 = round(precio_usd / area_m2)

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

    # Ubicación — texto antes de "Tegucigalpa"
    ubicacion_raw = ""
    m = re.search(r"([^\n,]{3,60}),\s*Tegucigalpa", txt, re.IGNORECASE)
    if m:
        ubicacion_raw = m.group(1).strip()

    # Proyecto desde título
    proyecto_texto = None
    m = re.search(r"(?:Torre|Distrito|Condominios|Residencial|Urbana)\s+[^\-–|,\n]{2,50}", titulo, re.IGNORECASE)
    if m:
        proyecto_texto = m.group(0).strip()[:80]

    calidad = "ALTA" if all([titulo, precio_usd, area_m2, habitaciones, banos]) else "MEDIA"

    return {
        "url":             url,
        "titulo":          titulo,
        "precio_usd":      precio_usd,
        "area_m2":         area_m2,
        "precio_m2":       precio_m2,
        "habitaciones":    habitaciones,
        "banos":           banos,
        "estacionamientos": estacionamientos,
        "tipo_inmueble":   "APARTAMENTO",
        "ubicacion_raw":   ubicacion_raw,
        "proyecto_texto":  proyecto_texto,
        "calidad_dato":    calidad,
    }


# ─────────────────────────────────────────────────────────────────────────────
# PROCESO: NORMALIZACIÓN + DEDUP + ESTADO
# ─────────────────────────────────────────────────────────────────────────────

def process_listing(raw: dict, aliases: dict, existing_urls: set, existing_fps: set) -> dict:
    url        = raw["url"]
    area_m2    = raw.get("area_m2")
    precio_usd = raw.get("precio_usd")

    # Resolver zona
    zone_id, zona_canonica, confianza, zona_motivo, ubicacion_norm = resolve_zone(
        raw.get("ubicacion_raw", ""), aliases
    )

    # Fingerprint — solo si confianza ALTA
    fingerprint = None
    if confianza == "ALTA" and zone_id:
        fingerprint = build_fingerprint(
            zone_id      = zone_id,
            colonia_norm = ubicacion_norm,
            tipo         = "APARTAMENTO",
            habitaciones = raw.get("habitaciones"),
            banos        = raw.get("banos"),
            area_m2      = area_m2,
        )

    # Alertas
    alertas = []
    if not area_m2:
        alertas.append("SIN_AREA")
    if not precio_usd:
        alertas.append("SIN_PRECIO")
    if not zone_id:
        alertas.append("ZONA_NO_MAPEADA")
    if precio_usd and precio_usd < 20_000:
        alertas.append("PRECIO_BAJO")
    if raw.get("precio_m2") and raw["precio_m2"] < 500:
        alertas.append("PRECIO_M2_SOSPECHOSO")
    if "renta" in url.lower() or "alquiler" in url.lower():
        alertas.append("POSIBLE_RENTA")
    if raw.get("titulo") and "preventa" in raw["titulo"].lower():
        alertas.append("POSIBLE_PREVENTA")

    # Estado y motivo
    match_listing_id = ""
    if url in existing_urls:
        estado        = "DUPLICADO_URL"
        match_motivo  = "URL ya existe en Supabase"
        fp_status     = "N/A"
    elif not zone_id or confianza == "BAJA":
        estado        = "REVISAR"
        match_motivo  = zona_motivo
        fp_status     = "SIN_ZONA"
    elif confianza == "MEDIA":
        estado        = "REVISAR"
        match_motivo  = f"Zona con confianza MEDIA: {zona_canonica or 'desconocida'}"
        fp_status     = "SIN_FINGERPRINT"
    elif fingerprint and fingerprint in existing_fps:
        estado        = "PROBABLE_DUPLICADO"
        match_listing_id = existing_fps[fingerprint]
        match_motivo  = f"Fingerprint coincide con listing {match_listing_id} en {zona_canonica}"
        fp_status     = "MATCH"
    elif not fingerprint:
        estado        = "REVISAR"
        match_motivo  = "Datos insuficientes para construir fingerprint"
        fp_status     = "INCOMPLETO"
    else:
        estado        = "NUEVO"
        match_motivo  = ""
        fp_status     = "OK"

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
        "area_m2":               area_m2,
        "precio_m2":             raw.get("precio_m2"),
        "habitaciones":          raw.get("habitaciones"),
        "banos":                 raw.get("banos"),
        "estacionamientos":      raw.get("estacionamientos"),
        "tipo_inmueble":         "APARTAMENTO",
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
    print("=" * 65)
    print("  Valorius Scraper — Rentify.hn")
    print(f"  Fecha  : {HOY}")
    print(f"  Output : {OUTPUT_CSV}")
    print("=" * 65)

    aliases = load_aliases()
    alias_count = sum(1 for k in aliases if not k.startswith("_"))
    print(f"Diccionario cargado: {alias_count} aliases\n")

    existing_urls, existing_fps = load_existing_data()

    results  = []
    errores  = []
    descartados = 0

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)

        property_urls = collect_property_urls(browser)
        total = len(property_urls)
        print(f"\nTotal URLs a procesar: {total}\n")

        page = browser.new_page()
        for i, url in enumerate(sorted(property_urls), start=1):
            print(f"[{i:3}/{total}] {url}")
            raw = extract_property(page, url)

            if raw is None:
                descartados += 1
                print("         → descartado (filtro)")
                continue
            if "_error" in raw:
                errores.append(url)
                print(f"         → error: {raw['_error']}")
                continue

            processed = process_listing(raw, aliases, existing_urls, existing_fps)
            results.append(processed)
            zona_label = processed["zona_canonica_sugerida"] or "SIN_ZONA"
            print(
                f"         → {processed['estado_revision']}"
                f" | {zona_label} ({processed['zona_match_confianza']})"
                f" | ${processed.get('precio_m2', 'N/A')}/m²"
            )

        page.close()
        browser.close()

    # Escribir CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(results)

    # Resumen final
    print("\n" + "=" * 65)
    print(f"  CSV generado : {OUTPUT_CSV}")
    print(f"  Procesados   : {len(results)}")
    print(f"  Descartados  : {descartados} (filtros de extracción)")
    print(f"  Errores      : {len(errores)}")
    print()
    estados = Counter(r["estado_revision"] for r in results)
    for estado, n in sorted(estados.items()):
        print(f"    {estado:<22} {n}")
    print()
    confianzas = Counter(r["zona_match_confianza"] for r in results)
    print("  Confianza zona:")
    for c, n in sorted(confianzas.items()):
        print(f"    {c:<22} {n}")
    print("=" * 65)

    if errores:
        print(f"\nURLs con error ({len(errores)}):")
        for u in errores:
            print(f"  {u}")


if __name__ == "__main__":
    main()
