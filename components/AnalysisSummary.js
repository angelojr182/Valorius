/**
 * AnalysisSummary.js — Bloque de veredicto y métricas (sin gauge)
 *
 * Responsabilidad: Presentar datos ya calculados por el motor.
 * NO calcula IPR, veredicto, ni confianza. Solo renderiza.
 *
 * Props: { veredicto, iprInt, iaoInt, tuPM2, mediana, p25, p75, n, zonaLabel }
 * Métodos: render(), mount(), update()
 *
 * v1.0 — PHASE 3-C1 (sin gauge SVG)
 */

var AnalysisSummary = (function() {
  'use strict';

  /**
   * render(props)
   * Genera HTML para el resumen de análisis.
   * IMPORTANTE: Solo presenta datos. NO calcula nada.
   *
   * @param {Object} props — {
   *   veredicto: String,          // 'BAJO' | 'RANGO' | 'SOBRE' (calculado por motor)
   *   iprInt: Object,             // { categoria, etiqueta } (calculado por motor)
   *   iaoInt: Object,             // { categoria, etiqueta } (calculado por motor)
   *   tuPM2: Number,              // precio/m² del usuario
   *   mediana: Number,            // precio/m² mediana
   *   p25: Number,                // percentil 25 (puede ser null)
   *   p75: Number,                // percentil 75 (puede ser null)
   *   n: Number,                  // cantidad de comparables
   *   zonaLabel: String           // nombre zona · colonia
   * }
   * @returns {String} HTML
   */
  function render(props) {
    // Validar props
    if (!props) {
      console.warn('[AnalysisSummary] Props vacíos');
      return '<div class="analysis-summary-error">Error: datos faltantes</div>';
    }

    var veredicto = props.veredicto || 'NO DISPONIBLE';
    var iprInt = props.iprInt || {};
    var iaoInt = props.iaoInt || {};
    var tuPM2 = props.tuPM2 || 0;
    var mediana = props.mediana || 0;
    var p25 = props.p25;
    var p75 = props.p75;
    var n = props.n || 0;
    var zonaLabel = props.zonaLabel || 'Zona desconocida';

    // Color según veredicto
    var vrdColor = '#cbd5e1'; // neutral por defecto
    if (veredicto === 'BAJO') {
      vrdColor = '#10b981'; // verde
    } else if (veredicto === 'SOBRE') {
      vrdColor = '#ef4444'; // rojo
    } else if (veredicto === 'RANGO') {
      vrdColor = '#f59e0b'; // ámbar
    }

    // Rango disponible?
    var rangoDisponible = p25 !== null && p25 !== undefined && p75 !== null && p75 !== undefined;
    var rangoText = rangoDisponible
      ? '$' + Math.round(p25).toLocaleString() + ' - $' + Math.round(p75).toLocaleString()
      : 'Sin rango suficiente';

    // Advertencia si pocas muestras
    var advertenciaBajaN = n < 3 ? ' ⚠️ Muestra baja' : '';

    var html = '';
    html += '<div class="analysis-summary">';

    // Veredicto principal
    html += '  <div class="as-veredicto" style="border-left-color: ' + vrdColor + '">';
    html += '    <div class="as-vrd-label">Veredicto</div>';
    html += '    <div class="as-vrd-value" style="color: ' + vrdColor + '">' + veredicto + '</div>';
    if (iprInt.etiqueta) {
      html += '    <div class="as-vrd-subtitle">' + iprInt.etiqueta + '</div>';
    }
    html += '  </div>';

    // Métricas grid
    html += '  <div class="as-metrics-grid">';

    html += '    <div class="as-metric">';
    html += '      <div class="as-metric-label">Tu precio/m²</div>';
    html += '      <div class="as-metric-value">$' + Math.round(tuPM2).toLocaleString() + '</div>';
    html += '    </div>';

    html += '    <div class="as-metric">';
    html += '      <div class="as-metric-label">Mediana zona</div>';
    html += '      <div class="as-metric-value">$' + Math.round(mediana).toLocaleString() + '</div>';
    html += '    </div>';

    html += '    <div class="as-metric">';
    html += '      <div class="as-metric-label">Rango</div>';
    html += '      <div class="as-metric-value" style="font-size: 13px;">' + rangoText + '</div>';
    html += '    </div>';

    html += '  </div>';

    // Confianza + zona + muestra
    html += '  <div class="as-footer">';

    html += '    <div class="as-footer-item">';
    html += '      <span class="as-label">Confianza</span>';
    if (iaoInt.etiqueta) {
      html += '      <span class="as-value">' + iaoInt.etiqueta + '</span>';
    } else {
      html += '      <span class="as-value">No disponible</span>';
    }
    html += '    </div>';

    html += '    <div class="as-footer-item">';
    html += '      <span class="as-label">Zona</span>';
    html += '      <span class="as-value">' + zonaLabel + '</span>';
    html += '    </div>';

    html += '    <div class="as-footer-item">';
    html += '      <span class="as-label">Muestra</span>';
    html += '      <span class="as-value">' + n + ' comparables' + advertenciaBajaN + '</span>';
    html += '    </div>';

    html += '  </div>';

    html += '</div>';

    return html;
  }

  /**
   * mount(elementId, props)
   * Inyecta el componente en un elemento DOM.
   *
   * @param {String} elementId — ID del elemento contenedor
   * @param {Object} props — datos ya calculados por el analizador
   */
  function mount(elementId, props) {
    var element = document.getElementById(elementId);
    if (!element) {
      console.error('[AnalysisSummary] Elemento no encontrado:', elementId);
      return;
    }

    var html = render(props);
    element.innerHTML = html;
  }

  /**
   * update(elementId, props)
   * Actualiza el componente sin remount completo.
   *
   * @param {String} elementId
   * @param {Object} props — datos nuevos
   */
  function update(elementId, props) {
    mount(elementId, props);
  }

  // ─── PUBLIC API ────────────────────────────────
  return {
    render: render,
    mount: mount,
    update: update
  };
})();

// Exportar para Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalysisSummary;
}

// Exportar para navegador (window)
if (typeof window !== 'undefined') {
  window.AnalysisSummary = AnalysisSummary;
}
