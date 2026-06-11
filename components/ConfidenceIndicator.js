/**
 * ConfidenceIndicator.js — Badge de cobertura + alerta de confianza
 *
 * Responsabilidad: Mostrar número de comparables + advertencia si pocas referencias.
 *
 * Props: { n, modoLimitado, nivel }
 * Métodos: render(), mount(), update()
 *
 * v1.0 — PHASE 3-A
 */

var ConfidenceIndicator = (function() {
  'use strict';

  /**
   * render(props)
   * Genera HTML para el indicador de confianza.
   * IMPORTANTE: Solo presenta datos. NO calcula nada.
   *
   * @param {Object} props — {
   *   n: Number,                    // cantidad de comparables
   *   modoLimitado: Boolean,         // si análisis es limitado
   *   nivel: String                  // 'colonia', 'zona', 'limitado'
   * }
   * @returns {String} HTML
   */
  function render(props) {
    // Validar que props no sean undefined/null
    if (!props) {
      console.warn('[ConfidenceIndicator] Props vacíos');
      return '<div class="confidence-indicator">Error: datos faltantes</div>';
    }

    var n = props.n || 0;
    var modoLimitado = props.modoLimitado || false;
    var nivel = props.nivel || '';

    var badgeClass = 'conf-badge';
    var badgeColor = 'gold';

    if (n >= 5) {
      badgeColor = 'gold';
    } else if (n >= 3) {
      badgeColor = 'orange';
    } else {
      badgeColor = 'red';
    }

    var badgeLabel = n + ' ' + (n === 1 ? 'propiedad' : 'propiedades') + ' similar' + (n === 1 ? '' : 'es');

    var html = '';
    html += '<div class="confidence-indicator">';
    html += '  <div class="' + badgeClass + ' badge-' + badgeColor + '">';
    html += '    <span class="badge-number">' + n + '</span>';
    html += '    <span class="badge-label">' + badgeLabel + '</span>';
    html += '  </div>';

    if (modoLimitado) {
      html += '  <div class="conf-alert conf-alert-warning">';
      html += '    <span class="alert-icon">⚠️</span>';
      html += '    <span class="alert-text">Pocas referencias — análisis orientativo</span>';
      html += '  </div>';
    }

    if (nivel === 'limitado') {
      html += '  <div class="conf-alert conf-alert-info">';
      html += '    <span class="alert-icon">ℹ️</span>';
      html += '    <span class="alert-text">Datos a nivel zona (sin colonia específica)</span>';
      html += '  </div>';
    }

    html += '</div>';

    return html;
  }

  /**
   * mount(elementId, props)
   * Inyecta el componente en un elemento DOM.
   *
   * @param {String} elementId — ID del elemento contenedor
   * @param {Object} props — { n, modoLimitado, nivel }
   */
  function mount(elementId, props) {
    var element = document.getElementById(elementId);
    if (!element) {
      console.error('[ConfidenceIndicator] Elemento no encontrado:', elementId);
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
   * @param {Object} props — { n, modoLimitado, nivel }
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
  module.exports = ConfidenceIndicator;
}

// Exportar para navegador (window)
if (typeof window !== 'undefined') {
  window.ConfidenceIndicator = ConfidenceIndicator;
}
