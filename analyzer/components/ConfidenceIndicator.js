/**
 * ConfidenceIndicator.js — Actividad observable y cobertura del análisis
 * Responsabilidad: presentar actividad y factores de cobertura ya calculados.
 * NO calcula IAO ni métricas de negocio.
 * Props: { n, modoLimitado, nivel, iaoInt, dispersion }
 * Métodos: render(), mount(), update()
 * v1.2 — PHASE 3-A FINAL
 */
var ConfidenceIndicator = (function() {
  'use strict';
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function render(props) {
    if (!props) { console.warn('[ConfidenceIndicator] Props vacíos'); return '<div class="iao-card"><div class="iao-contenido"><div class="iao-valor">Datos no disponibles</div></div></div>'; }
    var iaoInt = props.iaoInt || {};
    var icono = iaoInt.icono || '◎';
    var etiqueta = iaoInt.etiqueta || 'Actividad no disponible';
    var n = Number(props.n) || 0;
    var nivel = props.nivel || '';
    var dispersion = props.dispersion;
    var factores = [n + ' comparable' + (n !== 1 ? 's' : ''), 'ultimos 12 meses'];
    if (dispersion) factores.push('dispersión ' + dispersion);
    var cardClass = iaoInt.clase || 'iao-baja';
    var html = '<div class="iao-card ' + escapeHTML(cardClass) + '">';
    html += '<div class="iao-icono">' + escapeHTML(icono) + '</div><div class="iao-contenido">';
    html += '<div class="iao-titulo">Actividad en la zona</div><div class="iao-valor">' + escapeHTML(etiqueta) + '</div>';
    html += '<div class="iao-sub">' + escapeHTML(factores.join(' · '));
    if (nivel === 'limitado') html += ' · referencia a nivel zona';
    html += '</div></div></div>';
    return html;
  }
  function mount(elementId, props) { var element = document.getElementById(elementId); if (!element) { console.error('[ConfidenceIndicator] Elemento no encontrado:', elementId); return; } element.innerHTML = render(props); }
  function update(elementId, props) { mount(elementId, props); }
  return { render: render, mount: mount, update: update };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ConfidenceIndicator;
if (typeof window !== 'undefined') {
  window.ConfidenceIndicator = ConfidenceIndicator;
  function installProductionHook() {
    if (typeof window.renderConfidenceIndicator === 'function' && !window.renderConfidenceIndicator.__confidenceIndicatorComponent) {
      var legacyRenderConfidenceIndicator = window.renderConfidenceIndicator;
      var wrapped = function(data) {
        legacyRenderConfidenceIndicator(data);
        var dispersion = null;
        if (data && data.max && data.min) {
          var spread = Math.round(data.max - data.min);
          dispersion = spread < 200 ? 'baja' : spread < 500 ? 'moderada' : 'alta';
        }
        ConfidenceIndicator.mount('iaoCard', {
          n: data && data.n,
          modoLimitado: data && data.modoLimitado,
          nivel: data && data.nivelZona ? 'limitado' : '',
          iaoInt: data && data.iaoInt,
          dispersion: dispersion
        });
      };
      wrapped.__confidenceIndicatorComponent = true;
      wrapped.__legacyRenderConfidenceIndicator = legacyRenderConfidenceIndicator;
      window.renderConfidenceIndicator = wrapped;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installProductionHook);
  else installProductionHook();
}
