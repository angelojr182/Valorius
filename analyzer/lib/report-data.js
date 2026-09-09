(function (global) {
  'use strict';

  function num(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback || 0);
  }

  function median(values) {
    if (!values.length) return 0;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function getPropertyIdFromUrl() {
    if (typeof window === 'undefined' || !window.location) return null;
    try {
      return new URLSearchParams(window.location.search).get('property_id') || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Resolve canonical territory only from core.property.territorial_unit_id.
   * This helper deliberately does not infer territory from zone, colonia,
   * name, proximity, or geometry. It runs only when a property_id is present
   * in the Analyzer URL, so the existing manual-analysis mode remains intact.
   *
   * A synchronous request is intentionally isolated to report preparation:
   * ReportDataBuilder.build() is synchronous and the existing Analyzer call
   * site cannot await it. No market calculation depends on this lookup.
   */
  function resolveTerritorySync() {
    var propertyId = getPropertyIdFromUrl();
    if (!propertyId || typeof XMLHttpRequest === 'undefined') return null;
    if (typeof SECRETS === 'undefined' || !SECRETS.SURL || !SECRETS.SKEY) return null;

    function request(schema, endpoint) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', SECRETS.SURL + endpoint, false);
      xhr.setRequestHeader('apikey', SECRETS.SKEY);
      xhr.setRequestHeader('Authorization', 'Bearer ' + SECRETS.SKEY);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept-Profile', schema);
      try {
        xhr.send();
      } catch (e) {
        return null;
      }
      if (xhr.status < 200 || xhr.status >= 300) return null;
      try { return JSON.parse(xhr.responseText); } catch (e) { return null; }
    }

    var propertyRows = request(
      'core',
      '/rest/v1/property?property_id=eq.' + encodeURIComponent(propertyId) +
      '&select=property_id,territorial_unit_id&limit=1'
    );
    if (!Array.isArray(propertyRows) || !propertyRows.length) return null;

    var unitId = propertyRows[0].territorial_unit_id;
    if (!unitId) return null;

    var territoryRows = request(
      'geo',
      '/rest/v1/territorial_unit?unit_id=eq.' + encodeURIComponent(unitId) +
      '&select=unit_id,type_id,source_id,name_official,municipality_code,status&limit=1'
    );
    if (!Array.isArray(territoryRows) || !territoryRows.length) return null;

    var territory = territoryRows[0];
    var typeRows = request(
      'geo',
      '/rest/v1/territorial_unit_type?type_id=eq.' + encodeURIComponent(territory.type_id) +
      '&select=type_key,name,level&limit=1'
    ) || [];
    var sourceRows = request(
      'geo',
      '/rest/v1/data_source?source_id=eq.' + encodeURIComponent(territory.source_id) +
      '&select=source_key,name,institution,version&limit=1'
    ) || [];

    return Object.freeze({
      unitId: territory.unit_id || unitId,
      nameOfficial: territory.name_official || '',
      type: typeRows[0] ? (typeRows[0].name || typeRows[0].type_key || '') : '',
      municipalityCode: territory.municipality_code || '',
      status: territory.status || '',
      source: sourceRows[0] ? (sourceRows[0].source_key || sourceRows[0].name || '') : ''
    });
  }

  function ReportDataBuilder() {}

  ReportDataBuilder.prototype.build = function (lastData, comparables, context) {
    if (!lastData || !lastData.zona || !lastData.tipo) {
      throw new Error('No hay un análisis válido para preparar el reporte.');
    }

    comparables = Array.isArray(comparables) ? comparables : [];
    context = context || {};

    // Territory is contextual only. It never changes zone/colonia selection,
    // comparable filtering, statistics, IPR, or any market metric.
    var territory = lastData.territory || resolveTerritorySync();
    lastData.territory = territory || null;

    var category = String(
      lastData.iprInt && (lastData.iprInt.cat || lastData.iprInt.categoria) || 'rango'
    ).toUpperCase();
    if (category === 'REF') category = 'LIMITADO';

    var relativeIqr = lastData.mediana > 0 ? num(lastData.iqr) / num(lastData.mediana) : 1;
    var dispersion = relativeIqr <= 0.2 ? 'BAJA' : relativeIqr <= 0.4 ? 'MODERADA' : 'ALTA';
    var confidence = lastData.n >= 10 && dispersion !== 'ALTA'
      ? 'ALTA'
      : lastData.n >= 5 ? 'MEDIA' : 'LIMITADA';

    var report = {
      schemaVersion: 2,
      property: {
        zona: lastData.zona,
        colonia: lastData.colonia || '',
        zonaLabel: lastData.zonaLabel || lastData.zona,
        tipo: lastData.tipo,
        area: num(lastData.area),
        precio: num(lastData.precio),
        moneda: 'USD'
      },
      territory: territory ? {
        unitId: territory.unitId || '',
        nameOfficial: territory.nameOfficial || '',
        type: territory.type || '',
        municipalityCode: territory.municipalityCode || '',
        status: territory.status || '',
        source: territory.source || ''
      } : null,
      result: {
        veredicto: category,
        etiqueta: lastData.iprInt && lastData.iprInt.etiqueta || '',
        precioPerM2: num(lastData.tuPM2),
        precioReferencia: num(lastData.mediana),
        diferenciaPorcentaje: num(lastData.desv),
        diferenciaDolares: num(lastData.diferenciaPesos),
        precioMercado: num(lastData.precioMercado),
        precioMin: num(lastData.min),
        precioMax: num(lastData.max),
        p25: num(lastData.p25),
        p75: num(lastData.p75),
        actividad: lastData.iaoInt && lastData.iaoInt.etiqueta || ''
      },
      confidence: {
        nivel: confidence,
        numeroComparables: num(lastData.n),
        periodoDias: 100,
        dispersion: dispersion
      },
      comparables: comparables.map(function (item) {
        return {
          zona: item.zona || lastData.zona,
          colonia: item.colonia || '',
          area: num(item.area),
          precio: num(item.precio),
          precioPerM2: num(item.precioPerM2),
          habitaciones: item.habitaciones == null ? null : num(item.habitaciones),
          banos: item.banos == null ? null : num(item.banos)
        };
      }),
      marketContext: {
        nivel: lastData.nivel || 'zona',
        numeroComparables: num(lastData.n),
        precioMediano: num(lastData.mediana),
        precioMinimo: num(lastData.min),
        precioMaximo: num(lastData.max),
        p25: num(lastData.p25),
        p75: num(lastData.p75),
        actividad: lastData.iaoInt && lastData.iaoInt.etiqueta || '',
        tendenciaDisponible: false
      },
      mapContext: (context.mapContext || []).map(function (zone) {
        return {
          zoneId: zone.zoneId || '',
          zona: zone.zona || '',
          lat: num(zone.lat),
          lng: num(zone.lng),
          precioPerM2: num(zone.precioPerM2),
          numeroComparables: num(zone.numeroComparables),
          isTarget: zone.zoneId === lastData.zone_id
        };
      }),
      methodology: {
        periodoDias: 100,
        minimoComparables: 3,
        areaMin: comparables.length ? Math.min.apply(null, comparables.map(function (item) { return num(item.area); })) : 0,
        areaMax: comparables.length ? Math.max.apply(null, comparables.map(function (item) { return num(item.area); })) : 0
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        reportId: 'VAL-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + lastData.tipo.slice(0, 2),
        exchangeRate: num(context.exchangeRate, 26.5943),
        analyzerVersion: context.analyzerVersion || 'Valorius Analyzer',
        ciudad: 'Tegucigalpa, Honduras'
      }
    };

    report.marketContext.medianaComparables = median(
      report.comparables.map(function (item) { return item.precioPerM2; }).filter(Boolean)
    );

    return Object.freeze(report);
  };

  global.ReportDataBuilder = ReportDataBuilder;
}(typeof window !== 'undefined' ? window : globalThis));
