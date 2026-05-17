/**
 * VALORIUS DASHBOARD APP.JS
 * Arquitectura Institucional / Bloomberg Terminal Style
 * Implementa modularidad, Chart.js interactivo y manejo null-safe.
 */

const CONFIG = {
  SURL: typeof SECRETS !== 'undefined' ? SECRETS.SURL : '',
  SKEY: typeof SECRETS !== 'undefined' ? SECRETS.SKEY : '',
  COLORS: {
    grn: '#2dd4a0', amb: '#e8a030', blu: '#5b9cf6', red: '#e05252', slt: '#6b7f96', bg: '#10161f'
  },
  // Coordenadas aproximadas para Tegucigalpa (Fallback si la DB no tiene lat/long)
  GEO_DICT: {
    "Lomas del Guijarro": [14.0950, -87.1738],
    "San Ignacio": [14.0910, -87.1820],
    "Florencia": [14.0880, -87.1850],
    "Residencial Zarahemla II": [14.1030, -87.1650],
    "Las Hadas": [14.0620, -87.2300],
    "Tepeyac": [14.0980, -87.1780],
    "Tres Caminos": [14.0850, -87.1800],
    "La Cuesta": [14.1200, -87.2100],
    "Cerro Grande": [14.1250, -87.2200],
    "Hatillo": [14.1350, -87.1500],
    "Centro": [14.1050, -87.2040]
  }
};

const Utils = {
  fmt: n => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }),
  fU: n => '$' + Utils.fmt(n),
  setEl: (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; },
  confScore: (m, std, med, p25, p75) => {
    m = Number(m || 0); std = Number(std || 0); med = Number(med || 1); p25 = Number(p25 || 0); p75 = Number(p75 || 0);
    const mPts = Math.min(m / 10 * 40, 40);
    const cv = med > 0 ? std / med : 1, cvPts = Math.max(0, 40 - cv * 100);
    const iqr = med > 0 ? (p75 - p25) / med : 1, iqrPts = Math.max(0, 20 - iqr * 40);
    return Math.round(mPts + cvPts + iqrPts);
  },
  confLabel: s => {
    if (s >= 70) return { l: 'ALTA', c: 'var(--grn)' };
    if (s >= 40) return { l: 'MEDIA', c: 'var(--amb)' };
    return { l: 'BAJA', c: 'var(--red)' };
  },
  // Motor de regresión lineal para tendencias
  linearRegression: (yValues) => {
    const x = [], y = [];
    yValues.forEach((val, i) => { if (val !== null) { x.push(i); y.push(val); } });
    if (x.length < 2) return yValues;
    const n = x.length;
    const sumX = x.reduce((a,b)=>a+b, 0);
    const sumY = y.reduce((a,b)=>a+b, 0);
    const sumXY = x.reduce((a,b,i)=>a+b*y[i], 0);
    const sumXX = x.reduce((a,b)=>a+b*b, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return yValues.map((_, i) => slope * i + intercept);
  }
};

class DataService {
  static get headers() {
    // Las queries usan la anon key que tiene acceso al schema 'core'.
    // El JWT del usuario autenticado se usa SOLO para validar la sesión en AuthService.
    return {
      'apikey': CONFIG.SKEY,
      'Authorization': 'Bearer ' + CONFIG.SKEY,
      'Content-Type': 'application/json',
      'Accept-Profile': 'core',
      'Content-Profile': 'core'
    };
  }

  static async fetchCount(endpoint) {
    try {
      const res = await fetch(CONFIG.SURL + endpoint, { 
        method: 'HEAD',
        headers: { ...this.headers, 'Prefer': 'count=exact' } 
      });
      const range = res.headers.get('content-range');
      if (!range) return 0;
      return parseInt(range.split('/')[1]) || 0;
    } catch (e) {
      console.warn(`Count Error on ${endpoint}:`, e);
      return 0;
    }
  }

  static async fetchData(endpoint) {
    try {
      const res = await fetch(CONFIG.SURL + endpoint, { headers: this.headers });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn(`Data Error on ${endpoint}:`, e);
      return [];
    }
  }

  static async loadAll() {
    const endpoints = {
      props: '/rest/v1/property?select=property_id',
      listings: '/rest/v1/listing?select=listing_id',
      zones: '/rest/v1/dim_zone?select=zone_id',
      snaps: '/rest/v1/market_snapshot?select=snapshot_id',
      sinArea: '/rest/v1/listing?select=listing_id&area_construccion=is.null',
      scraper: '/rest/v1/listing?select=listing_id&fuente=eq.Propiedades Honduras',
      metrics: '/rest/v1/market_metrics?select=precio_m2_mediana,cantidad_muestras,p25,p75,desviacion_std,snapshot_id,market_snapshot!inner(fecha_snapshot,zone_id,property_type_id,dim_zone!inner(zona),dim_property_type!inner(tipo_inmueble))&order=created_at.desc&limit=200',
      deals: '/rest/v1/v_deals?select=*&order=diferencia_vs_mercado.asc&limit=150'
    };

    const [props, listings, zones, snaps, sinArea, scraper, metrics, deals] = await Promise.all([
      this.fetchCount(endpoints.props),
      this.fetchCount(endpoints.listings),
      this.fetchCount(endpoints.zones),
      this.fetchCount(endpoints.snaps),
      this.fetchCount(endpoints.sinArea),
      this.fetchCount(endpoints.scraper),
      this.fetchData(endpoints.metrics),
      this.fetchData(endpoints.deals)
    ]);

    return { props, listings, zones, snaps, sinArea, scraper, metrics, deals };
  }
}

class UIRenderer {
  static renderKPIs(D) {
    const meds = D.metrics.filter(m => m.cantidad_muestras >= 3).map(m => Number(m.precio_m2_mediana)).sort((a, b) => a - b);
    const medG = meds.length ? meds[Math.floor(meds.length / 2)] : 0;
    
    const zonasConB = new Set(D.metrics.filter(m => m.cantidad_muestras >= 3).map(m => m.market_snapshot?.dim_zone?.zona).filter(Boolean)).size;
    const cob = D.zones > 0 ? Math.round(zonasConB / D.zones * 100) + '%' : '—';

    Utils.setEl('kMed', Utils.fU(medG));
    Utils.setEl('kInv', Utils.fmt(D.props));
    Utils.setEl('kList', Utils.fmt(D.listings));
    Utils.setEl('kZones', Utils.fmt(D.zones));
    Utils.setEl('kSnaps', Utils.fmt(D.snaps) + ' snapshots');
    Utils.setEl('kCov', cob);
    Utils.setEl('snapCount', Utils.fmt(D.snaps) + ' snapshots');

    const dd = D.deals;
    Utils.setEl('sGangas', dd.filter(x => x.estatus_inversion?.includes('SUBVALUADO')).length);
    Utils.setEl('sOp', dd.filter(x => x.estatus_inversion?.includes('OPORTUNIDAD')).length);
    Utils.setEl('sMer', dd.filter(x => x.estatus_inversion?.includes('MERCADO')).length);
    Utils.setEl('sSob', dd.filter(x => x.estatus_inversion?.includes('SOBREVALORADA')).length);

    this.renderDist(dd);
    this.renderHealth(D, zonasConB, cob);
  }

  static renderDist(deals) {
    const el = document.getElementById('distGrid'); if (!el) return;
    const t = deals.length || 1;
    const sub = deals.filter(x => x.estatus_inversion?.includes('SUBVALUADO')).length;
    const opp = deals.filter(x => x.estatus_inversion?.includes('OPORTUNIDAD')).length;
    const mer = deals.filter(x => x.estatus_inversion?.includes('MERCADO')).length;
    const sob = deals.filter(x => x.estatus_inversion?.includes('SOBREVALORADA')).length;
    
    el.innerHTML = `
      <div class="dc dc-amb"><div class="dc-tag">Gangas</div><div class="dc-val">${sub}</div><div class="dc-sub">${((sub / t) * 100).toFixed(1)}% · spread &gt;25%</div></div>
      <div class="dc dc-grn"><div class="dc-tag">Oportunidades</div><div class="dc-val">${opp}</div><div class="dc-sub">${((opp / t) * 100).toFixed(1)}%</div></div>
      <div class="dc dc-slt"><div class="dc-tag">Precio justo</div><div class="dc-val">${mer}</div><div class="dc-sub">${((mer / t) * 100).toFixed(1)}%</div></div>
      <div class="dc dc-red"><div class="dc-tag">Sobrevaloradas</div><div class="dc-val">${sob}</div><div class="dc-sub">${((sob / t) * 100).toFixed(1)}%</div></div>`;
  }

  static renderInsights(deals, metrics) {
    const el = document.getElementById('insights'); if (!el) return;
    const sub = deals.filter(x => x.estatus_inversion?.includes('SUBVALUADO'));
    const sob = deals.filter(x => x.estatus_inversion?.includes('SOBREVALORADA'));
    const avgGap = deals.length ? (deals.reduce((a, b) => a + Number(b.diferencia_vs_mercado || 0), 0) / deals.length * 100).toFixed(1) : 0;
    
    const latest = {};
    metrics.forEach(m => {
      const z = m.market_snapshot?.dim_zone?.zona;
      const f = m.market_snapshot?.fecha_snapshot;
      if (z && f && (!latest[z] || f > latest[z].f)) latest[z] = { med: Number(m.precio_m2_mediana), f };
    });
    const topZ = Object.entries(latest).filter(([, v]) => v.med > 0).sort((a, b) => b[1].med - a[1].med)[0];
    
    const items = [
      { c: 'var(--amb)', tag: 'Gangas activas', text: `${sub.length} propiedades con spread superior al 25% bajo el benchmark zonal.` },
      { c: 'var(--grn)', tag: 'Spread del mercado', text: `Desviación promedio: ${avgGap}% respecto al benchmark. Mercado con presión mixta.` },
      { c: 'var(--blu)', tag: 'Zona líder', text: topZ ? `${topZ[0]} lidera con ${Utils.fU(topZ[1].med)}/m². Demanda premium sostenida.` : 'Calculando zonas...' },
      { c: 'var(--red)', tag: 'Riesgo de capital', text: `${sob.length} propiedades identificadas como sobrevaloradas en el mercado actual.` }
    ];
    el.innerHTML = items.map(i => `<div class="ins-item" style="--c:${i.c}"><div class="ins-tag">${i.tag}</div><div class="ins-text">${i.text}</div></div>`).join('');
  }

  static renderBench(metrics) {
    const latest = {};
    metrics.forEach(m => {
      const zona = m.market_snapshot?.dim_zone?.zona;
      const tipo = m.market_snapshot?.dim_property_type?.tipo_inmueble;
      const fecha = m.market_snapshot?.fecha_snapshot;
      if (!zona || !tipo || !fecha) return;
      const key = `${zona}__${tipo}`;
      if (!latest[key] || fecha > latest[key].fecha) latest[key] = { ...m, zona, tipo, fecha };
    });
    
    const rows = Object.values(latest).filter(r => r.cantidad_muestras >= 3).sort((a, b) => Number(b.precio_m2_mediana) - Number(a.precio_m2_mediana));
    const aptos = rows.filter(r => r.tipo === 'APARTAMENTO');
    const casas = rows.filter(r => r.tipo === 'CASA');
    
    Utils.setEl('aptAvg', aptos.length ? Utils.fU(Math.round(aptos.reduce((a, b) => a + Number(b.precio_m2_mediana), 0) / aptos.length)) : '—');
    Utils.setEl('casaAvg', casas.length ? Utils.fU(Math.round(casas.reduce((a, b) => a + Number(b.precio_m2_mediana), 0) / casas.length)) : '—');
    
    const maxV = Math.max(...rows.map(r => Number(r.precio_m2_mediana)));
    const tb = document.getElementById('benchTbl'); if (!tb) return;

    const PAGE = 5;
    let shown = PAGE;

    const renderRows = () => {
      const slice = rows.slice(0, shown);
      tb.innerHTML = slice.length ? slice.map(r => {
        const sc = Utils.confScore(r.cantidad_muestras, r.desviacion_std, r.precio_m2_mediana, r.p25, r.p75);
        const cf = Utils.confLabel(sc);
        const pct = ((Number(r.precio_m2_mediana) / maxV) * 100).toFixed(0);
        const cv = ((Number(r.desviacion_std) / Number(r.precio_m2_mediana)) * 100).toFixed(1);
        const cvC = Number(cv) > 30 ? 'var(--red)' : Number(cv) > 15 ? 'var(--amb)' : 'var(--grn)';
        const tC = r.tipo === 'APARTAMENTO' ? 'var(--blu)' : 'var(--amb)';
        return `<tr>
          <td><div class="td-name">${r.zona}</div><div><span class="tag-t" style="color:${tC};border-color:${tC}40">${r.tipo}</span></div></td>
          <td><div class="mini-bar"><div class="mini-bar-f" style="width:${pct}%"></div></div></td>
          <td class="mono-v">${Utils.fU(r.precio_m2_mediana)}</td>
          <td class="mono" style="font-size:10px;color:var(--ink3)">$${Utils.fmt(r.p25)} – $${Utils.fmt(r.p75)}</td>
          <td class="mono" style="color:${cvC}">${cv}%</td>
          <td class="mono" style="text-align:center">${r.cantidad_muestras}</td>
          <td><span class="cbadge" style="color:${cf.c};border-color:${cf.c}">${cf.l} ${sc}</span></td>
        </tr>`;
      }).join('') : '<tr class="empty-row"><td colspan="7">Sin datos con ≥3 muestras</td></tr>';

      const wrap = document.getElementById('benchMore');
      if (wrap) wrap.style.display = shown >= rows.length ? 'none' : 'flex';
    };

    renderRows();
    const moreBtn = document.getElementById('benchMoreBtn');
    if (moreBtn) moreBtn.onclick = () => { shown += PAGE; renderRows(); };
  }

  static renderFeed(deals, metrics) {
    const top = deals.filter(d => d.precio_m2 && d.diferencia_vs_mercado);
    const tb = document.getElementById('feedTbl'); if (!tb) return;

    if (!top.length) { tb.innerHTML = '<tr class="empty-row"><td colspan="4">Sin datos disponibles</td></tr>'; return; }

    const PAGE = 5;
    let shown = PAGE;

    const renderRows = () => {
      const slice = top.slice(0, shown);
      tb.innerHTML = slice.map(d => {
        const diff = Number(d.diferencia_vs_mercado || 0) * 100;
        const dStr = (diff > 0 ? '+' : '') + diff.toFixed(1) + '%';
        const dc = diff <= -25 ? 'var(--grn)' : diff <= -10 ? 'var(--blu)' : diff >= 20 ? 'var(--red)' : 'var(--slt)';
        const st = (d.estatus_inversion || '—').replace('VALOR DE MERCADO', 'MERCADO').replace('VALOR SUBVALUADO', 'SUBVALUADO');
        const conf = (d.indice_validacion || '—').replace('CONFIRMACIÓN: ', '').replace('VALIDACIÓN EN PROCESO', 'EN PROCESO');
        const nota = (d.nota_analista || 'Sin nota');
        const m = metrics ? metrics.find(x => x.snapshot_id === d.snapshot_id) : null;
        const zona = m?.market_snapshot?.dim_zone?.zona || 'Zona no asignada';
        const tipo = m?.market_snapshot?.dim_property_type?.tipo_inmueble || '';
        const tC = tipo === 'APARTAMENTO' ? 'var(--blu)' : 'var(--amb)';
        return `<tr>
          <td>
            <div class="td-name" style="font-size:12px;" title="${nota}">${zona}</div>
            <div style="display:flex;gap:6px;align-items:center;margin-top:2px;">
              <span class="tag-t" style="color:${tC};border-color:${tC}40;font-size:8px;padding:2px 4px;">${tipo.substring(0,4)}</span>
              <span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);">ID: ${d.listing_id}</span>
            </div>
          </td>
          <td class="mono-v">${Utils.fU(d.precio_m2)}</td>
          <td><span class="diff-tag" style="background:${dc}18;color:${dc};border:1px solid ${dc}35" title="${nota}">${dStr}</span></td>
          <td>
            <div class="mono" style="font-size:10px;color:${dc};font-weight:600;">${st}</div>
            <div class="mono" style="font-size:9px;color:var(--muted);margin-top:2px;">${conf}</div>
          </td>
        </tr>`;
      }).join('');

      const wrap = document.getElementById('feedMore');
      if (wrap) wrap.style.display = shown >= top.length ? 'none' : 'flex';
    };

    renderRows();
    const moreBtn = document.getElementById('feedMoreBtn');
    if (moreBtn) moreBtn.onclick = () => { shown += PAGE; renderRows(); };
  }

  static renderHealth(D, zonasConB, cob) {
    const ultimo = D.metrics.map(m => m.market_snapshot?.fecha_snapshot).filter(Boolean).sort().reverse()[0] || '—';
    Utils.setEl('h1', D.sinArea + ' listings');
    Utils.setEl('h2', '0 detectados');
    Utils.setEl('h3', (D.zones - zonasConB) + ' zonas');
    Utils.setEl('h4', cob);
    Utils.setEl('h5', ultimo);
    Utils.setEl('h6', D.scraper + ' scraper · ' + (D.listings - D.scraper) + ' manual');
  }

  static renderSnaps(metrics) {
    const rows = metrics.map(m => ({
      zona: m.market_snapshot?.dim_zone?.zona || '—',
      tipo: m.market_snapshot?.dim_property_type?.tipo_inmueble || '—',
      fecha: m.market_snapshot?.fecha_snapshot || '—',
      med: Number(m.precio_m2_mediana),
      muestras: m.cantidad_muestras,
      p25: Number(m.p25), p75: Number(m.p75), std: Number(m.desviacion_std),
      score: Utils.confScore(m.cantidad_muestras, m.desviacion_std, m.precio_m2_mediana, m.p25, m.p75)
    })).sort((a, b) => b.fecha.localeCompare(a.fecha));

    const PAGE = 5;
    let shown = PAGE;

    const renderRows = () => {
      const tb = document.getElementById('snapTbl'); if (!tb) return;
      const slice = rows.slice(0, shown);
      tb.innerHTML = slice.length ? slice.map(r => {
        const cf = Utils.confLabel(r.score);
        const cv = r.med > 0 ? ((r.std / r.med) * 100).toFixed(1) : '—';
        const cvC = Number(cv) > 30 ? 'var(--red)' : Number(cv) > 15 ? 'var(--amb)' : 'var(--grn)';
        const tC = r.tipo === 'APARTAMENTO' ? 'var(--blu)' : 'var(--amb)';
        return `<tr>
          <td class="mono" style="font-size:10px;color:var(--ink3)">${r.fecha}</td>
          <td class="td-name" style="font-size:12px">${r.zona}</td>
          <td><span class="tag-t" style="color:${tC};border-color:${tC}40">${r.tipo}</span></td>
          <td class="mono-v">${Utils.fU(r.med)}</td>
          <td class="mono" style="font-size:10px;color:var(--ink3)">$${Utils.fmt(r.p25)} – $${Utils.fmt(r.p75)}</td>
          <td class="mono" style="color:${cvC}">${cv}%</td>
          <td class="mono" style="text-align:center">${r.muestras}</td>
          <td><span class="cbadge" style="color:${cf.c};border-color:${cf.c}">${cf.l} ${r.score}</span></td>
        </tr>`;
      }).join('') : '<tr class="empty-row"><td colspan="8">Sin snapshots disponibles</td></tr>';

      const wrap = document.getElementById('snapMore');
      if (wrap) wrap.style.display = shown >= rows.length ? 'none' : 'flex';
    };

    renderRows();
    const moreBtn = document.getElementById('snapMoreBtn');
    if (moreBtn) moreBtn.onclick = () => { shown += PAGE; renderRows(); };
  }

  static renderChart(metrics, currentType) {
    const series = {}, fechas = new Set();
    const targetType = currentType || 'APARTAMENTO'; // Default para gráfico si no hay tipo seleccionado

    metrics.forEach(m => {
      const zona = m.market_snapshot?.dim_zone?.zona;
      const tipo = m.market_snapshot?.dim_property_type?.tipo_inmueble;
      const fecha = m.market_snapshot?.fecha_snapshot;
      if (!zona || !fecha || tipo !== targetType) return;
      if (!series[zona]) series[zona] = {};
      series[zona][fecha] = Number(m.precio_m2_mediana);
      fechas.add(fecha);
    });
    
    const fa = [...fechas].sort();
    const topZ = Object.entries(series).sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length).slice(0, 4).map(([z]) => z);
    const colors = [CONFIG.COLORS.grn, CONFIG.COLORS.amb, CONFIG.COLORS.slt, CONFIG.COLORS.blu];

    if (!fa.length || !topZ.length || typeof Chart === 'undefined') return;

    const datasets = topZ.map((zona, i) => {
      const data = fa.map(f => series[zona][f] || null);
      return {
        label: zona,
        data: data,
        borderColor: colors[i],
        backgroundColor: colors[i] + '20',
        borderWidth: 2,
        pointBackgroundColor: CONFIG.COLORS.bg,
        pointBorderColor: colors[i],
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        spanGaps: true
      };
    });

    // Añadir línea de tendencia predictiva basada en la zona líder
    if (topZ.length > 0) {
      const leaderData = fa.map(f => series[topZ[0]][f] || null);
      const trendData = Utils.linearRegression(leaderData);
      datasets.push({
        label: `Tendencia (${topZ[0]})`,
        data: trendData,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 2,
        borderDash: [5, 5], // Línea punteada
        pointRadius: 0, // Sin puntos para que parezca una proyección
        tension: 0,
        spanGaps: true
      });
    }

    const ctx = document.getElementById('trendCanvas').getContext('2d');
    if (window.trendChartInstance) window.trendChartInstance.destroy();
    
    window.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels: fa, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: 10, left: 4, right: 4, top: 4 } },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: 'rgba(255,255,255,0.6)', font: { family: 'DM Mono', size: 10 }, usePointStyle: true, boxWidth: 6 } },
          tooltip: { backgroundColor: 'rgba(16, 22, 31, 0.9)', titleFont: { family: 'DM Mono' }, bodyFont: { family: 'Inter' }, padding: 12, cornerRadius: 8, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }
        },
        scales: {
          x: { display: true, grid: { color: 'rgba(255,255,255,0.03)' }, border: { display: false }, ticks: { display: true, color: 'rgba(255,255,255,0.7)', font: { family: 'DM Mono', size: 10 }, maxRotation: 0, padding: 8, callback: function(val, index) { const label = fa[index]; return label ? label.substring(5) : ''; } } },
          y: { min: 0, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'DM Mono', size: 10 }, callback: v => '$' + v } }
        }
      }
    });
  }

  static renderMap(deals, metrics) {
    if (typeof L === 'undefined') return;
    const mapEl = document.getElementById('geoMap');
    if (!mapEl) return;

    if (!window.geoMapInstance) {
      window.geoMapInstance = L.map('geoMap').setView([14.0818, -87.2068], 12); // Centro Tegucigalpa
      
      // Tile Layer Oscuro (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(window.geoMapInstance);
      
      window.geoMarkers = L.layerGroup().addTo(window.geoMapInstance);
    }

    // Limpiar marcadores anteriores
    window.geoMarkers.clearLayers();

    // Dibujar oportunidades
    deals.forEach(d => {
      const diff = Number(d.diferencia_vs_mercado || 0) * 100;
      if (diff > -10) return; // Solo marcamos oportunidades y gangas
      
      // Buscar zona en metrics
      const m = metrics.find(x => x.snapshot_id === d.snapshot_id);
      const zona = m?.market_snapshot?.dim_zone?.zona;
      const coords = zona ? CONFIG.GEO_DICT[zona] : null;
      
      if (coords) {
        // Añadir una pequeña aleatoriedad para que no se superpongan exactamente
        const lat = coords[0] + (Math.random() - 0.5) * 0.005;
        const lng = coords[1] + (Math.random() - 0.5) * 0.005;
        
        const isGanga = diff <= -25;
        const color = isGanga ? CONFIG.COLORS.grn : CONFIG.COLORS.blu;
        
        const circle = L.circleMarker([lat, lng], {
          radius: isGanga ? 8 : 5,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 1,
          fillOpacity: 0.6
        }).addTo(window.geoMarkers);
        
        circle.bindPopup(`
          <div style="font-family:'Inter',sans-serif; background:#10161f; color:#fff; padding:4px;">
            <div style="font-size:10px; color:var(--muted); text-transform:uppercase;">${zona}</div>
            <div style="font-weight:bold; font-size:14px; margin:4px 0;">${Utils.fU(d.precio_m2)} / m²</div>
            <div style="color:${color}; font-size:12px;">Spread: ${diff.toFixed(1)}%</div>
          </div>
        `, {
          className: 'dark-popup'
        });
      }
    });
  }
}

window.applyFilters = function() {
  const D = window.AppData;
  if (!D) return;

  const fType = document.getElementById('fType').value;
  const fZone = document.getElementById('fZone').value;
  const fPriceMax = parseFloat(document.getElementById('fPriceMax').value) || Infinity;

  // Mapa de snapshot_id -> {zona, tipo}
  const snapToInfo = {};
  D.metrics.forEach(m => {
    snapToInfo[m.snapshot_id] = {
      zona: m.market_snapshot?.dim_zone?.zona,
      tipo: m.market_snapshot?.dim_property_type?.tipo_inmueble
    };
  });

  // Filtrar Metrics
  const filteredMetrics = D.metrics.filter(m => {
    const z = m.market_snapshot?.dim_zone?.zona;
    const t = m.market_snapshot?.dim_property_type?.tipo_inmueble;
    const price = Number(m.precio_m2_mediana || 0);
    if (fType && t !== fType) return false;
    if (fZone && z !== fZone) return false;
    if (price > fPriceMax) return false;
    return true;
  });

  // Filtrar Deals
  const filteredDeals = D.deals.filter(d => {
    const info = snapToInfo[d.snapshot_id];
    const price = Number(d.precio_m2 || 0);
    if (!info) return false;
    if (fType && info.tipo !== fType) return false;
    if (fZone && info.zona !== fZone) return false;
    if (price > fPriceMax) return false;
    return true;
  });

  // Re-render UI partial (KPIs uses the global counts, but deals metrics change)
  const filteredD = { ...D, metrics: filteredMetrics, deals: filteredDeals };
  
  UIRenderer.renderKPIs(filteredD);
  UIRenderer.renderInsights(filteredDeals, filteredMetrics);
  UIRenderer.renderBench(filteredMetrics);
  UIRenderer.renderFeed(filteredDeals, filteredMetrics);
  UIRenderer.renderSnaps(filteredMetrics);
  UIRenderer.renderChart(filteredMetrics, fType);
  UIRenderer.renderMap(filteredDeals, filteredMetrics);
  UIRenderer.renderMarketPulse(filteredDeals, filteredMetrics, fType, fZone);
};

UIRenderer.renderMarketPulse = function(deals, metrics, type, zone) {
  const pulseEl = document.getElementById('marketPulse');
  if (!pulseEl) return;
  
  const gangas = deals.filter(d => Number(d.diferencia_vs_mercado) <= -0.25).length;
  const opps = deals.filter(d => Number(d.diferencia_vs_mercado) < 0).length;
  
  let txtType = type ? (type === 'CASA' ? 'casas' : 'apartamentos') : 'propiedades';
  let txtZone = zone ? `en ${zone}` : 'a nivel global';
  
  if (deals.length === 0) {
    pulseEl.innerHTML = `<strong style="color:var(--amb)">Aviso:</strong> No hay inventario suficiente de ${txtType} ${txtZone} para emitir un análisis confiable.`;
    return;
  }
  
  const priceArr = deals.map(d => Number(d.precio_m2)).sort((a,b)=>a-b);
  const medPrice = priceArr[Math.floor(priceArr.length / 2)];
  
  pulseEl.innerHTML = `<strong style="color:var(--blu)">Market Pulse:</strong> El mercado de ${txtType} ${txtZone} registra una mediana transaccional de <strong>$${Utils.fmt(medPrice)}/m²</strong>. Se detectaron <strong>${opps} oportunidades</strong> por debajo del benchmark, de las cuales <strong style="color:var(--grn)">${gangas} son consideradas 'Gangas' (Spread > 25%)</strong>.`;
};

window.exportCSV = function() {
  const D = window.AppData;
  if (!D || !D.deals) return;
  
  const fType = document.getElementById('fType').value;
  const fZone = document.getElementById('fZone').value;

  const snapToInfo = {};
  D.metrics.forEach(m => {
    snapToInfo[m.snapshot_id] = {
      zona: m.market_snapshot?.dim_zone?.zona,
      tipo: m.market_snapshot?.dim_property_type?.tipo_inmueble
    };
  });

  const filteredDeals = D.deals.filter(d => {
    const info = snapToInfo[d.snapshot_id];
    if (!info) return false;
    if (fType && info.tipo !== fType) return false;
    if (fZone && info.zona !== fZone) return false;
    return true;
  });

  if (filteredDeals.length === 0) {
    alert("No hay datos para exportar con estos filtros.");
    return;
  }

  // Header
  let csv = "ID,Zona,Tipo,Estatus,Precio m2,Benchmark Zonal,Spread %,Nota Analista\n";
  
  filteredDeals.forEach(d => {
    const info = snapToInfo[d.snapshot_id] || {};
    const spread = (Number(d.diferencia_vs_mercado) * 100).toFixed(1) + '%';
    const cleanNota = (d.nota_analista || '').replace(/,/g, ';'); // Evitar comas en CSV
    
    csv += `"${d.listing_id}","${info.zona || ''}","${info.tipo || ''}","${d.estatus_inversion}","${d.precio_m2}","${d.precio_m2_mercado}","${spread}","${cleanNota}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `valorius_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

class AuthService {
  static async login(email, password) {
    const res = await fetch(`${CONFIG.SURL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SKEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    console.log('[Auth] Supabase response:', res.status, data);

    if (!res.ok) {
      const msg = data.error_description || data.msg || data.message || '';
      if (msg.toLowerCase().includes('email not confirmed')) {
        throw new Error('Correo no confirmado. Ve a Supabase → Authentication → Users → selecciona tu usuario → "Send confirmation email" o activa "Auto Confirm".');
      }
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials') || msg.toLowerCase().includes('wrong')) {
        throw new Error('Correo o contraseña incorrectos.');
      }
      throw new Error(msg || `Error ${res.status}. Revisa la consola del navegador (F12) para más detalles.`);
    }

    localStorage.setItem('valorius_token', data.access_token);
    localStorage.setItem('valorius_user', JSON.stringify(data.user));
    return data;
  }

  static logout() {
    localStorage.removeItem('valorius_token');
    localStorage.removeItem('valorius_user');
    location.reload();
  }

  static isAuthenticated() {
    return !!localStorage.getItem('valorius_token');
  }
}

window.AuthService = AuthService;

async function AppInit() {
  const loginWrap = document.getElementById('loginWrap');
  const dashboardWrap = document.getElementById('dashboardWrap');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  // Si no está autenticado, forzar pantalla de login
  if (!AuthService.isAuthenticated()) {
    loginWrap.style.display = 'flex';
    dashboardWrap.style.display = 'none';

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPassword').value;
      const btn = loginForm.querySelector('.btn-login');

      btn.disabled = true;
      btn.innerText = 'Autenticando...';
      loginError.style.display = 'none';

      try {
        await AuthService.login(email, pass);
        // Recargar para entrar al flujo seguro con el token guardado
        location.reload();
      } catch (err) {
        loginError.innerText = err.message || 'Credenciales inválidas o sin acceso';
        loginError.style.display = 'block';
        btn.disabled = false;
        btn.innerText = 'Autenticar Credenciales';
      }
    });
    return;
  }

  // Si está autenticado, cargar datos de forma segura
  loginWrap.style.display = 'none';
  dashboardWrap.style.display = 'block';

  try {
    Utils.setEl('hDate', new Date().toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    
    // Cargar todos los datos desde Supabase (Null-Safe)
    const D = await DataService.loadAll();
    window.AppData = D;

    // Poblar dropdown de zonas
    const zones = [...new Set(D.metrics.map(m => m.market_snapshot?.dim_zone?.zona).filter(Boolean))].sort();
    const fZoneEl = document.getElementById('fZone');
    if (fZoneEl) {
      fZoneEl.innerHTML = '<option value="">Todas las zonas</option>' + zones.map(z => `<option value="${z}">${z}</option>`).join('');
      document.getElementById('fType').addEventListener('change', window.applyFilters);
      fZoneEl.addEventListener('change', window.applyFilters);
      document.getElementById('fPriceMax').addEventListener('input', window.applyFilters);
    }

    // Render Inicial
    window.applyFilters();
    
  } catch (e) {
    console.error('Fatal Error Initialization:', e);
    // Si da error de token inválido (ej: expiró o RLS falló), cerrar sesión
    if (e.message?.includes('JWT') || e.status === 401 || e.status === 403) {
      AuthService.logout();
      return;
    }
    
    document.querySelector('header').insertAdjacentHTML('afterend',
      `<div style="padding:12px 16px;background:rgba(224,82,82,.08);border:1px solid rgba(224,82,82,.2);border-radius:8px;font-family:DM Mono,monospace;font-size:10px;color:#e05252;margin-bottom:16px">Error fatal de inicialización: ${e.message}</div>`
    );
  }
}

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', AppInit);