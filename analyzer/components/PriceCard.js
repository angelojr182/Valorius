/**
 * PriceCard.js — Tarjeta de precio de la propiedad analizada
 *
 * Responsabilidad: presentar precio/m², área, precio total y desviación
 * frente a la mediana entregada por el flujo del Analyzer.
 * NO calcula métricas de negocio ni determina el veredicto.
 *
 * Props: userPriceM2, areaM2, totalPrice, medianPriceM2, deviationPct
 * Métodos: render(), mount(), update()
 *
 * v1.3 — PHASE 3-B FINAL
 */
var PriceCard = (function() {
  'use strict';

  function render(props) {
    if (!props) {
      console.warn('[PriceCard] Props vacíos');
      return '<div class="price-card">Error: datos faltantes</div>';
    }

    var userPriceM2 = Number(props.userPriceM2) || 0;
    var areaM2 = Number(props.areaM2) || 0;
    var totalPrice = Number(props.totalPrice) || 0;
    var deviationPct = Number(props.deviationPct) || 0;
    var pctAbsDiff = Math.abs(deviationPct).toFixed(1);
    var signo = deviationPct >= 0 ? '+' : '';
    var cardClass = 'price-card';
    var borderColor;

    if (deviationPct < -15) {
      borderColor = '#10b981';
      cardClass += ' pc-low';
    } else if (deviationPct > 15) {
      borderColor = '#ef4444';
      cardClass += ' pc-high';
    } else {
      borderColor = '#e2b05c';
      cardClass += ' pc-range';
    }

    var html = '<div class="' + cardClass + '" style="border-left-color:' + borderColor + '">';
    html += '<div class="pc-header"><span class="pc-label">Tu propiedad</span></div>';
    html += '<div class="pc-content"><div class="pc-value">$' + Math.round(userPriceM2).toLocaleString() + '/m²</div>';
    html += '<div class="pc-meta"><span class="pc-area">' + Math.round(areaM2) + ' m²</span><span class="pc-separator">·</span><span class="pc-total">$' + Math.round(totalPrice).toLocaleString() + '</span></div></div>';
    html += '<div class="pc-footer"><div class="pc-diff" style="color:' + borderColor + '"><span class="pc-diff-value">' + signo + pctAbsDiff + '%</span><span class="pc-diff-label">vs mediana</span></div></div></div>';
    return html;
  }

  function mount(elementId, props) {
    var element = document.getElementById(elementId);
    if (!element) {
      console.error('[PriceCard] Elemento no encontrado:', elementId);
      return;
    }
    element.innerHTML = render(props);
  }

  function update(elementId, props) {
    mount(elementId, props);
  }

  return {
    render: render,
    mount: mount,
    update: update
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = PriceCard;
if (typeof window !== 'undefined') window.PriceCard = PriceCard;
