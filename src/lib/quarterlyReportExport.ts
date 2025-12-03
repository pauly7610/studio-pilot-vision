import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Product } from "@/hooks/useProducts";

interface RegionalData {
  region: string;
  products: number;
  revenue: number;
  avgReadiness: number;
  highRisk: number;
}

export const exportQuarterlyReport = (products: Product[]) => {
  const doc = new jsPDF();
  const currentDate = new Date();
  const quarter = Math.ceil((currentDate.getMonth() + 1) / 3);
  const year = currentDate.getFullYear();
  
  // Process product data
  const productsWithMetrics = products.map((p) => ({
    ...p,
    readinessScore: Array.isArray(p.readiness) && p.readiness[0] ? p.readiness[0].readiness_score : 0,
    riskBand: Array.isArray(p.readiness) && p.readiness[0] ? p.readiness[0].risk_band : 'high',
    successProb: Array.isArray(p.prediction) && p.prediction[0] ? p.prediction[0].success_probability : 0,
    revenueProb: Array.isArray(p.prediction) && p.prediction[0] ? p.prediction[0].revenue_probability : 0,
  }));

  // Calculate metrics
  const totalProducts = products.length;
  const avgReadiness = productsWithMetrics.reduce((sum, p) => sum + p.readinessScore, 0) / totalProducts;
  const highRiskCount = productsWithMetrics.filter((p) => p.riskBand === 'high').length;
  const mediumRiskCount = productsWithMetrics.filter((p) => p.riskBand === 'medium').length;
  const lowRiskCount = productsWithMetrics.filter((p) => p.riskBand === 'low').length;
  const totalRevenue = productsWithMetrics.reduce((sum, p) => sum + (p.revenue_target || 0), 0) / 1_000_000;
  const successRate = productsWithMetrics.filter((p) => p.successProb >= 75).length / totalProducts * 100;

  // Regional breakdown
  const regionalMap = new Map<string, RegionalData>();
  productsWithMetrics.forEach((p) => {
    const region = p.region || "North America";
    const existing = regionalMap.get(region) || { region, products: 0, revenue: 0, avgReadiness: 0, highRisk: 0 };
    existing.products += 1;
    existing.revenue += (p.revenue_target || 0) / 1_000_000;
    existing.avgReadiness += p.readinessScore;
    if (p.riskBand === 'high') existing.highRisk += 1;
    regionalMap.set(region, existing);
  });
  
  const regionalData = Array.from(regionalMap.values()).map(r => ({
    ...r,
    avgReadiness: Math.round(r.avgReadiness / r.products),
  }));

  // Lifecycle stage breakdown
  const stageMap = new Map<string, number>();
  productsWithMetrics.forEach((p) => {
    const stage = p.lifecycle_stage || "unknown";
    stageMap.set(stage, (stageMap.get(stage) || 0) + 1);
  });

  // ============ PAGE 1: Cover & Executive Summary ============
  
  // Header with branding
  doc.setFillColor(227, 6, 19); // Mastercard red
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text("MASTERCARD STUDIO", 14, 22);
  doc.setFontSize(16);
  doc.text("INTELLIGENCE PLATFORM", 14, 32);
  
  doc.setFontSize(28);
  doc.setTextColor(0, 0, 0);
  doc.text(`Q${quarter} ${year} Portfolio Report`, 14, 65);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("North America Region", 14, 75);
  doc.text(`Generated: ${currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 82);
  
  // Executive Summary Box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, 95, 182, 80, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(227, 6, 19);
  doc.text("Executive Summary", 20, 108);
  
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  
  const summaryLines = [
    `Portfolio Size: ${totalProducts} active products across ${regionalData.length} regions`,
    `Total Revenue Target: $${totalRevenue.toFixed(1)}M`,
    `Average Readiness Score: ${avgReadiness.toFixed(1)}%`,
    `Predicted Success Rate: ${successRate.toFixed(0)}%`,
    ``,
    `Risk Distribution: ${highRiskCount} High | ${mediumRiskCount} Medium | ${lowRiskCount} Low`,
  ];
  
  let yPos = 118;
  summaryLines.forEach(line => {
    doc.text(line, 20, yPos);
    yPos += 8;
  });

  // Key Highlights
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Key Highlights This Quarter", 14, 190);
  
  const highlights = [
    highRiskCount > 0 ? `⚠ ${highRiskCount} products flagged for governance intervention` : "✓ No high-risk products requiring immediate intervention",
    `📈 ${productsWithMetrics.filter(p => p.successProb >= 85).length} products on track for successful commercialization`,
    `🎯 Top performing region: ${regionalData.sort((a, b) => b.avgReadiness - a.avgReadiness)[0]?.region || 'N/A'}`,
  ];
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  yPos = 200;
  highlights.forEach(h => {
    doc.text(`• ${h}`, 18, yPos);
    yPos += 10;
  });

  // ============ PAGE 2: Regional Performance ============
  doc.addPage();
  
  doc.setFontSize(18);
  doc.setTextColor(227, 6, 19);
  doc.text("Regional Performance Analysis", 14, 20);
  
  doc.setDrawColor(227, 6, 19);
  doc.setLineWidth(0.5);
  doc.line(14, 24, 100, 24);
  
  autoTable(doc, {
    startY: 32,
    head: [['Region', 'Products', 'Revenue ($M)', 'Avg Readiness', 'High Risk']],
    body: regionalData.map(r => [
      r.region,
      r.products.toString(),
      `$${r.revenue.toFixed(1)}`,
      `${r.avgReadiness}%`,
      r.highRisk.toString(),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [227, 6, 19], fontSize: 10 },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  // Lifecycle Stage Distribution
  const stageStartY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Portfolio Lifecycle Distribution", 14, stageStartY);
  
  autoTable(doc, {
    startY: stageStartY + 6,
    head: [['Lifecycle Stage', 'Count', '% of Portfolio']],
    body: Array.from(stageMap.entries()).map(([stage, count]) => [
      getStageLabel(stage),
      count.toString(),
      `${((count / totalProducts) * 100).toFixed(1)}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [227, 6, 19], fontSize: 10 },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  // ============ PAGE 3: Risk & Recommendations ============
  doc.addPage();
  
  doc.setFontSize(18);
  doc.setTextColor(227, 6, 19);
  doc.text("Risk Assessment & Recommendations", 14, 20);
  
  doc.setDrawColor(227, 6, 19);
  doc.line(14, 24, 120, 24);
  
  // High Risk Products
  const highRiskProducts = productsWithMetrics
    .filter((p) => p.riskBand === 'high')
    .sort((a, b) => a.readinessScore - b.readinessScore)
    .slice(0, 8);
  
  if (highRiskProducts.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("High Risk Products Requiring Intervention", 14, 34);
    
    autoTable(doc, {
      startY: 38,
      head: [['Product', 'Stage', 'Readiness', 'Success %', 'Recommendation']],
      body: highRiskProducts.map((p) => [
        p.name,
        getStageLabel(p.lifecycle_stage),
        `${p.readinessScore.toFixed(0)}%`,
        `${(p.successProb || 0).toFixed(0)}%`,
        getRecommendation(p.readinessScore, p.lifecycle_stage),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [200, 50, 50], fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  // Top Performers
  const topPerformers = productsWithMetrics
    .filter((p) => p.readinessScore >= 80 && p.successProb >= 75)
    .sort((a, b) => b.successProb - a.successProb)
    .slice(0, 5);
  
  if (topPerformers.length > 0) {
    const topStartY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 90;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Top Performing Products - Scale Candidates", 14, topStartY);
    
    autoTable(doc, {
      startY: topStartY + 4,
      head: [['Product', 'Stage', 'Readiness', 'Success %', 'Revenue Target']],
      body: topPerformers.map((p) => [
        p.name,
        getStageLabel(p.lifecycle_stage),
        `${p.readinessScore.toFixed(0)}%`,
        `${(p.successProb || 0).toFixed(0)}%`,
        `$${((p.revenue_target || 0) / 1_000_000).toFixed(1)}M`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [34, 139, 34], fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  // ============ PAGE 4: Complete Portfolio ============
  doc.addPage();
  
  doc.setFontSize(18);
  doc.setTextColor(227, 6, 19);
  doc.text("Complete Portfolio Details", 14, 20);
  
  doc.setDrawColor(227, 6, 19);
  doc.line(14, 24, 90, 24);
  
  autoTable(doc, {
    startY: 30,
    head: [['Product', 'Type', 'Region', 'Stage', 'Readiness', 'Risk', 'Success %']],
    body: productsWithMetrics.map((p) => [
      p.name,
      getProductTypeLabel(p.product_type),
      p.region || 'N/A',
      getStageLabel(p.lifecycle_stage),
      `${p.readinessScore.toFixed(0)}%`,
      p.riskBand.toUpperCase(),
      `${(p.successProb || 0).toFixed(0)}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [227, 6, 19], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(227, 6, 19);
    doc.setLineWidth(0.3);
    doc.line(14, 282, 196, 282);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `MSIP Q${quarter} ${year} Portfolio Report • Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      288,
      { align: 'center' }
    );
    doc.text("CONFIDENTIAL", 14, 288);
    doc.text("Mastercard Studio NA", 182, 288);
  }

  // Save
  doc.save(`MSIP_Q${quarter}_${year}_Portfolio_Report.pdf`);
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

const getRecommendation = (readiness: number, stage: string): string => {
  if (readiness < 40) return "Governance review required";
  if (readiness < 60 && stage === "pilot") return "Consider pilot extension";
  if (readiness < 60) return "Accelerate readiness initiatives";
  if (stage === "commercial" && readiness < 70) return "Monitor post-launch closely";
  return "Standard monitoring";
};
