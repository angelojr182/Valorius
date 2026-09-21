(function (global) {
  'use strict';

  /**
   * TerritorialAdapter
   *
   * Resolves canonical territorial context for a property without
   * inferring territory from zone, colonia, name, proximity, or geometry.
   * The adapter only resolves context; it does not calculate market metrics.
   *
   * fetchProperty(propertyId) must return:
   *   { ok: Boolean, data: Array }
   *
   * fetchTerritory(unitId) must return:
   *   { ok: Boolean, data: Array }
   */
  function TerritorialAdapter(options) {
    options = options || {};
    this.fetchProperty = options.fetchProperty;
    this.fetchTerritory = options.fetchTerritory;
  }

  TerritorialAdapter.prototype.resolve = async function (propertyId) {
    if (!propertyId) return null;

    if (typeof this.fetchProperty !== 'function' || typeof this.fetchTerritory !== 'function') {
      throw new Error('TerritorialAdapter requiere fetchProperty y fetchTerritory.');
    }

    var propertyResponse = await this.fetchProperty(propertyId);
    if (!propertyResponse || !propertyResponse.ok) {
      throw new Error('No fue posible consultar la propiedad para resolver territorio.');
    }

    var propertyRows = Array.isArray(propertyResponse.data)
      ? propertyResponse.data
      : [];

    if (!propertyRows.length) return null;

    var territorialUnitId = propertyRows[0].territorial_unit_id;

    // No correspondence means no territory. Never infer it from other fields.
    if (!territorialUnitId) return null;

    var territoryResponse = await this.fetchTerritory(territorialUnitId);
    if (!territoryResponse || !territoryResponse.ok) {
      throw new Error('No fue posible consultar la unidad territorial canónica.');
    }

    var territoryRows = Array.isArray(territoryResponse.data)
      ? territoryResponse.data
      : [];

    if (!territoryRows.length) return null;

    var row = territoryRows[0];

    return Object.freeze({
      unitId: row.unit_id || territorialUnitId,
      nameOfficial: row.name_official || '',
      type: row.type || '',
      municipalityCode: row.municipality_code || '',
      status: row.status || '',
      source: row.source || '',
      territoryGis: row.territory_gis != null ? row.territory_gis : null
    });
  };

  if (typeof window !== 'undefined') {
    window.TerritorialAdapter = TerritorialAdapter;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerritorialAdapter;
  }
}(typeof window !== 'undefined' ? window : globalThis));
