/**
 * test-cases.js
 * 6 casos de prueba del analizador (FASE 0 — baseline)
 *
 * Formato: { id, descripcion, input, expectedOutput }
 * Input: zona, tipo, precio, area, moneda
 * Expected: veredicto (BAJO/RANGO/SOBRE), aprox confianza, alertas
 *
 * INSTRUCCIONES: Ejecutar cada caso manualmente en navegador (consola + inspector)
 * Se entiende que comparables ya están cargados desde Supabase.
 */

const TEST_CASES = [
  {
    id: 1,
    descripcion: 'Apartamento zona con buena cobertura, precio en rango',
    input: {
      zona: 'Bulevar Morazán',        // zona con 10+ comparables históricos
      tipo: 'APARTAMENTO',
      precio: 250000,                 // USD
      area: 120,                      // m²
      moneda: 'USD'
    },
    expectedOutput: {
      veredicto: 'RANGO',             // 0.85 <= IPR <= 1.15
      confianza: 'MEDIA a ALTA',      // 10+ comparables, mediana estable
      ipr: 'cercano a 1.0',           // precio similar a mediana zona
      alarmas: 'ninguna',             // datos normales, sin outliers
      notas: 'Caso típico: usuario con datos limpios, zona conocida, resultado equilibrado'
    }
  },

  {
    id: 2,
    descripcion: 'Apartamento precio bajo (ganga potencial)',
    input: {
      zona: 'Lomas del Guijarro',     // zona con comparables
      tipo: 'APARTAMENTO',
      precio: 150000,                 // USD bajo
      area: 100,
      moneda: 'USD'
    },
    expectedOutput: {
      veredicto: 'BAJO',              // IPR < 0.85
      confianza: 'MEDIA',
      ipr: '< 0.85',                  // 15%+ por debajo mediana
      alarmas: 'ninguna',             // precio bajo pero válido
      notas: 'Usuario ve "oportunidad". Datos sanity check OK (no rechazados).'
    }
  },

  {
    id: 3,
    descripcion: 'Apartamento precio alto (sobre mercado)',
    input: {
      zona: 'El Trapiche',            // zona con datos
      tipo: 'APARTAMENTO',
      precio: 380000,                 // USD alto
      area: 110,
      moneda: 'USD'
    },
    expectedOutput: {
      veredicto: 'SOBRE',             // IPR > 1.15
      confianza: 'MEDIA',
      ipr: '> 1.15',                  // 15%+ por encima mediana
      alarmas: 'alerta contextual moderada/leve',  // ratio ≈ 1.8× umbral depende cobertura
      notas: 'Usuario ve "precio alto". Alerta sugiere revisar datos o negociar.'
    }
  },

  {
    id: 4,
    descripcion: 'Zona con pocas referencias (fallback a zona más amplia)',
    input: {
      zona: 'San Ignacio',            // zona con pocos comparables (<3 en colonia)
      tipo: 'APARTAMENTO',
      precio: 180000,
      area: 90,
      moneda: 'USD'
    },
    expectedOutput: {
      veredicto: 'RANGO',             // análisis por zona (fallback)
      confianza: 'BAJA a MEDIA',      // n=3-8 total zona
      alertas: 'badge "pocos datos en colonia, se usa zona"',
      nivel: 'zona',                  // resolverComparables retorna nivel:'zona'
      notas: 'Fallback automático. UI avisa que usa zona, no colonia exacta.'
    }
  },

  {
    id: 5,
    descripcion: 'Entrada inválida: precio fuera de rango (sanity check rechaza)',
    input: {
      zona: 'Bulevar Morazán',
      tipo: 'APARTAMENTO',
      precio: 5000,                   // < PRECIO_MIN (10000)
      area: 100,
      moneda: 'USD'
    },
    expectedOutput: {
      veredicto: 'ERROR',
      confianza: 'N/A',
      alertas: 'alerta-sanity visible',
      msj: 'El precio ingresado parece demasiado bajo para una propiedad real.',
      notas: 'Validación sanity rechaza. No ejecuta análisis. Usuario revisa dato.'
    }
  },

  {
    id: 6,
    descripcion: 'Entrada inválida: área fuera de rango (sanity check rechaza)',
    input: {
      zona: 'Miraflores',
      tipo: 'APARTAMENTO',
      precio: 200000,
      area: 25,                       // justo en borde mínimo, pero fuera de rango sensato
      moneda: 'USD'
    },
    expectedOutput: {
      veredicto: 'ADVERTENCIA',       // o ERROR según severidad
      confianza: 'N/A',
      alertas: 'alerta-sanity',
      msj: 'El tamaño de 25 m² es inusualmente pequeño para un apartamento...',
      notas: 'Edge case: área mínima técnicamente válida pero rarísima. Sanity advierte.'
    }
  }
];

/**
 * ─────────────────────────────────────────────────────────────────
 * INSTRUCCIONES DE PRUEBA MANUAL (FASE 0)
 * ─────────────────────────────────────────────────────────────────
 *
 * 1. Abrir analizador.html en navegador
 * 2. Abrir consola (F12) y cargar: console.log(TEST_CASES);
 * 3. Para cada caso:
 *    a. Seleccionar en dropdowns: tipo → zona → colonia (si aplica)
 *    b. Ingresar área + precio
 *    c. Hacer clic "Analizar propiedad"
 *    d. Capturar screenshot del resultado
 *    e. Verificar:
 *       - ¿Veredicto coincide con expectedOutput.veredicto?
 *       - ¿Confianza en rango esperado?
 *       - ¿Alertas (si las hay) aparecen como se esperaba?
 * 4. Guardar screenshots en carpeta screenshots/ con nombre:
 *    test-case-{id}-{zona-tipo}-{veredicto}.png
 *
 * RESULTADO:
 * Si todos los casos pasan: baseline establecido ✅
 * Si alguno falla: anotar diferencia y reportar antes de FASE 1
 *
 * ─────────────────────────────────────────────────────────────────
 */

// Helper: imprimir casos de forma legible
function printTestCases() {
  TEST_CASES.forEach(function(tc) {
    console.group('TEST CASE ' + tc.id + ': ' + tc.descripcion);
    console.log('INPUT:', tc.input);
    console.log('EXPECTED:', tc.expectedOutput);
    console.groupEnd();
  });
}

console.log('%c[PHASE 0 — TEST CASES]', 'color:#e2b05c;font-weight:bold');
console.log('Cargados ' + TEST_CASES.length + ' casos de prueba. Ejecuta printTestCases() para verlos.');
