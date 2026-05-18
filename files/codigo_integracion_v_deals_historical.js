// ============================================================================
// CÓDIGO PARA AGREGAR A TU app.js - v_deals_historical Integration
// ============================================================================
// INSTRUCCIONES:
// 1. Abre tu archivo app.js en GitHub
// 2. Localiza la clase DataService
// 3. Al final de la clase DataService (antes del cierre), copia el MÉTODO 1
// 4. Localiza la clase UIRenderer
// 5. Al final de la clase UIRenderer (antes del cierre), copia la FUNCIÓN 2
// 6. En tu init() o loadDashboard(), agrega la LÍNEA 3
// ============================================================================

// ============================================================================
// MÉTODO 1: Agregar a clase DataService (después de loadAll())
// ============================================================================

  async loadHistoricalTrends() {
    /**
     * Carga datos históricos de v_deals_historical
     * Contiene TODOS los snapshots de cada propiedad para análisis de tendencia
     * @returns {Array} Array de deals históricos (120 filas típicamente)
     */
    try {
      const { data, error } = await this.client
        .from('v_deals_historical')
        .select('*')
        .order('property_id')
        .order('snapshot_id', { ascending: false, referencedTable: 'v_deals_historical' });
      
      if (error) {
        console.error('Error cargando tendencias históricas:', error);
        return [];
      }
      
      console.log(`✅ Tendencias históricas cargadas: ${data?.length || 0} filas`);
      return data || [];
    } catch (err) {
      console.error('Error en loadHistoricalTrends:', err);
      return [];
    }
  }

// ============================================================================
// FUNCIÓN 2: Agregar a clase UIRenderer (antes del cierre)
// ============================================================================

  static renderHistoricalTrendBadge(historicalData, propertyId) {
    /**
     * Renderiza un badge con análisis de tendencia para una propiedad
     * Muestra cómo ha evolucionado respecto al benchmark del mercado
     * @param {Array} historicalData - Array de v_deals_historical
     * @param {String} propertyId - ID de la propiedad a analizar
     * @returns {String} HTML con el análisis o string vacío si no hay datos
     */
    if (!historicalData || historicalData.length === 0) return '';
    
    // Filtrar snapshots de esta propiedad específica
    const propertySnapshots = historicalData
      .filter(h => h.property_id === propertyId)
      .sort((a, b) => {
        // Ordenar por fecha del snapshot (ascendente = más viejo primero)
        return new Date(a.snapshot_id.split('-')[0]) - new Date(b.snapshot_id.split('-')[0]);
      });
    
    // Necesita al menos 2 snapshots para mostrar evolución
    if (propertySnapshots.length < 2) return '';
    
    const primero = propertySnapshots[0];
    const ultimo = propertySnapshots[propertySnapshots.length - 1];
    
    // Calcular cambios
    const cambioMercado = (
      ((ultimo.precio_m2_mercado - primero.precio_m2_mercado) / 
       (primero.precio_m2_mercado || 1)) * 100
    ).toFixed(1);
    
    const cambioSpread = (
      ((ultimo.diferencia_vs_mercado - primero.diferencia_vs_mercado) * 100)
    ).toFixed(1);
    
    // Determinar color del cambio de benchmark
    const colorMercado = cambioMercado > 0 ? '#ff6b6b' : '#00ff96';
    const iconoMercado = cambioMercado > 0 ? '📈' : '📉';
    
    // Construir HTML
    const html = `
      <div style="
        margin-top: 12px; 
        padding: 10px; 
        background: rgba(0, 255, 150, 0.08); 
        border-left: 3px solid #00ff96; 
        border-radius: 4px;
        font-family: 'Courier New', monospace;
      ">
        <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">
          📊 Análisis Temporal (${propertySnapshots.length} snapshots)
        </div>
        <div style="font-size: 12px; margin-top: 8px; line-height: 1.8; color: #ccc;">
          <div>${iconoMercado} Mercado: <strong style="color: ${colorMercado};">${cambioMercado > 0 ? '+' : ''}${cambioMercado}%</strong> <span style="font-size: 10px; color: #666;">($${Math.round(primero.precio_m2_mercado)} → $${Math.round(ultimo.precio_m2_mercado)}/m²)</span></div>
          <div>📍 Oportunidad actual: <strong style="color: #fff;">${(ultimo.diferencia_vs_mercado * 100).toFixed(1)}%</strong></div>
        </div>
      </div>
    `;
    
    return html;
  }

// ============================================================================
// LÍNEA 3: Agregar en función init() o loadDashboard()
// ============================================================================
// Busca dónde está: await this.dataService.loadAll();
// Y DESPUÉS de esa línea, agrega:

this.historicalData = await this.dataService.loadHistoricalTrends();

// ============================================================================
// INTEGRACIÓN EN EL FEED (en función renderFeed())
// ============================================================================
// Busca donde se itera sobre los deals:
// for (const deal of deals) {
//   // ...construir feedHTML...
// }
//
// En la sección donde se arma cada fila del feed, DESPUÉS de mostrar el precio,
// agrega esta línea:

const trendBadge = UIRenderer.renderHistoricalTrendBadge(
  this.historicalData, 
  deal.property_id
);

// Y en el template HTML donde armas el contenido del deal, agrega:
// ${trendBadge}

// Ejemplo completo:
/*
const dealRow = `
  <div class="feed-item">
    <h4>${deal.zona}</h4>
    <div>Precio: $${Math.round(deal.precio_m2)}/m²</div>
    <div>Benchmark: $${Math.round(deal.precio_m2_mercado)}/m²</div>
    ${trendBadge}  <!-- AGREGAR ESTA LÍNEA -->
  </div>
`;
*/

// ============================================================================
// VALIDACIÓN (copiar en consola del navegador)
// ============================================================================

// Para verificar que se cargó correctamente:
console.log('¿Datos históricos cargados?', app.historicalData?.length > 0);
console.log('Total filas históricas:', app.historicalData?.length);
console.log('Primeros 3 registros:', app.historicalData?.slice(0, 3));

// ============================================================================
// CREDENCIALES (YA ESTÁN EN secrets.js - NO NECESITAN CAMBIOS)
// ============================================================================
// SUPABASE_URL: https://oxhzxistgyfvkhzncxpz.supabase.co
// SUPABASE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94aHp4aXN0Z3lmdmtoem5jeHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTE0NzIsImV4cCI6MjA5MzIyNzQ3Mn0.-Q8XybmgAQdiBA5tAFi9LLoFnLuF0nJlsCh8WlTUjis

// ============================================================================
// FIN DEL CÓDIGO
// ============================================================================
