/**
 * constants.js — Números duros y configuración del analizador
 *
 * Responsabilidad: Una sola fuente de verdad para reglas de negocio.
 * Cambiar un número aquí afecta TODO automáticamente.
 *
 * Principio: Usar CÓDIGOS ESTABLES (APARTAMENTO, CASA, TERRENO), no UUIDs.
 *
 * v1.0 — PHASE 1
 */

var AnalyzerConstants = (function() {
  'use strict';

  // ─── PRECIOS ──────────────────────────────────────────────────
  var PRECIOS = {
    MIN: 20000,        // USD mínimo válido
    MAX: 5000000,      // USD máximo válido
    MAX_OBSERVABLE_PM2: 4000  // Sanity warning si > esto/m²
  };

  // ─── ÁREAS POR TIPO ────────────────────────────────────────────
  var RANGOS_AREA = {
    'APARTAMENTO': { min: 25, max: 600 },
    'CASA': { min: 45, max: 1200 },
    'TERRENO': { min: 100, max: 5000 }
  };

  // ─── PERÍODO DE DATOS ──────────────────────────────────────────
  var DIAS_COMPARABLES = 100;  // Lookback para comparables

  // ─── CANTIDAD DE COMPARABLES ──────────────────────────────────
  var COMPARABLES = {
    MIN: 3,      // Mínimo para analizar
    IDEAL: 15    // A partir de aquí confianza ALTA
  };

  // ─── ÍNDICE DE PRECIO RELATIVO (IPR) ───────────────────────────
  var IPR_THRESHOLDS = {
    BAJO: 0.85,   // < 0.85 = BAJO (gana ≥15%)
    ALTO: 1.15    // > 1.15 = SOBRE (caro ≥15%)
    // 0.85 a 1.15 = RANGO (normal, ±15%)
  };

  // ─── DETECCIÓN DE OUTLIERS ────────────────────────────────────
  var OUTLIER_FACTOR = 1.8;  // Factor IQR

  // ─── MONEDAS ──────────────────────────────────────────────────
  var MONEDAS = {
    USD: 'USD',
    LPS: 'LPS'
  };

  // ─── TIPOS DE INMUEBLE ─────────────────────────────────────────
  // NOTA: En DB estos se mapean a UUIDs, pero la lógica usa estos códigos
  var TIPOS_INMUEBLE = {
    APARTAMENTO: 'APARTAMENTO',
    CASA: 'CASA',
    TERRENO: 'TERRENO'
  };

  // ─── SEVERIDAD DE ALERTAS ─────────────────────────────────────
  // f(desviación %, cobertura)
  var ALERTA_SEVERIDAD = {
    EXTREMO: 'EXTREMO',
    MODERADO: 'MODERADO',
    LEVE: 'LEVE'
  };

  /**
   * getSeveridad(pctDesviacion, numComparables)
   * Determina severidad de alerta según desviación y cobertura.
   *
   * @param {Number} pctDesviacion — % de diferencia (positivo o negativo)
   * @param {Number} numComparables — cantidad de referencias
   * @returns {String} — 'EXTREMO', 'MODERADO', o 'LEVE'
   */
  function getSeveridad(pctDesviacion, numComparables) {
    var abs = Math.abs(pctDesviacion);
    var cobAlta = numComparables >= 10;
    var cobMedia = numComparables >= 5;

    if (abs >= 100) {
      return cobAlta || cobMedia ? ALERTA_SEVERIDAD.EXTREMO : ALERTA_SEVERIDAD.MODERADO;
    }
    if (abs >= 60) {
      return cobAlta ? ALERTA_SEVERIDAD.MODERADO : ALERTA_SEVERIDAD.LEVE;
    }
    return ALERTA_SEVERIDAD.LEVE;
  }

  /**
   * interpretarIPR(ipr)
   * Clasifica IPR en categoría + etiqueta legible.
   *
   * @param {Number} ipr — Índice de Precio Relativo (tu_pm2 / mediana)
   * @returns {Object} — { categoria, clase, etiqueta, color }
   */
  function interpretarIPR(ipr) {
    if (!ipr) {
      return {
        categoria: 'ref',
        clase: 'vrd-ref',
        etiqueta: 'Referencia limitada',
        color: [100, 116, 139]  // slate
      };
    }

    if (ipr < IPR_THRESHOLDS.BAJO) {
      return {
        categoria: 'bajo',
        clase: 'vrd-bajo',
        etiqueta: 'Por debajo del mercado observable',
        color: [16, 185, 129]  // green
      };
    }

    if (ipr <= IPR_THRESHOLDS.ALTO) {
      return {
        categoria: 'rango',
        clase: 'vrd-rango',
        etiqueta: 'Dentro del rango observable',
        color: [226, 176, 92]  // amber
      };
    }

    return {
      categoria: 'sobre',
      clase: 'vrd-sobre',
      etiqueta: 'Por encima del mercado observable',
      color: [239, 68, 68]  // red
    };
  }

  /**
   * interpretarIAO(n)
   * Clasifica Actividad Observable según cantidad de comparables.
   *
   * @param {Number} n — número de comparables
   * @returns {Object} — { categoria, icono, etiqueta, descripcion }
   */
  function interpretarIAO(n) {
    if (n <= 3) {
      return {
        categoria: 'baja',
        clase: 'iao-baja',
        icono: '○',
        etiqueta: 'Actividad baja',
        descripcion: n + ' propiedad' + (n === 1 ? '' : 'es') + ' similar' + (n === 1 ? '' : 'es') + ' detectada' + (n === 1 ? '' : 's') + ' en los ultimos ' + DIAS_COMPARABLES + ' dias. Pocas referencias disponibles en esta zona.'
      };
    }

    if (n <= 8) {
      return {
        categoria: 'moderada',
        clase: 'iao-media',
        icono: '◎',
        etiqueta: 'Actividad moderada',
        descripcion: n + ' propiedades similares detectadas en los ultimos ' + DIAS_COMPARABLES + ' dias. Contexto de referencia razonable.'
      };
    }

    return {
      categoria: 'alta',
      clase: 'iao-alta',
      icono: '●',
      etiqueta: 'Actividad alta',
      descripcion: n + ' propiedades similares detectadas en los ultimos ' + DIAS_COMPARABLES + ' dias. Buena base de comparacion disponible.'
    };
  }

  // ─── PUBLIC API ────────────────────────────────
  return {
    // Configuración
    PRECIOS: PRECIOS,
    RANGOS_AREA: RANGOS_AREA,
    DIAS_COMPARABLES: DIAS_COMPARABLES,
    COMPARABLES: COMPARABLES,
    IPR_THRESHOLDS: IPR_THRESHOLDS,
    OUTLIER_FACTOR: OUTLIER_FACTOR,
    MONEDAS: MONEDAS,
    TIPOS_INMUEBLE: TIPOS_INMUEBLE,
    ALERTA_SEVERIDAD: ALERTA_SEVERIDAD,

    // Funciones de interpretación
    getSeveridad: getSeveridad,
    interpretarIPR: interpretarIPR,
    interpretarIAO: interpretarIAO
  };
})();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyzerConstants;
}
