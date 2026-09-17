/**
 * ConfidenceIndicator.js — Actividad observable y cobertura del análisis
 * Responsabilidad: presentar actividad y factores de cobertura ya calculados.
 * NO calcula IAO ni métricas de negocio.
 * Props: { n, modoLimitado, nivel, iaoInt }
 * Métodos: render(), mount(), update()
 * v1.2 — PHASE 3-A FINAL
 */
var ConfidenceIndicator = (function() {
  'use strict';

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function render(props) {
    if (!props) {
      console.warn('[ConfidenceIndicator] Props vacíos');
      return '<div class="iao-card"><div class="iao-contenido"><div class="iao-valor">Datos no disponibles</div></div></div>';
    }

    var iaoInt = props.iaoInt || {};
    var icono = iaoInt.icono || '◎';
    var etiqueta = iaoInt.etiqueta || 'Actividad no disponible';
    var n = Number(props.n) || 0;
    var nivel = props.nivel || '';
    var factores = [n + ' comparable' + (n !== 1 ? 's' : ''), 'ultimos 12 meses'];
    var cardClass = /^iao-(baja|media|alta)$/.test(iaoInt.clase || '') ? iaoInt.clase : 'iao-baja';

    var html = '<div class="iao-card ' + escapeHTML(cardClass) + '">';
    html += '<div class="iao-icono">' + escapeHTML(icono) + '</div><div class="iao-contenido">';
    html += '<div class="iao-titulo info-wrap">Actividad en la zona';
    html += '<span class="info-icon" data-tip="iao">ⓘ</span>';
    html += '<div class="info-tooltip" id="tip-iao">';
    html += '<div class="info-tooltip-title">Actividad observable en la zona</div>';
    html += '<div class="info-tooltip-body">Indica que tan activo esta el mercado para este tipo de propiedad en esta zona. Se calcula con base en la cantidad de propiedades similares detectadas en los ultimos 12 meses. Alta actividad significa mas opciones disponibles y mayor contexto de referencia.</div>';
    html += '</div></div>';
    html += '<div class="iao-valor">' + escapeHTML(etiqueta) + '</div>';
    html += '<div class="iao-sub">' + escapeHTML(factores.join(' · '));
    if (nivel === 'limitado') html += ' · referencia a nivel zona';
    html += '</div></div></div>';
    return html;
  }

  function mount(elementId, props) {
    var element = document.getElementById(elementId);
    if (!element) {
      console.error('[ConfidenceIndicator] Elemento no encontrado:', elementId);
      return;
    }

    var html = render(props);
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    var card = wrapper.firstElementChild;
    if (!card) return;

    element.className = card.className;
    element.innerHTML = card.innerHTML;
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

if (typeof module !== 'undefined' && module.exports) module.exports = ConfidenceIndicator;
if (typeof window !== 'undefined') window.ConfidenceIndicator = ConfidenceIndicator;
