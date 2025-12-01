export interface ExportProduct {
  id: string;
  name: string;
  product_type: string;
  region: string;
  lifecycle_stage: string;
  launch_date: string | null;
  revenue_target: number | null;
  owner_email: string;
  readiness?: any;
  prediction?: any;
}

const getProductTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    data_services: "Data & Services",
    payment_flows: "Payment Flows",
    core_products: "Core Products",
    partnerships: "Partnerships",
  };
  return typeMap[type] || type;
};

const getStageLabel = (stage: string) => {
  const stageMap: Record<string, string> = {
    concept: "Concept",
    early_pilot: "Early Pilot",
    pilot: "Pilot",
    commercial: "Commercial",
    sunset: "Sunset",
  };
  return stageMap[stage] || stage;
};

export function exportProductsToCSV(products: ExportProduct[]) {
  // Define CSV headers
  const headers = [
    "Product Name",
    "Product Type",
    "Region",
    "Lifecycle Stage",
    "Launch Date",
    "Revenue Target ($)",
    "Owner Email",
    "Readiness Score (%)",
    "Risk Band",
    "Sales Training Coverage (%)",
    "Compliance Complete",
    "Partner Enablement (%)",
    "Documentation Score (%)",
    "Onboarding Complete",
    "Success Probability (%)",
    "Revenue Achievement Probability (%)",
    "Failure Risk (%)",
    "ML Model Version",
  ];

  // Convert products to CSV rows
  const rows = products.map((product) => {
    const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
    const prediction = Array.isArray(product.prediction) ? product.prediction[0] : product.prediction;

    return [
      `"${product.name}"`,
      `"${getProductTypeLabel(product.product_type)}"`,
      `"${product.region}"`,
      `"${getStageLabel(product.lifecycle_stage)}"`,
      product.launch_date || "N/A",
      product.revenue_target || 0,
      `"${product.owner_email}"`,
      readiness?.readiness_score || 0,
      `"${(readiness?.risk_band || "N/A").toUpperCase()}"`,
      readiness?.sales_training_pct || 0,
      readiness?.compliance_complete ? "Yes" : "No",
      readiness?.partner_enabled_pct || 0,
      readiness?.documentation_score || 0,
      readiness?.onboarding_complete ? "Yes" : "No",
      prediction?.success_probability || 0,
      prediction?.revenue_probability || 0,
      prediction?.failure_risk || 0,
      `"${prediction?.model_version || "N/A"}"`,
    ].join(",");
  });

  // Combine headers and rows
  const csv = [headers.join(","), ...rows].join("\n");

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `mastercard-studio-products-${timestamp}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportProductsToExcel(products: ExportProduct[]) {
  // For Excel format, we can create a more structured TSV (Tab Separated Values)
  // which Excel can open directly
  const headers = [
    "Product Name",
    "Product Type",
    "Region",
    "Lifecycle Stage",
    "Launch Date",
    "Revenue Target ($)",
    "Owner Email",
    "Readiness Score (%)",
    "Risk Band",
    "Sales Training Coverage (%)",
    "Compliance Complete",
    "Partner Enablement (%)",
    "Documentation Score (%)",
    "Onboarding Complete",
    "Success Probability (%)",
    "Revenue Achievement Probability (%)",
    "Failure Risk (%)",
    "ML Model Version",
  ];

  const rows = products.map((product) => {
    const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
    const prediction = Array.isArray(product.prediction) ? product.prediction[0] : product.prediction;

    return [
      product.name,
      getProductTypeLabel(product.product_type),
      product.region,
      getStageLabel(product.lifecycle_stage),
      product.launch_date || "N/A",
      product.revenue_target || 0,
      product.owner_email,
      readiness?.readiness_score || 0,
      (readiness?.risk_band || "N/A").toUpperCase(),
      readiness?.sales_training_pct || 0,
      readiness?.compliance_complete ? "Yes" : "No",
      readiness?.partner_enabled_pct || 0,
      readiness?.documentation_score || 0,
      readiness?.onboarding_complete ? "Yes" : "No",
      prediction?.success_probability || 0,
      prediction?.revenue_probability || 0,
      prediction?.failure_risk || 0,
      prediction?.model_version || "N/A",
    ].join("\t");
  });

  const tsv = [headers.join("\t"), ...rows].join("\n");

  const blob = new Blob([tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `mastercard-studio-products-${timestamp}.xls`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
