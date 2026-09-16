/**
 * AnalysisSummary.js — Bloque de veredicto del análisis
 *
 * Responsabilidad: presentar datos ya calculados por el motor.
 * NO calcula IPR, IAO, medianas, percentiles ni clasificación de negocio.
 *
 * Props: { modoLimitado, nivelZona, n, iprInt, descripcion }
 * Métodos: render(), mount(), update()
 *
 * v1.3 — PHASE 3-C FINAL
 */
var AnalysisSummary = (function() {
  'use strict';
  var ALLOWED_CATEGORIES = { bajo: true, rango: true, sobre: true, ref: true };
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function getContextLabel(props) {
    if (props.modoLimitado) return 'Análisis orientativo';
    if (props.nivelZona) return 'Análisis por zona (colonia sin suficientes referencias)';
    return 'Resultado del análisis';
  }
  function render(props) {
    if (!props) {
      console.warn('[AnalysisSummary] Props vacíos');
      return '<div class="analysis-summary-error">Error: datos faltantes</div>';
    }
    var iprInt = props.iprInt || {};
    var titulo = props.modoLimitado ? 'Referencia basada en pocas propiedades similares' : (iprInt.etiqueta || 'Resultado no disponible');
    var descripcion = props.descripcion || '';
    var n = Number.isFinite(Number(props.n)) ? Number(props.n) : 0;
    var html = '';
    html += '<div class="vrd-etiqueta">' + escapeHTML(getContextLabel(props)) + '</div>';
    html += '<div class="vrd-titulo">' + escapeHTML(titulo) + '</div>';
    html += '<div class="vrd-descripcion">' + escapeHTML(descripcion) + '</div>';
    html += '<div class="vrd-ipr-badge">Basado en <span class="vrd-comparables">' + n + '</span> propiedades similares activas en los últimos 12 meses</div>';
    return html;
  }
  function mount(elementId, props) {
    var element = document.getElementById(elementId);
    if (!element) { console.error('[AnalysisSummary] Elemento no encontrado:', elementId); return; }
    var iprInt = (props && props.iprInt) || {};
    var categoria = ALLOWED_CATEGORIES[iprInt.categoria] ? iprInt.categoria : '';
    element.className = 'veredicto-principal' + (categoria ? ' ' + categoria : '');
    element.style.display = 'block';
    element.innerHTML = render(props);
  }
  function update(elementId, props) { mount(elementId, props); }
  return { render: render, mount: mount, update: update };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = AnalysisSummary;
if (typeof window !== 'undefined') {
  window.AnalysisSummary = AnalysisSummary;
  function installProductionHook() {
    if (typeof window.renderAnalysisSummary === 'function' && !window.renderAnalysisSummary.__analysisSummaryComponent) {
      var legacy = window.renderAnalysisSummary;
      var wrapped = function(data) { AnalysisSummary.mount('veredictoPanel', data); };
      wrapped.__analysisSummaryComponent = true;
      wrapped.__legacyRenderAnalysisSummary = legacy;
      window.renderAnalysisSummary = wrapped;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installProductionHook);
  else installProductionHook();
}
