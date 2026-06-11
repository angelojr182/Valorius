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
   * render(props)
   * Genera HTML para la tarjeta de precio.
   * IMPORTANTE: Solo presenta datos. NO calcula nada.
   *
   * @param {Object} props — {
   *   userPriceM2: Number,        // precio/m² del usuario (calculado por motor)
   *   areaM2: Number,             // área en m²
   *   totalPrice: Number,         // precio total USD
   *   medianPriceM2: Number,      // precio/m² mediana (calculado por motor)
   *   deviationPct: Number        // desviación % (calculado por motor, -100 a +100)
   * }
   * @returns {String} HTML
   */
  function render(props) {
    // Validar que props no sean undefined/null
    if (!props) {
      console.warn('[PriceCard] Props vacíos');
      return '<div class="price-card">Error: datos faltantes</div>';
    }

    var userPriceM2 = props.userPriceM2 || 0;
    var areaM2 = props.areaM2 || 0;
    var totalPrice = props.totalPrice || 0;
    var deviationPct = props.deviationPct || 0;

    var pctAbsDiff = Math.abs(deviationPct).toFixed(1);
    var signo = deviationPct >= 0 ? '+' : '';

    // Color según desviación (lógica visual SOLO)
    var cardClass = 'price-card';
    var borderColor = '#cbd5e1'; // neutral por defecto

    if (deviationPct < -35) {
      // Muy bajo — alerta roja
      borderColor = '#ef4444';
      cardClass += ' pc-critical';
    } else if (deviationPct < -15) {
      // Bajo moderado — ámbar
      borderColor = '#f59e0b';
      cardClass += ' pc-low';
    } else if (deviationPct > 15) {
      // Sobre rango — rojo
      borderColor = '#ef4444';
      cardClass += ' pc-high';
    } else {
      // En rango — ámbar suave
      borderColor = '#f59e0b';
      cardClass += ' pc-range';
    }

    var html = '';
    html += '<div class="' + cardClass + '" style="border-left-color: ' + borderColor + '">';
    html += '  <div class="pc-header">';
    html += '    <span class="pc-label">Tu propiedad</span>';
    html += '  </div>';
    html += '  <div class="pc-content">';
    html += '    <div class="pc-value">$' + Math.round(userPriceM2).toLocaleString() + '/m²</div>';
    html += '    <div class="pc-meta">';
    html += '      <span class="pc-area">' + Math.round(areaM2) + ' m²</span>';
    html += '      <span class="pc-separator">·</span>';
    html += '      <span class="pc-total">$' + Math.round(totalPrice).toLocaleString() + '</span>';
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
   * mount(elementId, props)
   * Inyecta el componente en un elemento DOM.
   * IMPORTANTE: props vienen del motor, no se calculan aquí.
   *
   * @param {String} elementId — ID del elemento contenedor
   * @param {Object} props — datos ya calculados por el analizador
   */
  function mount(elementId, props) {
    var element = document.getElementById(elementId);
    if (!element) {
      console.error('[PriceCard] Elemento no encontrado:', elementId);
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
  module.exports = PriceCard;
}

// Exportar para navegador (window)
if (typeof window !== 'undefined') {
  window.PriceCard = PriceCard;
}
