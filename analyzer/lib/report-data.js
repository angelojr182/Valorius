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

  function ReportDataBuilder() {}

  ReportDataBuilder.prototype.build = function (lastData, comparables, context) {
    if (!lastData || !lastData.zona || !lastData.tipo) {
      throw new Error('No hay un análisis válido para preparar el reporte.');
    }

    comparables = Array.isArray(comparables) ? comparables : [];
    context = context || {};

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
