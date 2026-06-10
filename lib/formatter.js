/**
 * formatter.js — Formateo de números para presentación visual
 *
 * Responsabilidad: Convertir números crudos a strings legibles (con comas, símbolos, etc).
 *
 * Principio: Input = números puros, Output = strings formateados.
 *
 * v1.0 — PHASE 1
 */

var NumberFormatter = (function() {
  'use strict';

  /**
   * formatCurrency(numero, simbolo)
   * Formatea número como moneda con separador de miles.
   *
   * @param {Number} numero
   * @param {String} simbolo — '$' (USD) o 'L' (LPS)
   * @returns {String} — ej: "$250,000" o "L 4,785,000"
   */
  function formatCurrency(numero, simbolo) {
    if (numero === null || numero === undefined || isNaN(numero)) {
      return simbolo || '$' + '0';
    }

    var formateado = Math.round(numero).toLocaleString('en-US');
    return (simbolo || '$') + formateado;
  }

  /**
   * formatPricePerSquareMeter(numero)
   * Formatea precio por m² con $ y comas.
   *
   * @param {Number} numero
   * @returns {String} — ej: "$1,500/m²"
   */
  function formatPricePerSquareMeter(numero) {
    if (numero === null || numero === undefined || isNaN(numero)) {
      return '$0/m²';
    }

    var formateado = Math.round(numero).toLocaleString('en-US');
    return '$' + formateado + '/m²';
  }

  /**
   * formatPercentage(decimal, precision)
   * Formatea decimal como porcentaje con signo.
   *
   * @param {Number} decimal — ej: 1.05 para +5%, 0.95 para -5%
   * @param {Number} precision — decimales (defecto: 1)
   * @returns {String} — ej: "+5.0%" o "-5.0%"
   */
  function formatPercentage(decimal, precision) {
    if (decimal === null || decimal === undefined || isNaN(decimal)) {
      return '0%';
    }

    precision = precision !== undefined ? precision : 1;
    var pct = ((decimal - 1) * 100).toFixed(precision);
    var signo = pct >= 0 ? '+' : '';
    return signo + pct + '%';
  }

  /**
   * formatIPRPercentage(ipr, precision)
   * Formatea IPR como diferencia porcentual.
   *
   * @param {Number} ipr — Índice (tu_pm2 / mediana)
   * @param {Number} precision — decimales
   * @returns {String} — ej: "+5.2%" o "-11.0%"
   */
  function formatIPRPercentage(ipr, precision) {
    if (ipr === null || ipr === undefined || isNaN(ipr)) {
      return '0%';
    }

    precision = precision !== undefined ? precision : 1;
    var pct = ((ipr - 1) * 100);
    var signo = pct >= 0 ? '+' : '';
    return signo + pct.toFixed(precision) + '%';
  }

  /**
   * formatArea(numero)
   * Formatea área en m².
   *
   * @param {Number} numero
   * @returns {String} — ej: "120 m²"
   */
  function formatArea(numero) {
    if (numero === null || numero === undefined || isNaN(numero)) {
      return '0 m²';
    }

    return Math.round(numero) + ' m²';
  }

  /**
   * formatRange(min, max, simbolo)
   * Formatea rango de precios.
   *
   * @param {Number} min
   * @param {Number} max
   * @param {String} simbolo
   * @returns {String} — ej: "$1,200 – $3,500/m²"
   */
  function formatRange(min, max, simbolo) {
    simbolo = simbolo || '$';
    var minStr = Math.round(min).toLocaleString('en-US');
    var maxStr = Math.round(max).toLocaleString('en-US');
    return simbolo + minStr + ' – ' + simbolo + maxStr + '/m²';
  }

  /**
   * formatForInput(numero)
   * Formatea número para input de precio (sin símbolo, con comas).
   * Ej: para llenar un <input> que muestra "250,000" sin símbolo.
   *
   * @param {Number} numero
   * @returns {String} — ej: "250,000"
   */
  function formatForInput(numero) {
    if (numero === null || numero === undefined || isNaN(numero)) {
      return '';
    }

    return Math.round(numero).toLocaleString('en-US');
  }

  /**
   * parseInputPrice(texto)
   * Invierte formatForInput: "250,000" → 250000
   *
   * @param {String} texto
   * @returns {Number}
   */
  function parseInputPrice(texto) {
    if (!texto || typeof texto !== 'string') {
      return 0;
    }

    // Eliminar todo excepto dígitos y decimales
    var digitos = texto.replace(/[^0-9.]/g, '');
    return parseFloat(digitos) || 0;
  }

  // ─── PUBLIC API ────────────────────────────────
  return {
    formatCurrency: formatCurrency,
    formatPricePerSquareMeter: formatPricePerSquareMeter,
    formatPercentage: formatPercentage,
    formatIPRPercentage: formatIPRPercentage,
    formatArea: formatArea,
    formatRange: formatRange,
    formatForInput: formatForInput,
    parseInputPrice: parseInputPrice
  };
})();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NumberFormatter;
}
