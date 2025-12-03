import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ProductReport {
  product: any;
  readiness: any;
  prediction: any;
  compliance: any[];
  partners: any[];
  actions: any[];
}

export const exportProductReport = (data: ProductReport) => {
  const doc = new jsPDF();
  const { product, readiness, prediction, compliance, partners, actions } = data;

  // Header
  doc.setFillColor(235, 87, 34);
  doc.rect(0, 0, 220, 35, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Product Detail Report", 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 28);

  // Product Name
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(product.name || "Unknown Product", 20, 50);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Owner: ${product.owner_email || "N/A"}`, 20, 58);
  doc.text(`Type: ${product.product_type || "N/A"} | Stage: ${product.lifecycle_stage || "N/A"} | Region: ${product.region || "N/A"}`, 20, 65);

  // Key Metrics
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Key Metrics", 20, 80);

  const metricsData = [
    ["Readiness Score", `${Math.round(readiness?.readiness_score || 0)}%`],
    ["Risk Band", readiness?.risk_band?.toUpperCase() || "N/A"],
    ["Success Probability", `${Math.round((prediction?.success_probability || 0) * 100)}%`],
    ["Revenue Target", `$${((product.revenue_target || 0) / 1000000).toFixed(1)}M`],
    ["Sales Training", `${Math.round(readiness?.sales_training_pct || 0)}%`],
    ["Partner Enablement", `${Math.round(readiness?.partner_enabled_pct || 0)}%`],
  ];

  autoTable(doc, {
    startY: 85,
    head: [["Metric", "Value"]],
    body: metricsData,
    theme: "striped",
    headStyles: { fillColor: [235, 87, 34] },
    margin: { left: 20, right: 20 },
  });

  let yPos = (doc as any).lastAutoTable.finalY + 15;

  // Compliance Status
  if (compliance.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Compliance Status", 20, yPos);

    const complianceData = compliance.map(c => [
      c.certification_type,
      c.status,
      c.completed_date || "Pending",
      c.expiry_date || "N/A"
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [["Certification", "Status", "Completed", "Expiry"]],
      body: complianceData,
      theme: "striped",
      headStyles: { fillColor: [235, 87, 34] },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Partners
  if (partners.length > 0 && yPos < 220) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Partner Status", 20, yPos);

    const partnerData = partners.map(p => [
      p.partner_name,
      p.integration_status || "N/A",
      p.enabled ? "Enabled" : "Disabled",
      p.onboarded_date || "N/A"
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [["Partner", "Integration", "Status", "Onboarded"]],
      body: partnerData,
      theme: "striped",
      headStyles: { fillColor: [235, 87, 34] },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Active Actions
  const activeActions = actions.filter(a => a.status !== "completed");
  if (activeActions.length > 0 && yPos < 240) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Active Actions", 20, yPos);

    const actionData = activeActions.slice(0, 5).map(a => [
      a.title.substring(0, 40) + (a.title.length > 40 ? "..." : ""),
      a.priority,
      a.status,
      a.assigned_to || "Unassigned"
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [["Action", "Priority", "Status", "Assigned"]],
      body: actionData,
      theme: "striped",
      headStyles: { fillColor: [235, 87, 34] },
      margin: { left: 20, right: 20 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Mastercard Studio Intelligence Platform | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  doc.save(`${product.name?.replace(/\s+/g, "_") || "product"}_report.pdf`);
};

export const exportFeedbackSummary = (feedbackData: any[]) => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(235, 87, 34);
  doc.rect(0, 0, 220, 35, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Feedback Summary", 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 28);

  // Summary Stats
  const positiveCount = feedbackData.filter(f => f.sentiment === "positive").length;
  const negativeCount = feedbackData.filter(f => f.sentiment === "negative").length;
  const neutralCount = feedbackData.filter(f => f.sentiment === "neutral").length;
  const totalVolume = feedbackData.reduce((sum, f) => sum + (f.volume || 0), 0);
  const highImpactCount = feedbackData.filter(f => f.impact === "HIGH").length;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Statistics", 20, 50);

  const statsData = [
    ["Total Feedback Items", feedbackData.length.toString()],
    ["Total Mentions", totalVolume.toString()],
    ["Positive Sentiment", positiveCount.toString()],
    ["Negative Sentiment", negativeCount.toString()],
    ["Neutral Sentiment", neutralCount.toString()],
    ["High Impact Issues", highImpactCount.toString()],
  ];

  autoTable(doc, {
    startY: 55,
    head: [["Metric", "Value"]],
    body: statsData,
    theme: "striped",
    headStyles: { fillColor: [235, 87, 34] },
    margin: { left: 20, right: 20 },
  });

  let yPos = (doc as any).lastAutoTable.finalY + 15;

  // High Impact Items
  const highImpactItems = feedbackData.filter(f => f.impact === "HIGH");
  if (highImpactItems.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("High Impact Issues Requiring Attention", 20, yPos);

    const issueData = highImpactItems.map(f => [
      f.product || "Unknown",
      f.theme || "N/A",
      f.sentiment || "N/A",
      (f.summary || "").substring(0, 50) + ((f.summary || "").length > 50 ? "..." : "")
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [["Product", "Theme", "Sentiment", "Summary"]],
      body: issueData,
      theme: "striped",
      headStyles: { fillColor: [235, 87, 34] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        3: { cellWidth: 60 }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // All Feedback
  if (feedbackData.length > 0 && yPos < 200) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("All Feedback Items", 20, yPos);

    const allData = feedbackData.slice(0, 15).map(f => [
      f.product || "Unknown",
      f.theme || "N/A",
      f.sentiment || "N/A",
      f.impact || "N/A",
      (f.volume || 0).toString()
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [["Product", "Theme", "Sentiment", "Impact", "Volume"]],
      body: allData,
      theme: "striped",
      headStyles: { fillColor: [235, 87, 34] },
      margin: { left: 20, right: 20 },
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    "Mastercard Studio Intelligence Platform | Customer Feedback Intelligence",
    105,
    290,
    { align: "center" }
  );

  doc.save("feedback_summary_report.pdf");
};
