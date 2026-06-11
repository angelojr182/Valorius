/**
 * init.js — Inicialización y conexión de librerías
 *
 * Este archivo conecta las librerías extraídas (comparable, constants, validator, formatter, analyzer)
 * con el contexto global de analizador.html. Se ejecuta DESPUÉS de que todas las librerías se cargan.
 *
 * Responsabilidad: Verificar que todas las dependencias estén disponibles.
 *
 * v1.0 — PHASE 1 PASO 2
 */

(function() {
  'use strict';

  console.log('%c[Valorius] Inicializando librerías...', 'color:#e2b05c;font-weight:bold');

  // Verificar que todas las librerías estén disponibles
  var libs = [
    { name: 'AnalyzerConstants', obj: typeof AnalyzerConstants !== 'undefined' },
    { name: 'ComparableSelector', obj: typeof ComparableSelector !== 'undefined' },
    { name: 'InputValidator', obj: typeof InputValidator !== 'undefined' },
    { name: 'NumberFormatter', obj: typeof NumberFormatter !== 'undefined' },
    { name: 'PropertyAnalyzer', obj: typeof PropertyAnalyzer !== 'undefined' }
  ];

  var faltantes = libs.filter(function(lib) { return !lib.obj; });

  if (faltantes.length > 0) {
    console.error('%c[Valorius] ERROR: Librerías no cargadas:', 'color:red;font-weight:bold', faltantes.map(function(l) { return l.name; }));
    return;
  }

  console.log('%c[Valorius] ✓ Todas las librerías cargadas correctamente', 'color:#10b981;font-weight:bold');
  console.log('%c  - AnalyzerConstants (números duros)', 'color:#cbd5e1');
  console.log('%c  - ComparableSelector (experto)', 'color:#cbd5e1');
  console.log('%c  - InputValidator (validaciones)', 'color:#cbd5e1');
  console.log('%c  - NumberFormatter (formato)', 'color:#cbd5e1');
  console.log('%c  - PropertyAnalyzer (coordinador)', 'color:#cbd5e1');
})();
