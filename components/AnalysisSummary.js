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
   * generateGaugeSVG(ipr)
   * Genera SVG del gauge circular que muestra IPR.
   * Decorativo — la fuente de verdad es el veredicto.
   *
   * @param {Number} ipr — índice de precio relativo (0-2.0)
   * @returns {String} SVG HTML
   */
  function generateGaugeSVG(ipr) {
    // Validar IPR
    var safeIPR = (ipr && typeof ipr === 'number' && !isNaN(ipr)) ? ipr : 1.0;
    safeIPR = Math.max(0, Math.min(2.0, safeIPR)); // Clamp 0-2.0

    // Convertir IPR (0-2.0) a ángulo (0-180°)
    // 0 = 0°, 1.0 = 90°, 2.0 = 180°
    var angle = (safeIPR / 2.0) * 180;
    var radians = (angle - 90) * Math.PI / 180;

    // Centro del gauge
    var cx = 110, cy = 110;
    var radius = 80;

    // Punta de la aguja
    var px = cx + radius * Math.cos(radians);
    var py = cy + radius * Math.sin(radians);

    var svg = '';
    svg += '<svg viewBox="0 0 220 220" class="as-gauge">';

    // Fondo círculo
    svg += '  <circle cx="110" cy="110" r="100" class="gauge-bg"/>';

    // Zonas coloreadas (0-180°)
    // BAJO: 0-60° (IPR 0-0.67) — verde
    svg += '  <path d="M 110,110 L 110,10 A 100,100 0 0,1 186.6,33.4" class="gauge-zone gauge-bajo"/>';
    // RANGO: 60-120° (IPR 0.67-1.33) — ámbar
    svg += '  <path d="M 110,110 L 186.6,33.4 A 100,100 0 0,1 33.4,186.6" class="gauge-zone gauge-rango"/>';
    // SOBRE: 120-180° (IPR 1.33-2.0) — rojo
    svg += '  <path d="M 110,110 L 33.4,186.6 A 100,100 0 0,1 110,210" class="gauge-zone gauge-sobre"/>';

    // Eje vertical (referencia 1.0)
    svg += '  <line x1="110" y1="20" x2="110" y2="200" class="gauge-axis"/>';

    // Aguja
    svg += '  <line x1="110" y1="110" x2="' + px + '" y2="' + py + '" class="gauge-needle"/>';
    svg += '  <circle cx="110" cy="110" r="6" class="gauge-center"/>';

    // Etiquetas
    svg += '  <text x="50" y="35" class="gauge-label">BAJO</text>';
    svg += '  <text x="140" y="185" class="gauge-label">SOBRE</text>';
    svg += '  <text x="110" y="225" class="gauge-value" text-anchor="middle">IPR ' + safeIPR.toFixed(2) + '</text>';

    svg += '</svg>';

    return svg;
  }

  /**
   * render(props)
   * Genera HTML para el resumen de análisis CON gauge.
   * IMPORTANTE: Solo presenta datos. NO calcula nada.
   *
   * @param {Object} props — {
   *   veredicto: String,          // 'BAJO' | 'RANGO' | 'SOBRE' (calculado por motor)
   *   ipr: Number,                // índice precio relativo (0-2.0)
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
    var ipr = props.ipr || 1.0;
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

    // Veredicto + Gauge en fila
    html += '  <div class="as-top-row">';

    // Veredicto principal
    html += '    <div class="as-veredicto" style="border-left-color: ' + vrdColor + '">';
    html += '      <div class="as-vrd-label">Veredicto</div>';
    html += '      <div class="as-vrd-value" style="color: ' + vrdColor + '">' + veredicto + '</div>';
    if (iprInt.etiqueta) {
      html += '      <div class="as-vrd-subtitle">' + iprInt.etiqueta + '</div>';
    }
    html += '    </div>';

    // Gauge SVG
    html += '    <div class="as-gauge-container">';
    html += generateGaugeSVG(ipr);
    html += '    </div>';

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
