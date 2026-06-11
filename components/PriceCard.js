/**
 * PriceCard.js — Tarjeta de precio: tu propiedad vs precio de mercado
 *
 * Responsabilidad: Mostrar precio/m² del usuario vs mediana de zona.
 * Indica si está por encima, en rango o por debajo del mercado.
 *
 * Props: { tuPM2, area, precio, mediana, desv }
 * Métodos: render(), mount(), update()
 *
 * v1.0 — PHASE 3-B
 */

var PriceCard = (function() {
  'use strict';

  /**
   * render(tuPM2, area, precio, mediana, desv)
   * Genera HTML para la tarjeta de precio.
   *
   * @param {Number} tuPM2 — precio/m² del usuario
   * @param {Number} area — área en m²
   * @param {Number} precio — precio total USD
   * @param {Number} mediana — precio/m² mediana de zona
   * @param {Number} desv — desviación porcentual (-50 a +50)
   * @returns {String} HTML
   */
  function render(tuPM2, area, precio, mediana, desv) {
    var pctAbsDiff = Math.abs(desv).toFixed(1);
    var signo = desv >= 0 ? '+' : '';

    // Color dinámico según desviación
    var cardClass = 'price-card';
    var borderColor = '#cbd5e1'; // neutral

    if (desv < -15) {
      borderColor = '#10b981'; // verde — bajo
      cardClass += ' pc-bajo';
    } else if (desv > 15) {
      borderColor = '#ef4444'; // rojo — alto
      cardClass += ' pc-sobre';
    } else {
      borderColor = '#f59e0b'; // ámbar — rango
      cardClass += ' pc-rango';
    }

    var html = '';
    html += '<div class="' + cardClass + '" style="border-left-color: ' + borderColor + '">';
    html += '  <div class="pc-header">';
    html += '    <span class="pc-label">Tu propiedad</span>';
    html += '  </div>';
    html += '  <div class="pc-content">';
    html += '    <div class="pc-value">$' + Math.round(tuPM2).toLocaleString() + '/m²</div>';
    html += '    <div class="pc-meta">';
    html += '      <span class="pc-area">' + Math.round(area) + ' m²</span>';
    html += '      <span class="pc-separator">·</span>';
    html += '      <span class="pc-total">$' + Math.round(precio).toLocaleString() + '</span>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="pc-footer">';
    html += '    <div class="pc-diff" style="color: ' + borderColor + '">';
    html += '      <span class="pc-diff-value">' + signo + pctAbsDiff + '%</span>';
    html += '      <span class="pc-diff-label">vs mediana</span>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    return html;
  }

  /**
   * mount(elementId, data)
   * Inyecta el componente en un elemento DOM.
   *
   * @param {String} elementId — ID del elemento contenedor
   * @param {Object} data — { tuPM2, area, precio, mediana, desv }
   */
  function mount(elementId, data) {
    var element = document.getElementById(elementId);
    if (!element) {
      console.error('[PriceCard] Elemento no encontrado:', elementId);
      return;
    }

    var html = render(data.tuPM2, data.area, data.precio, data.mediana, data.desv);
    element.innerHTML = html;
  }

  /**
   * update(elementId, data)
   * Actualiza el componente sin remount completo.
   *
   * @param {String} elementId
   * @param {Object} data — { tuPM2, area, precio, mediana, desv }
   */
  function update(elementId, data) {
    // Para este componente, remount es seguro
    mount(elementId, data);
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
  module.exports = PriceCard;
}

// Exportar para navegador (window)
if (typeof window !== 'undefined') {
  window.PriceCard = PriceCard;
}
