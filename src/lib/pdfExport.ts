import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Product } from "@/hooks/useProducts";

export const exportExecutivePDF = (products: Product[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(227, 6, 19); // Mastercard red
  doc.text("Mastercard Studio Intelligence Platform", 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Executive Portfolio Brief", 14, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Generated: ${date}`, 14, 36);
  
  // Portfolio Summary
  const productsWithMetrics = products.map((p) => ({
    ...p,
    readinessScore: Array.isArray(p.readiness) && p.readiness[0] ? p.readiness[0].readiness_score : 0,
    riskBand: Array.isArray(p.readiness) && p.readiness[0] ? p.readiness[0].risk_band : 'high',
    successProb: Array.isArray(p.prediction) && p.prediction[0] ? p.prediction[0].success_probability : 0,
    revenueProb: Array.isArray(p.prediction) && p.prediction[0] ? p.prediction[0].revenue_probability : 0,
  }));

  const avgReadiness = productsWithMetrics.reduce((sum, p) => sum + p.readinessScore, 0) / products.length;
  const highRiskCount = productsWithMetrics.filter((p) => p.riskBand === 'high').length;
  const successRate = productsWithMetrics.filter((p) => p.successProb >= 75).length / products.length * 100;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Portfolio Summary", 14, 46);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Total Products: ${products.length}`, 14, 54);
  doc.text(`Average Readiness: ${avgReadiness.toFixed(1)}%`, 14, 60);
  doc.text(`High Risk Products: ${highRiskCount}`, 14, 66);
  doc.text(`Predicted Success Rate: ${successRate.toFixed(0)}%`, 14, 72);
  
  // Top Performers Section
  const topPerformers = productsWithMetrics
    .filter((p) => p.readinessScore >= 85 && p.successProb >= 80)
    .sort((a, b) => b.readinessScore - a.readinessScore)
    .slice(0, 5);
  
  if (topPerformers.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Top Investment Candidates", 14, 84);
    
    autoTable(doc, {
      startY: 88,
      head: [['Product Name', 'Readiness', 'Success Prob', 'Revenue Target']],
      body: topPerformers.map((p) => [
        p.name,
        `${p.readinessScore.toFixed(0)}%`,
        `${(p.successProb || 0).toFixed(0)}%`,
        `$${((p.revenue_target || 0) / 1_000_000).toFixed(1)}M`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
  }
  
  // High Risk Products Section
  const highRiskProducts = productsWithMetrics
    .filter((p) => p.readinessScore < 65 || p.riskBand === 'high')
    .sort((a, b) => a.readinessScore - b.readinessScore)
    .slice(0, 5);
  
  if (highRiskProducts.length > 0) {
    const startY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Risk & Intervention Recommendations", 14, startY);
    
    autoTable(doc, {
      startY: startY + 4,
      head: [['Product Name', 'Readiness', 'Risk Band', 'Recommendation']],
      body: highRiskProducts.map((p) => [
        p.name,
        `${p.readinessScore.toFixed(0)}%`,
        p.riskBand.toUpperCase(),
        p.readinessScore < 60 ? 'Governance Intervention' : 'Monitor Closely',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
  }
  
  // All Products Detail Table
  const detailStartY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 130;
  
  if (detailStartY > 240) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Complete Portfolio Details", 14, 20);
    
    autoTable(doc, {
      startY: 24,
      head: [['Product', 'Type', 'Stage', 'Readiness', 'Risk', 'Success %']],
      body: productsWithMetrics.map((p) => [
        p.name,
        getProductTypeLabel(p.product_type),
        getStageLabel(p.lifecycle_stage),
        `${p.readinessScore.toFixed(0)}%`,
        p.riskBand.toUpperCase(),
        `${(p.successProb || 0).toFixed(0)}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Complete Portfolio Details", 14, detailStartY);
    
    autoTable(doc, {
      startY: detailStartY + 4,
      head: [['Product', 'Type', 'Stage', 'Readiness', 'Risk', 'Success %']],
      body: productsWithMetrics.map((p) => [
        p.name,
        getProductTypeLabel(p.product_type),
        getStageLabel(p.lifecycle_stage),
        `${p.readinessScore.toFixed(0)}%`,
        p.riskBand.toUpperCase(),
        `${(p.successProb || 0).toFixed(0)}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `MSIP Executive Brief - Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(`MSIP_Executive_Brief_${date.replace(/\s/g, '_')}.pdf`);
};

const getProductTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    data_services: "Data & Services",
    payment_flows: "Payment Flows",
    core_products: "Core Products",
    partnerships: "Partnerships",
  };
  return labels[type] || type;
};

const getStageLabel = (stage: string): string => {
  const labels: Record<string, string> = {
    concept: "Concept",
    early_pilot: "Early Pilot",
    pilot: "Pilot",
    commercial: "Commercial",
    sunset: "Sunset",
  };
  return labels[stage] || stage;
};
