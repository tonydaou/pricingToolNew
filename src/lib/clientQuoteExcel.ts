import ExcelJS from "exceljs";
import { ClientQuoteData, generateClientQuoteSummary, formatCurrencyValue, getCurrencyByCode } from "./clientQuotePDF";
import { calculateLineItemPricing } from "./pricingCalculations";

// Brand colors
const BRAND_PRIMARY = "1E3A5F"; // Dark blue
const BRAND_LIGHT = "E8F0F8"; // Light blue background
const BRAND_ACCENT = "2563EB"; // Accent blue
const WHITE = "FFFFFF";
const GRAY_LIGHT = "F8FAFC";
const GRAY_BORDER = "E2E8F0";

export const generateClientQuoteExcel = async (data: ClientQuoteData): Promise<Blob> => {
  const summary = generateClientQuoteSummary(data);
  const currencyInfo = getCurrencyByCode(summary.currency);
  const currencyLabel = `${currencyInfo.code} (${currencyInfo.name})`;
  
  const formatCurrency = (amount: number) => formatCurrencyValue(amount, summary.currency, { showDecimals: true });
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Picacity";
  workbook.created = new Date();

  // ============ Sheet 1: Quote Summary ============
  const summarySheet = workbook.addWorksheet("Quote Summary");
  
  // Set column widths for 2-column layout (Yearly and Total Payment)
  summarySheet.columns = [
    { width: 45 },
    { width: 25 },
    { width: 25 },
  ];

  // Header row with branding
  summarySheet.mergeCells("A1:C1");
  const headerCell = summarySheet.getCell("A1");
  headerCell.value = "CLIENT QUOTE";
  headerCell.font = { bold: true, size: 20, color: { argb: WHITE } };
  headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_PRIMARY } };
  headerCell.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 40;

  // Quote details section
  let currentRow = 3;
  
  const addInfoRow = (label: string, value: string) => {
    const row = summarySheet.getRow(currentRow);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true, color: { argb: BRAND_PRIMARY } };
    row.getCell(2).value = value;
    summarySheet.mergeCells(`B${currentRow}:C${currentRow}`);
    currentRow++;
  };

  addInfoRow("Quote Name:", data.quoteName);
  addInfoRow("Date:", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  addInfoRow("Client:", data.clientName);
  addInfoRow("Main Asset:", data.mainAsset);
  addInfoRow("Commitment Period:", `${data.commitmentYears} Year${data.commitmentYears > 1 ? "s" : ""}`);
  addInfoRow("Currency:", currencyLabel);

  currentRow++;

  // Section header helper
  const addSectionHeader = (title: string) => {
    summarySheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const cell = summarySheet.getCell(`A${currentRow}`);
    cell.value = title;
    cell.font = { bold: true, size: 12, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_ACCENT } };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    summarySheet.getRow(currentRow).height = 28;
    currentRow++;
  };

  // Table header helper
  const addTableHeader = (headers: string[]) => {
    const row = summarySheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 11, color: { argb: BRAND_PRIMARY } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_LIGHT } };
      cell.border = {
        bottom: { style: "medium", color: { argb: BRAND_PRIMARY } },
      };
      cell.alignment = { horizontal: index >= 1 ? "right" : "left", vertical: "middle" };
    });
    summarySheet.getRow(currentRow).height = 24;
    currentRow++;
  };

  // Data row helper
  const addDataRow = (values: string[], isAlternate = false, isBold = false) => {
    const row = summarySheet.getRow(currentRow);
    values.forEach((value, index) => {
      const cell = row.getCell(index + 1);
      cell.value = value;
      cell.font = { bold: isBold, size: 11 };
      if (isAlternate) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY_LIGHT } };
      }
      cell.alignment = { horizontal: index >= 1 ? "right" : "left", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: GRAY_BORDER } },
      };
    });
    currentRow++;
  };

  // SELECTED MODULES
  addSectionHeader("SELECTED MODULES");
  addTableHeader(["Module", `Yearly Price (${currencyInfo.code})`, `Total Commitment Price (${currencyInfo.code})`]);
  
  // Check which modules are included
  const hasSustainability = data.lineItems.some(item => item.sustainability);
  const hasSecurity = data.lineItems.some(item => item.security);
  const hasMobility = data.lineItems.some(item => item.mobility);
  const hasInsight = data.lineItems.some(item => item.insight);
  
  addDataRow(["Sustainability", hasSustainability ? "Included" : "Not included", hasSustainability ? "Included in subscription" : "-"]);
  addDataRow(["Security", hasSecurity ? "Included" : "Not included", hasSecurity ? "Included in subscription" : "-"], true);
  addDataRow(["Mobility", hasMobility ? "Included" : "Not included", hasMobility ? "Included in subscription" : "-"]);
  addDataRow(["Insight", hasInsight ? "Included" : "Not included", hasInsight ? "Included in subscription" : "-"], true);
  
  // Support plan
  const supportPlan = data.lineItems.length > 0 ? data.lineItems[0].supportPlan : "8x5";
  addDataRow(["Support Plan", "Included", "Included in subscription"]);

  currentRow++;

  // ANNUAL PLATFORM FEE
  addSectionHeader("ANNUAL PLATFORM FEE");
  addTableHeader(["Item", `Yearly Price (${currencyInfo.code})`, `Total Commitment Price (${currencyInfo.code})`]);
  const yearlyPlatform = summary.yearlyPlatformFee;
  const totalPlatform = yearlyPlatform * data.commitmentYears;
  const totalPlatformWithDiscount = totalPlatform * (1 - summary.discountPercent / 100);
  addDataRow(["Platform Subscription Fee", formatCurrency(yearlyPlatform), formatCurrency(totalPlatformWithDiscount)]);

  currentRow++;

  // QUOTE SUMMARY
  addSectionHeader("QUOTE SUMMARY");
  
  const subscriptionGrandTotal = (summary.yearOneSubscription - summary.yearlyPlatformFee) * data.commitmentYears;
  const platformFeeTotal = summary.yearlyPlatformFee * data.commitmentYears;
  const discountMultiplier = (1 - summary.discountPercent / 100);
  
  addDataRow([`Platform Fee (${data.commitmentYears} Year${data.commitmentYears > 1 ? "s" : ""})`, formatCurrency(summary.yearlyPlatformFee), formatCurrency(platformFeeTotal * discountMultiplier)]);
  addDataRow([`Subscription Total (${data.commitmentYears} Year${data.commitmentYears > 1 ? "s" : ""})`, formatCurrency(summary.yearOneSubscription - summary.yearlyPlatformFee), formatCurrency(subscriptionGrandTotal * discountMultiplier)], true);
  addDataRow(["Total Price", formatCurrency(summary.totalBeforeDiscount / data.commitmentYears), formatCurrency(summary.totalBeforeDiscount)], false, true);

  if (summary.discountPercent > 0) {
    addDataRow([`Commitment Discount (${summary.discountPercent}%)`, formatCurrency(summary.discountAmount / data.commitmentYears), formatCurrency(summary.discountAmount)], true);
  }

  currentRow++;

  // GRAND TOTAL - Highlighted
  summarySheet.mergeCells(`A${currentRow}:B${currentRow}`);
  const grandTotalLabelCell = summarySheet.getCell(`A${currentRow}`);
  grandTotalLabelCell.value = "EQUIVALENT AFTER DISCOUNT";
  grandTotalLabelCell.font = { bold: true, size: 14, color: { argb: WHITE } };
  grandTotalLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_PRIMARY } };
  grandTotalLabelCell.alignment = { horizontal: "left", vertical: "middle" };
  
  const grandTotalValueCell = summarySheet.getCell(`C${currentRow}`);
  grandTotalValueCell.value = formatCurrency(summary.finalTotal);
  grandTotalValueCell.font = { bold: true, size: 14, color: { argb: WHITE } };
  grandTotalValueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_PRIMARY } };
  grandTotalValueCell.alignment = { horizontal: "right", vertical: "middle" };
  summarySheet.getRow(currentRow).height = 32;
  
  currentRow++;

  // Add yearly equivalent row for clarity
  addDataRow(["Yearly Equivalent", formatCurrency(summary.finalTotal / data.commitmentYears), ""], false, true);
  
  currentRow += 2;

  // Footer note
  const footerCell = summarySheet.getCell(`A${currentRow}`);
  footerCell.value = `All prices are in ${currencyLabel} and exclude applicable taxes.`;
  footerCell.font = { italic: true, size: 10, color: { argb: "64748B" } };
  summarySheet.mergeCells(`A${currentRow}:C${currentRow}`);

  // ============ Sheet 2: Line Items Detail ============
  const lineItemsSheet = workbook.addWorksheet("Line Items");
  
  lineItemsSheet.columns = [
    { width: 25 },  // Line Item
    { width: 20 },  // Asset Type
    { width: 28 },  // Description
    { width: 12 },  // Size
    { width: 10 },  // Quantity
    { width: 14 },  // Sustainability
    { width: 10 },  // Security
    { width: 16 },  // Security Channels
    { width: 10 },  // Mobility
    { width: 16 },  // Mobility Channels
    { width: 10 },  // Insight
    { width: 12 },  // Support Plan
  ];

  // Header row
  lineItemsSheet.mergeCells("A1:L1");
  const lineItemsHeader = lineItemsSheet.getCell("A1");
  lineItemsHeader.value = "LINE ITEMS DETAIL";
  lineItemsHeader.font = { bold: true, size: 20, color: { argb: WHITE } };
  lineItemsHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_PRIMARY } };
  lineItemsHeader.alignment = { horizontal: "center", vertical: "middle" };
  lineItemsSheet.getRow(1).height = 40;

  // Table headers
  const headers = [
    "Line Item", "Asset Type", "Description", "Size (sqm)", "Quantity", "Sustainability",
    "Security", "Sec. Channels", "Mobility", "Mob. Channels", "Insight", "Support"
  ];
  
  const headerRow = lineItemsSheet.getRow(3);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_ACCENT } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      bottom: { style: "medium", color: { argb: BRAND_PRIMARY } },
    };
  });
  lineItemsSheet.getRow(3).height = 28;

  // Data rows
  let currentDataRow = 4;
  
  data.lineItems.forEach((item, index) => {
    // Main line item
    const mainRow = lineItemsSheet.getRow(currentDataRow);
    const isAlternate = currentDataRow % 2 === 0;
    
    const mainValues = [
      `Line Item ${index + 1}`,
      item.subMainAsset || item.assetType || "-",
      item.description || "-",
      item.size || 0,
      item.quantity || 1,
      item.sustainability ? "Y" : "N",
      item.security ? "Y" : "N",
      item.securityChannels || 0,
      item.mobility ? "Y" : "N",
      item.mobilityChannels || 0,
      item.insight ? "Y" : "N",
      item.supportPlan || "-",
    ];
    
    mainValues.forEach((value, colIndex) => {
      const cell = mainRow.getCell(colIndex + 1);
      cell.value = value;
      cell.font = { bold: true, size: 10 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (isAlternate) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY_LIGHT } };
      }
      cell.border = {
        bottom: { style: "thin", color: { argb: GRAY_BORDER } },
        left: { style: "thin", color: { argb: GRAY_BORDER } },
        right: { style: "thin", color: { argb: GRAY_BORDER } },
      };
    });
    currentDataRow++;

    // Sub-line items if they exist
    if (item.subLineItems && item.subLineItems.length > 0) {
      item.subLineItems.forEach((subItem, subIndex) => {
        const subRow = lineItemsSheet.getRow(currentDataRow);
        const isSubAlternate = currentDataRow % 2 === 0;
        
        const subValues = [
          `  └─ Sub ${subIndex + 1}`,
          subItem.assetType || "-",
          subItem.description || "-",
          subItem.size || 0,
          subItem.quantity || 1,
          subItem.sustainability ? "Y" : "N",
          subItem.security ? "Y" : "N",
          subItem.securityChannels || 0,
          subItem.mobility ? "Y" : "N",
          subItem.mobilityChannels || 0,
          subItem.insight ? "Y" : "N",
          subItem.supportPlan || "-",
        ];
        
        subValues.forEach((value, colIndex) => {
          const cell = subRow.getCell(colIndex + 1);
          cell.value = value;
          cell.font = { size: 10, italic: true };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          if (isSubAlternate) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F4F8" } };
          }
          cell.border = {
            bottom: { style: "thin", color: { argb: GRAY_BORDER } },
            left: { style: "thin", color: { argb: GRAY_BORDER } },
            right: { style: "thin", color: { argb: GRAY_BORDER } },
          };
        });
        currentDataRow++;
      });
    }
  });

  // Generate the Excel file as a Blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};
