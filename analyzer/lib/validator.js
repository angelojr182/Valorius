/**
 * validator.js — Validaciones de entrada del analizador
 *
 * Responsabilidad: Validar que los datos cumplan con rangos de sanidad.
 * Retorna lista de problemas encontrados (puede estar vacía = válido).
 *
 * Principio: No rechaza automáticamente, retorna problemas para que UI decida.
 *
 * v1.0 — PHASE 1
 */

var InputValidator = (function() {
  'use strict';

  // Importará desde constants.js en PHASE 1-B3
  // Por ahora hardcodeado para demostración
  const RANGOS_AREA = {
    'APARTAMENTO': { min: 25, max: 600 },
    'CASA': { min: 45, max: 1200 },
    'TERRENO': { min: 100, max: 5000 }
  };
  const PRECIO_MIN = 20000;
  const PRECIO_MAX = 5000000;
  const TIPOS_VALIDOS = ['APARTAMENTO', 'CASA', 'TERRENO'];

  /**
   * validateInput(input)
   * Valida entrada completa: tipo, zona, area, precio.
   *
   * @param {Object} input — {
   *   tipo: String,
   *   zoneId: String (UUID),
   *   coloniaId: String (UUID, opcional),
   *   area: Number (m²),
   *   precio: Number (USD),
   *   moneda: String ('USD' | 'LPS')
   * }
   * @returns {Object} — { isValid: Boolean, problemas: [String] }
   */
  function validateInput(input) {
    var problemas = [];

    // Verificar presencia de campos obligatorios
    if (!input.tipo) {
      problemas.push('Tipo de inmueble es obligatorio.');
    }

    if (!input.zoneId) {
      problemas.push('Zona es obligatoria.');
    }

    if (!input.area || input.area <= 0) {
      problemas.push('Área debe ser un número positivo.');
    }

    if (!input.precio || input.precio <= 0) {
      problemas.push('Precio debe ser un número positivo.');
    }

    // Validaciones específicas (solo si los campos están presentes)
    if (input.tipo) {
      var resType = validateTipo(input.tipo);
      if (!resType.isValid) {
        problemas = problemas.concat(resType.problemas);
      }
    }

    if (input.area && input.tipo) {
      var resArea = validateArea(input.area, input.tipo);
      if (!resArea.isValid) {
        problemas = problemas.concat(resArea.problemas);
      }
    }

    if (input.precio) {
      var resPrecio = validatePrecio(input.precio);
      if (!resPrecio.isValid) {
        problemas = problemas.concat(resPrecio.problemas);
      }
    }

    return {
      isValid: problemas.length === 0,
      problemas: problemas
    };
  }

  /**
   * validateTipo(tipo)
   * Valida que el tipo sea uno de los válidos.
   *
   * @param {String} tipo
   * @returns {Object} — { isValid: Boolean, problemas: [String] }
   */
  function validateTipo(tipo) {
    if (!tipo || tipo.trim() === '') {
      return { isValid: false, problemas: ['Tipo de inmueble no puede estar vacío.'] };
    }

    if (TIPOS_VALIDOS.indexOf(tipo.toUpperCase()) === -1) {
      return {
        isValid: false,
        problemas: [
          'Tipo de inmueble "' + tipo + '" no es válido. Opciones: ' + TIPOS_VALIDOS.join(', ')
        ]
      };
    }

    return { isValid: true, problemas: [] };
  }

  /**
   * validateArea(area, tipo)
   * Valida que el área esté dentro del rango para el tipo.
   *
   * @param {Number} area — en m²
   * @param {String} tipo
   * @returns {Object} — { isValid: Boolean, problemas: [String], esAdvertencia: Boolean }
   */
  function validateArea(area, tipo) {
    var rango = RANGOS_AREA[tipo.toUpperCase()] || { min: 25, max: 1200 };
    var problemas = [];

    // Sanity check: advertencia si está fuera de rangos, pero no rechazo automático
    if (area < rango.min) {
      problemas.push(
        'El tamaño de ' + Math.round(area) + ' m² es inusualmente pequeño para ' +
        (tipo === 'CASA' ? 'una casa' : 'un apartamento') +
        ' (lo normal ronda entre ' + rango.min + ' y ' + rango.max + ' m²). ¿Quizá lo ingresaste mal?'
      );
    } else if (area > rango.max) {
      problemas.push(
        'El tamaño de ' + Math.round(area) + ' m² es inusualmente grande para ' +
        (tipo === 'CASA' ? 'una casa' : 'un apartamento') +
        ' (lo normal ronda entre ' + rango.min + ' y ' + rango.max + ' m²). ¿Quizá lo ingresaste mal?'
      );
    }

    return {
      isValid: true,  // Advertencia, no rechazo
      problemas: problemas,
      esAdvertencia: problemas.length > 0
    };
  }

  /**
   * validatePrecio(precio)
   * Valida que el precio esté dentro de rangos válidos (RECHAZO automático).
   *
   * @param {Number} precio — en USD
   * @returns {Object} — { isValid: Boolean, problemas: [String] }
   */
  function validatePrecio(precio) {
    var problemas = [];

    if (precio < PRECIO_MIN) {
      problemas.push(
        'El precio ingresado parece demasiado bajo para una propiedad real. ' +
        'Revisa la cifra y la moneda (USD/LPS).'
      );
    } else if (precio > PRECIO_MAX) {
      problemas.push(
        'El precio ingresado parece demasiado alto. ' +
        'Revisa la cifra y la moneda (USD/LPS).'
      );
    }

    return {
      isValid: problemas.length === 0,
      problemas: problemas
    };
  }

  /**
   * validateMoneda(moneda)
   * Valida que la moneda sea válida.
   *
   * @param {String} moneda
   * @returns {Object} — { isValid: Boolean }
   */
  function validateMoneda(moneda) {
    var valid = ['USD', 'LPS'].indexOf(moneda) !== -1;
    return { isValid: valid };
  }

  // ─── PUBLIC API ────────────────────────────────
  return {
    validateInput: validateInput,
    validateTipo: validateTipo,
    validateArea: validateArea,
    validatePrecio: validatePrecio,
    validateMoneda: validateMoneda
  };
})();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputValidator;
}
