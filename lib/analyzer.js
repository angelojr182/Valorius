/**
 * analyzer.js — Orquestador principal (COORDINADOR, NO experto)
 *
 * Responsabilidad: Recibe input, delega a especialistas, devuelve resultado análisis.
 * No calcula detalles, solo orquesta.
 *
 * Dependencias (importadas en analizador.html):
 *   - ComparableSelector (lib/comparable.js)
 *   - InputValidator (lib/validator.js)
 *   - NumberFormatter (lib/formatter.js)
 *   - AnalyzerConstants (lib/constants.js)
 *
 * v1.0 — PHASE 1
 */

var PropertyAnalyzer = (function() {
  'use strict';

  /**
   * analyze(input, comparablesZona, comparablesColonia)
   * Orquesta el análisis completo.
   *
   * @param {Object} input — {
   *   tipo: 'APARTAMENTO' | 'CASA' | 'TERRENO',
   *   zoneId: UUID,
   *   coloniaId: UUID (opcional),
   *   area: Number (m²),
   *   precio: Number (USD),
   *   moneda: 'USD' | 'LPS',
   *   tasaLPS: Number (para conversión)
   * }
   * @param {Array} comparablesZona — [{ zona, tipo, n, mediana, p25, p75, min, max, items }]
   * @param {Array} comparablesColonia — [{ zona_id, colonia_id, tipo, n, mediana, items }]
   *
   * @returns {Object} — {
   *   isSuccess: Boolean,
   *   errores: [String],
   *   resultado: { // Si isSuccess
   *     veredicto: 'BAJO' | 'RANGO' | 'SOBRE' | 'REFERENCIA_LIMITADA',
   *     ipr: Number,
   *     iprInt: { categoria, clase, etiqueta },
   *     iaoInt: { categoria, etiqueta },
   *     nivel: 'colonia' | 'zona' | 'limitado',
   *     n: Number,
   *     mediana: Number,
   *     p25: Number,
   *     p75: Number,
   *     min: Number,
   *     max: Number,
   *     tuPM2: Number,
   *     desviacionPct: Number,
   *     // ... más campos
   *   }
   * }
   */
  function analyze(input, comparablesZona, comparablesColonia) {
    // Paso 1: VALIDAR entrada
    // (Se asume que InputValidator está disponible como global)
    if (typeof InputValidator === 'undefined') {
      return {
        isSuccess: false,
        errores: ['InputValidator no está disponible. Cargar lib/validator.js primero.']
      };
    }

    var validacion = InputValidator.validateInput(input);
    if (!validacion.isValid) {
      return {
        isSuccess: false,
        errores: validacion.problemas
      };
    }

    // Paso 2: RESOLVER comparables (fallback 3 niveles)
    // (Se asume que AnalyzerConstants está disponible)
    if (typeof AnalyzerConstants === 'undefined') {
      return {
        isSuccess: false,
        errores: ['AnalyzerConstants no está disponible. Cargar lib/constants.js primero.']
      };
    }

    var resComparables = resolverComparables(
      input.zoneId,
      input.coloniaId,
      input.tipo,
      comparablesZona,
      comparablesColonia
    );

    if (!resComparables || resComparables.n === 0) {
      return {
        isSuccess: false,
        errores: ['No hay propiedades similares registradas para analizar en los ultimos ' + AnalyzerConstants.DIAS_COMPARABLES + ' dias.']
      };
    }

    // Paso 3: CALCULAR métricas clave
    var tuPM2 = Math.round(input.precio / input.area);
    var mediana = resComparables.mediana;
    var ipr = tuPM2 / mediana;
    var desviacionPct = ((tuPM2 - mediana) / mediana) * 100;

    // Paso 4: INTERPRETAR IPR (veredicto)
    var iprInt = AnalyzerConstants.interpretarIPR(ipr);
    var iaoInt = AnalyzerConstants.interpretarIAO(resComparables.n);

    // Paso 5: RETORNAR resultado
    return {
      isSuccess: true,
      errores: [],
      resultado: {
        veredicto: iprInt.categoria.toUpperCase(),
        ipr: ipr,
        iprInt: iprInt,
        iaoInt: iaoInt,
        nivel: resComparables.nivel,
        n: resComparables.n,
        mediana: mediana,
        p25: resComparables.p25,
        p75: resComparables.p75,
        min: resComparables.min,
        max: resComparables.max,
        iqr: resComparables.iqr,
        tuPM2: tuPM2,
        desviacionPct: desviacionPct,
        signo: desviacionPct >= 0 ? '+' : '',
        precioMercado: Math.round(mediana * input.area),
        diferenciaPesos: Math.round(input.precio - (mediana * input.area)),
        modoLimitado: resComparables.nivel === 'limitado',
        nivelZona: resComparables.nivel === 'zona',
        // Metadatos de entrada
        zona: resComparables.zona,
        colonia: resComparables.colonia,
        zonaLabel: resComparables.zonaLabel,
        tipo: input.tipo,
        area: input.area,
        precio: input.precio,
        moneda: input.moneda
      }
    };
  }

  /**
   * resolverComparables(zoneId, coloniaId, tipo, comparablesZona, comparablesColonia)
   * Fallback de 3 niveles: colonia ≥3 → zona ≥3 → limitado.
   *
   * @returns {Object} — { zona, colonia, zonaLabel, nivel, n, mediana, p25, p75, min, max, iqr }
   */
  function resolverComparables(zoneId, coloniaId, tipo, comparablesZona, comparablesColonia) {
    // Buscar en colonia
    var cobCol = null;
    if (coloniaId && comparablesColonia && Array.isArray(comparablesColonia)) {
      cobCol = comparablesColonia.find(function(c) {
        return c.zone_id === zoneId && c.colonia_id === coloniaId && c.tipo === tipo;
      });
    }

    // Buscar en zona
    var cobZona = null;
    if (comparablesZona && Array.isArray(comparablesZona)) {
      cobZona = comparablesZona.find(function(c) {
        return c.zone_id === zoneId && c.tipo === tipo;
      });
    }

    var nCol = cobCol ? cobCol.n : 0;

    // Fallback: colonia ≥3 → zona ≥3 → limitado
    var resultado;
    if (cobCol && nCol >= AnalyzerConstants.COMPARABLES.MIN) {
      resultado = {
        zona: cobCol.zona || '',
        colonia: cobCol.colonia || '',
        zonaLabel: cobCol.zona + (cobCol.colonia ? ' · ' + cobCol.colonia : ''),
        nivel: 'colonia',
        n: nCol,
        mediana: cobCol.mediana,
        p25: cobCol.p25,
        p75: cobCol.p75,
        min: cobCol.min,
        max: cobCol.max,
        iqr: cobCol.iqr
      };
    } else if (cobZona && cobZona.n >= AnalyzerConstants.COMPARABLES.MIN) {
      resultado = {
        zona: cobZona.zona || '',
        colonia: nCol > 0 ? cobCol.colonia || '' : '',
        zonaLabel: cobZona.zona,
        nivel: 'zona',
        n: cobZona.n,
        mediana: cobZona.mediana,
        p25: cobZona.p25,
        p75: cobZona.p75,
        min: cobZona.min,
        max: cobZona.max,
        iqr: cobZona.iqr
      };
    } else {
      // Modo limitado: usar lo que haya (zona o colonia)
      var cob = cobZona || cobCol;
      resultado = {
        zona: cob ? (cob.zona || '') : '',
        colonia: nCol > 0 ? (cobCol ? cobCol.colonia || '' : '') : '',
        zonaLabel: cob ? cob.zona || '' : '',
        nivel: 'limitado',
        n: cob ? cob.n : 0,
        mediana: cob ? cob.mediana : null,
        p25: cob ? cob.p25 : null,
        p75: cob ? cob.p75 : null,
        min: cob ? cob.min : null,
        max: cob ? cob.max : null,
        iqr: cob ? cob.iqr : null
      };
    }

    return resultado;
  }

  /**
   * checkAtipicoRatio(tuPM2, mediana, umbral)
   * Detecta si el precio es atípico (ratio > umbral o < 1/umbral).
   *
   * @param {Number} tuPM2
   * @param {Number} mediana
   * @param {Number} umbral — defecto 1.8
   * @returns {Boolean}
   */
  function checkAtipicoRatio(tuPM2, mediana, umbral) {
    umbral = umbral || 1.8;
    if (!mediana || mediana === 0) return false;
    var ratio = tuPM2 / mediana;
    return ratio > umbral || ratio < (1 / umbral);
  }

  // ─── PUBLIC API ────────────────────────────────
  return {
    analyze: analyze,
    resolverComparables: resolverComparables,
    checkAtipicoRatio: checkAtipicoRatio
  };
})();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PropertyAnalyzer;
}
