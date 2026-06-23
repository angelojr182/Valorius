/**
 * premium-pdf-renderer.js
 * Genera PDF vectorial con jsPDF a partir del objeto de reporte congelado.
 * Diseño basado en pdf_prototype_premium.html, pero 100% dinámico.
 */

class PremiumPDFRenderer {
  constructor(reportData) {
    if (!reportData || !reportData.schemaVersion) {
      throw new Error('ReportData inválido o no inicializado');
    }
    this.report = reportData;
    this.pdf = null;
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 15;
    this.y = 20;
  }

  /**
   * Renderiza el PDF completo
   * @returns {Promise<jsPDF>} Documento PDF generado
   */
  async render() {
    const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDF) {
      throw new Error('jsPDF no está disponible.');
    }
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Fuentes
    this.pdf.setFont('Helvetica', 'normal');

    // Página 1: Header + Resultado Ejecutivo
    this.renderPage1();

    // Página 2: Propiedades Similares + Gráficos
    this.renderPage2();

    // Página 3: Contexto de Mercado + Mapa
    this.renderPage3();

    // Página 4: Metodología + Advertencias
    this.renderPage4();

    return this.pdf;
  }

  /**
   * PÁGINA 1: Resultado Ejecutivo
   */
  renderPage1() {
    // Header oscuro
    this.pdf.setFillColor(8, 12, 26);
    this.pdf.rect(0, 0, this.pageWidth, 45, 'F');

    // Logo y titulo
    this.pdf.setTextColor(242, 198, 109);
    this.pdf.setFont('Helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.pdf.text('VALORIUS', 20, 15);

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('Helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.pdf.text('REPORTE DE ANÁLISIS', 180, 15, { align: 'right' });
    this.pdf.setFontSize(9);
    this.pdf.text(new Date().toLocaleDateString('es-HN'), 180, 21, { align: 'right' });

    // Propiedad
    this.pdf.setFontSize(14);
    this.pdf.setFont('Helvetica', 'bold');
    this.pdf.text(this.report.property.zonaLabel || this.report.property.zona, 20, 32);

    this.pdf.setFontSize(10);
    this.pdf.setFont('Helvetica', 'normal');
    this.pdf.text(this.report.property.tipo, 20, 40);
    this.pdf.text(`${this.report.property.area} m²`, 50, 40);
    this.pdf.setTextColor(242, 198, 109);
    this.pdf.text(`$${this.report.property.precio.toLocaleString()}`, 90, 40);
    this.pdf.setTextColor(0, 0, 0);

    // Espacio para contenido
    this.y = 55;

    // Resultado (BAJO / RANGO / SOBRE)
    const veredictoColor = {
      'BAJO': [16, 185, 129],
      'RANGO': [226, 176, 92],
      'SOBRE': [248, 113, 113]
    };

    const color = veredictoColor[this.report.result.veredicto] || [100, 116, 139];
    this.pdf.setTextColor(...color);
    this.pdf.setFont('Helvetica', 'bold');
    this.pdf.setFontSize(28);
    this.pdf.text(this.getVeredictoLabel(), 20, this.y);

    this.y += 15;

    // Grid de datos
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('Helvetica', 'normal');
    this.pdf.setFontSize(9);

    const dataPoints = [
      { label: 'Tu precio/m²', value: `$${this.report.result.precioPerM2.toLocaleString()}` },
      { label: 'Referencia zona', value: `$${(this.report.result.precioReferenciaZona || this.report.result.precioReferencia || 0).toLocaleString()}` },
      { label: 'Diferencia', value: `${this.report.result.diferenciaPorcentaje > 0 ? '+' : ''}${this.report.result.diferenciaPorcentaje.toFixed(1)}%` },
      { label: 'Confianza', value: this.report.confidence.nivel }
    ];

    let x = 20;
    dataPoints.forEach((point, idx) => {
      if (idx === 2) x = 20;
      if (idx === 2) this.y += 10;

      this.pdf.setFontSize(8);
      this.pdf.setTextColor(100, 116, 139);
      this.pdf.text(point.label, x, this.y);

      this.pdf.setFontSize(10);
      this.pdf.setTextColor(8, 12, 26);
      this.pdf.setFont('Helvetica', 'bold');
      this.pdf.text(point.value, x, this.y + 6);

      this.pdf.setFont('Helvetica', 'normal');
      x += 50;
    });

    this.y += 20;

    // Factores de confianza
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(8, 12, 26);
    this.pdf.setFont('Helvetica', 'bold');
    this.pdf.text('¿Por qué tiene esta confianza?', 20, this.y);

    this.y += 7;
    this.pdf.setFont('Helvetica', 'normal');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(50, 50, 50);

    const factors = [
      `${this.report.confidence.numeroComparables} propiedades similares encontradas`,
      'Datos actualizados últimos 100 días',
      `Dispersión de precios: ${this.report.confidence.dispersion}`,
      'Análisis sin outliers extremos'
    ];

    factors.forEach(factor => {
      this.pdf.text(`• ${factor}`, 22, this.y);
      this.y += 5;
    });

    // Número de página
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(150, 150, 150);
    this.pdf.text('Página 1 de 4', 20, this.pageHeight - 10);
  }

  /**
   * PÁGINA 2: Propiedades Similares
   */
  renderPage2() {
    this.pdf.addPage();
    this.y = 20;

    // Título
    this.pdf.setFontSize(16);
    this.pdf.setFont('Helvetica', 'bold');
    this.pdf.setTextColor(8, 12, 26);
    this.pdf.text('Propiedades Similares', 20, this.y);

    this.y += 12;

    // Tabla de comparables
    this.pdf.setFontSize(9);
    this.pdf.setFont('Helvetica', 'normal');

    const headers = ['Zona', 'Área', 'Precio/m²', 'Diferencia'];
    const colWidths = [50, 25, 40, 40];
    let xPos = 20;

    // Encabezados
    this.pdf.setFillColor(242, 198, 109);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('Helvetica', 'bold');

    headers.forEach((header, idx) => {
      this.pdf.text(header, xPos, this.y, { maxWidth: colWidths[idx] });
      xPos += colWidths[idx];
    });

    this.y += 6;

    // Datos
    this.pdf.setFont('Helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFillColor(240, 240, 245);

    (this.report.comparables || []).slice(0, 10).forEach((comp, idx) => {
      if (idx % 2 === 0) {
        this.pdf.rect(20, this.y - 4, 150, 6, 'F');
      }

      xPos = 20;
      this.pdf.text(comp.colonia || comp.zona, xPos, this.y, { maxWidth: colWidths[0] });
      xPos += colWidths[0];

      this.pdf.text(`${comp.area}m²`, xPos, this.y, { maxWidth: colWidths[1] });
      xPos += colWidths[1];

      this.pdf.text(`$${comp.precioPerM2.toLocaleString()}`, xPos, this.y, { maxWidth: colWidths[2] });
      xPos += colWidths[2];

      const referencia = this.report.result.precioReferenciaZona || this.report.result.precioReferencia || 1;
      const diff = ((comp.precioPerM2 - referencia) / referencia * 100).toFixed(1);
      this.pdf.text(`${diff > 0 ? '+' : ''}${diff}%`, xPos, this.y, { maxWidth: colWidths[3] });

      this.y += 6;

      if (this.y > this.pageHeight - 20) {
        this.pdf.addPage();
        this.y = 20;
      }
    });

    // Nota
    this.y += 5;
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(100, 116, 139);
    this.pdf.text('Se muestran 10 de ' + this.report.comparables.length + ' propiedades encontradas', 20, this.y);

    // Número de página
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(150, 150, 150);
    this.pdf.text('Página 2 de 4', 20, this.pageHeight - 10);
  }

  /**
   * PÁGINA 3: Contexto de Mercado
   */
  renderPage3() {
    this.pdf.addPage();
    this.y = 20;

    // Título
    this.pdf.setFontSize(16);
    this.pdf.setFont('Helvetica', 'bold');
    this.pdf.setTextColor(8, 12, 26);
    this.pdf.text(`Contexto de Mercado — ${this.report.marketContext.zonaAnalizada || this.report.property.zonaLabel || this.report.property.zona}`, 20, this.y);

    this.y += 12;

    // Métricas
    this.pdf.setFontSize(9);
    this.pdf.setFont('Helvetica', 'normal');

    const metrics = [
      {
        label: '¿Cuánta disponibilidad hay?',
        value: `${this.report.marketContext.numeroComparables} propiedades`,
        desc: 'En los últimos 100 días'
      },
      {
        label: '¿Cuál es el rango de precios?',
        value: `$${this.report.marketContext.precioMinimo.toLocaleString()} – $${this.report.marketContext.precioMaximo.toLocaleString()}/m²`,
        desc: 'Del más bajo al más alto'
      },
      {
        label: '¿El mercado es variado?',
        value: this.report.confidence.dispersion === 'ALTA' ? 'Sí, muy variado' : 'No, bastante homogéneo',
        desc: `Dispersión: ${(this.report.confidence.dispersion || 'MODERADA').toLowerCase()}`
      },
      {
        label: '¿Hacia dónde va el mercado?',
        value: this.report.marketContext.tendencia || 'Estable',
        desc: 'Tendencia observada'
      }
    ];

    metrics.forEach(metric => {
      this.pdf.setFont('Helvetica', 'bold');
      this.pdf.setTextColor(8, 12, 26);
      this.pdf.setFontSize(10);
      this.pdf.text(metric.label, 20, this.y);

      this.y += 5;

      this.pdf.setFont('Helvetica', 'normal');
      this.pdf.setTextColor(242, 198, 109);
      this.pdf.text(metric.value, 20, this.y);

      this.y += 5;

      this.pdf.setTextColor(100, 116, 139);
      this.pdf.setFontSize(8);
      this.pdf.text(metric.desc, 20, this.y);

      this.y += 8;
    });

    // Número de página
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(150, 150, 150);
    this.pdf.text('Página 3 de 4', 20, this.pageHeight - 10);
  }

  /**
   * PÁGINA 4: Metodología
   */
  renderPage4() {
    this.pdf.addPage();
    this.y = 20;

    // Título
    this.pdf.setFontSize(16);
    this.pdf.setFont('Helvetica', 'bold');
    this.pdf.setTextColor(8, 12, 26);
    this.pdf.text('Cómo se Preparó este Reporte', 20, this.y);

    this.y += 12;

    // Descripción
    this.pdf.setFontSize(9);
    this.pdf.setFont('Helvetica', 'normal');
    this.pdf.setTextColor(50, 50, 50);
    this.pdf.text(
      'Valorius analiza propiedades similares a la tuya para determinar si su precio es justo.',
      20,
      this.y,
      { maxWidth: 170 }
    );

    this.y += 12;

    // Filtros aplicados
    this.pdf.setFont('Helvetica', 'bold');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(8, 12, 26);
    this.pdf.text('Filtros Aplicados:', 20, this.y);

    this.y += 6;

    this.pdf.setFont('Helvetica', 'normal');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(50, 50, 50);

    (this.report.methodology.filtrosAplicados || [
      'Mismo tipo de propiedad',
      'Ubicación comparable',
      `Anuncios de los últimos ${this.report.methodology.periodoDias || 100} días`,
      'Revisión de precios atípicos'
    ]).forEach(filtro => {
      this.pdf.text(`• ${filtro}`, 22, this.y);
      this.y += 5;
    });

    this.y += 5;

    // Advertencias
    const advertencias = this.report.methodology.advertencias || [
      'Los precios corresponden a anuncios y pueden variar frente al precio final negociado.',
      'El estado, acabados y ubicación exacta pueden justificar diferencias de precio.'
    ];
    if (advertencias.length > 0) {
      this.pdf.setFont('Helvetica', 'bold');
      this.pdf.setFontSize(11);
      this.pdf.setTextColor(220, 39, 66);
      this.pdf.text('⚠️ Advertencias:', 20, this.y);

      this.y += 6;

      this.pdf.setFont('Helvetica', 'normal');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(100, 50, 50);

      advertencias.forEach(adv => {
        this.pdf.text(`• ${adv}`, 22, this.y, { maxWidth: 160 });
        this.y += 5;
      });
    }

    // Footer con metadatos
    this.y += 8;
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(150, 150, 150);
    this.pdf.text(`Generado: ${new Date(this.report.metadata.generatedAt).toLocaleString('es-HN')}`, 20, this.y);
    this.pdf.text(`Tasa de cambio: L ${this.report.metadata.exchangeRate.toFixed(4)} por USD`, 20, this.y + 5);

    // Número de página
    this.pdf.text('Página 4 de 4', 20, this.pageHeight - 10);
  }

  /**
   * Helper: Traduce el veredicto a etiqueta legible
   */
  getVeredictoLabel() {
    const labels = {
      'BAJO': 'Precio Bajo',
      'RANGO': 'Precio Acorde al Mercado',
      'SOBRE': 'Precio Elevado'
    };
    return labels[this.report.result.veredicto] || 'Precio en Rango';
  }

  /**
   * Descarga el PDF generado
   * @param {String} filename - Nombre del archivo a descargar
   */
  download(filename = 'Valorius_Analisis_Propiedad.pdf') {
    if (!this.pdf) {
      throw new Error('PDF no ha sido renderizado aún. Llama a render() primero.');
    }
    this.pdf.save(filename);
  }
}

if (typeof window !== 'undefined') {
  window.PremiumPDFRenderer = PremiumPDFRenderer;
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PremiumPDFRenderer;
}
