/**
 * test-integration.js — Verifica que las librerías estén integradas correctamente
 *
 * Corre un análisis simple y reporta si funciona.
 */

(function() {
  'use strict';

  if (typeof PropertyAnalyzer === 'undefined') {
    console.error('[TEST] PropertyAnalyzer no disponible');
    return;
  }

  console.log('%c[TEST] Ejecutando test de integración...', 'color:#e2b05c;font-weight:bold');

  // Test 1: validate input
  var testInput = {
    tipo: 'APARTAMENTO',
    zoneId: 'test-zone',
    coloniaId: null,
    area: 120,
    precio: 250000,
    moneda: 'USD'
  };

  if (typeof InputValidator !== 'undefined') {
    var valResult = InputValidator.validateInput(testInput);
    console.log('[TEST] Validación:', valResult.isValid ? '✓ PASS' : '✗ FAIL', valResult.problemas);
  }

  // Test 2: formateo
  if (typeof NumberFormatter !== 'undefined') {
    var formatted = NumberFormatter.formatCurrency(250000, '$');
    console.log('[TEST] Formateo: $250,000 →', formatted, formatted === '$250,000' ? '✓ PASS' : '✗ FAIL');
  }

  // Test 3: constants
  if (typeof AnalyzerConstants !== 'undefined') {
    var ipr = AnalyzerConstants.interpretarIPR(1.05);
    console.log('[TEST] IPR 1.05:', ipr.categoria, ipr.categoria === 'rango' ? '✓ PASS' : '✗ FAIL');
  }

  console.log('%c[TEST] Integración completada ✓', 'color:#10b981;font-weight:bold');
})();
