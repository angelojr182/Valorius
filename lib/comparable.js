/**
 * comparable.js — El CORAZÓN del analizador
 *
 * Responsabilidad: Seleccionar comparables, filtrar outliers, calcular estadísticas.
 * NO se ocupa de UI, validación de entrada, ni formateo de output.
 *
 * Principio: Función PURA — mismo input → siempre mismo output.
 *
 * v1.0 — PHASE 1 extracción
 */

/**
 * ComparableSelector — Experto en seleccionar y analizar comparables
 */
var ComparableSelector = (function() {
  'use strict';

  // ─── CONFIGURACION (desde constants) ──────────────────────────
  // Estos valores se importarán desde constants.js en FASE 1-B3
  const DIAS_COMPARABLES = 100;
  const MIN_COMPARABLES = 3;
  const OUTLIER_FACTOR = 1.8;

  /**
   * filterByDate(items, dias)
   * Filtra items que estén dentro de los últimos N días.
   *
   * @param {Array} items — array de listings con fecha_registro (YYYY-MM-DD)
   * @param {Number} dias — lookback en días (ej: 100)
   * @returns {Array} — items dentro del período
   */
  function filterByDate(items, dias) {
    if (!items || !Array.isArray(items)) return [];
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dias);
    return items.filter(function(item) {
      if (!item.fecha_registro) return false;
      var itemDate = new Date(item.fecha_registro);
      return itemDate >= cutoffDate;
    });
  }

  /**
   * filterByArea(items, tipo, RANGOS_AREA)
   * Filtra items por área válida según tipo.
   *
   * @param {Array} items — array de listings
   * @param {String} tipo — 'APARTAMENTO', 'CASA', 'TERRENO'
   * @param {Object} RANGOS_AREA — { APARTAMENTO: {min, max}, CASA: {min, max}, ... }
   * @returns {Array} — items con área dentro del rango
   */
  function filterByArea(items, tipo, RANGOS_AREA) {
    if (!items || !Array.isArray(items)) return [];
    var rango = RANGOS_AREA[tipo] || { min: 25, max: 1200 };
    return items.filter(function(item) {
      var area = item.area_construccion;
      return area && area >= rango.min && area <= rango.max;
    });
  }

  /**
   * detectOutliers(prices, factor)
   * Detecta outliers usando IQR (Interquartile Range).
   *
   * @param {Array} prices — array de números (precio/m²)
   * @param {Number} factor — factor de IQR (ej: 1.8)
   * @returns {Object} — { inliers: Array, outliers: Array }
   */
  function detectOutliers(prices, factor) {
    if (!prices || prices.length === 0) {
      return { inliers: [], outliers: [] };
    }

    // Ordenar
    var sorted = prices.slice().sort(function(a, b) { return a - b; });
    var n = sorted.length;

    // Calcular Q1 (percentil 25) y Q3 (percentil 75)
    var q1Index = Math.floor(n * 0.25);
    var q3Index = Math.floor(n * 0.75);
    var q1 = sorted[q1Index];
    var q3 = sorted[q3Index];
    var iqr = q3 - q1;

    // Límites
    var lowerBound = q1 - factor * iqr;
    var upperBound = q3 + factor * iqr;

    // Clasificar
    var inliers = [], outliers = [];
    prices.forEach(function(price) {
      if (price >= lowerBound && price <= upperBound) {
        inliers.push(price);
      } else {
        outliers.push(price);
      }
    });

    return { inliers: inliers, outliers: outliers, q1: q1, q3: q3, iqr: iqr };
  }

  /**
   * calculateStats(prices)
   * Calcula mediana, p25, p75, min, max.
   *
   * @param {Array} prices — array de números (precio/m²)
   * @returns {Object} — { mediana, p25, p75, min, max, count }
   */
  function calculateStats(prices) {
    if (!prices || prices.length === 0) {
      return { mediana: null, p25: null, p75: null, min: null, max: null, count: 0 };
    }

    var sorted = prices.slice().sort(function(a, b) { return a - b; });
    var n = sorted.length;

    // Mediana
    var mediana = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    // Percentiles
    var p25Index = Math.floor(n * 0.25);
    var p75Index = Math.floor(n * 0.75);
    var p25 = sorted[p25Index];
    var p75 = sorted[p75Index];

    return {
      mediana: mediana,
      p25: p25,
      p75: p75,
      min: sorted[0],
      max: sorted[n - 1],
      count: n
    };
  }

  /**
   * selectComparables(listings, tipo, RANGOS_AREA, dias, outlierFactor)
   * Pipeline completo: filtra por fecha, área; detecta outliers; calcula stats.
   *
   * @param {Array} listings — array de listings crudos
   * @param {String} tipo — 'APARTAMENTO', 'CASA', 'TERRENO'
   * @param {Object} RANGOS_AREA — rango de áreas válidas por tipo
   * @param {Number} dias — período lookback (defecto: 100)
   * @param {Number} outlierFactor — factor IQR (defecto: 1.8)
   * @returns {Object} — {
   *   items: [filtered comparable items],
   *   prices_m2: [inlier prices],
   *   outlier_count: number,
   *   stats: { mediana, p25, p75, min, max, count },
   *   n: count (alias para stats.count)
   * }
   */
  function selectComparables(listings, tipo, RANGOS_AREA, dias, outlierFactor) {
    dias = dias || DIAS_COMPARABLES;
    outlierFactor = outlierFactor || OUTLIER_FACTOR;

    // Paso 1: Filtrar por fecha
    var byDate = filterByDate(listings, dias);

    // Paso 2: Filtrar por área válida
    var byArea = filterByArea(byDate, tipo, RANGOS_AREA);

    // Paso 3: Extraer precios/m²
    var prices = byArea.map(function(item) {
      if (!item.area_construccion || item.area_construccion <= 0) return null;
      var pm2 = item.precio_usd / item.area_construccion;
      return isNaN(pm2) || !isFinite(pm2) ? null : pm2;
    }).filter(function(p) { return p !== null; });

    // Paso 4: Detectar outliers
    var outlierResult = detectOutliers(prices, outlierFactor);

    // Paso 5: Estadísticas sobre inliers
    var stats = calculateStats(outlierResult.inliers);

    return {
      items: byArea,  // Items filtrados (se usarán en gráfico)
      prices_m2: outlierResult.inliers,  // Precios/m² sin outliers
      outlier_count: outlierResult.outliers.length,
      stats: stats,
      n: stats.count,  // Alias para comodidad
      mediana: stats.mediana,
      p25: stats.p25,
      p75: stats.p75,
      min: stats.min,
      max: stats.max,
      iqr: outlierResult.iqr
    };
  }

  // ─── PUBLIC API ────────────────────────────────
  return {
    filterByDate: filterByDate,
    filterByArea: filterByArea,
    detectOutliers: detectOutliers,
    calculateStats: calculateStats,
    selectComparables: selectComparables,

    // Constantes (exportadas para que puedas conocerlas sin hardcodear)
    DIAS_COMPARABLES: DIAS_COMPARABLES,
    MIN_COMPARABLES: MIN_COMPARABLES,
    OUTLIER_FACTOR: OUTLIER_FACTOR
  };
})();

// Exportar para Node.js (si aplica) o usar como global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComparableSelector;
}
