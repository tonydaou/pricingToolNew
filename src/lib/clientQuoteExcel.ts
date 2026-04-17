import ExcelJS from "exceljs";
import {
  ClientQuoteData,
  generateClientQuoteSummary,
  getCurrencyByCode,
} from "./clientQuotePDF";

// Brand colors
const BRAND_PRIMARY = "1E3A5F";
const BRAND_ACCENT = "2563EB";
const WHITE = "FFFFFF";
const GRAY_LIGHT = "F8FAFC";
const GRAY_BORDER = "E2E8F0";
const YELLOW_FILL = "FFFF00";
const RED_HEADER = "C00000";
const BLUE_HEADER = "4472C4";
const LIGHT_BLUE_HEADER = "BDD7EE";
const DARK_RED_HEADER = "FF0000";

// ─── Effort Estimation Types ───────────────────────────────────────────────

export interface EffortEstimationData {
  margin: number;       // e.g. 0.30 for 30%
  travelPercent: number; // e.g. 0.10 for 10%
  activities: {
    name: string;
    calDays: number;
  }[];
  // allocation[activityIndex][resourceIndex] = percentage (0–1)
  allocation: number[][];
}

export const ACTIVITY_NAMES = [
  "Partner in charge",
  "Tech Lead",
  "Requirement / Design / Plan",
  "Development & Integration",
  "Compliance - Infrastructure, Cyber Security, and Data",
  "QA & Documentation",
];

export const RESOURCE_NAMES = [
  "Partner",
  "PM",
  "Analyst",
  "3D Modeler",
  "Data Eng.",
  "Data Eng.",
  "ML Eng.",
  "Developer",
  "Developer",
  "Tech Lead",
];

// Fixed daily costs per role
const ROLE_COSTS: Record<string, number> = {
  Partner: 1400,
  "Program Manager": 1100,
  "Senior PM": 909,
  PM: 909,
  Principal: 1300,
  "SME / Sr. Cons": 1200,
  Cons: 825,
  "Data Eng.": 800,
  "3D Modeler": 500,
  "ML Eng.": 800,
  Developer: 700,
  "Tech Lead": 800,
  Analyst: 700,
};

// Daily costs mapped to each resource column (same order as RESOURCE_NAMES)
const RESOURCE_DAILY_COSTS: number[] = [
  ROLE_COSTS["Partner"],
  ROLE_COSTS["PM"],
  ROLE_COSTS["Analyst"],
  ROLE_COSTS["3D Modeler"],
  ROLE_COSTS["Data Eng."],
  ROLE_COSTS["Data Eng."],
  ROLE_COSTS["ML Eng."],
  ROLE_COSTS["Developer"],
  ROLE_COSTS["Developer"],
  ROLE_COSTS["Tech Lead"],
];

export const defaultEffortEstimation = (): EffortEstimationData => ({
  margin: 0.3,
  travelPercent: 0.1,
  activities: ACTIVITY_NAMES.map((name) => ({ name, calDays: 0 })),
  allocation: ACTIVITY_NAMES.map(() => RESOURCE_NAMES.map(() => 0)),
});

// ─── Column letter helper ──────────────────────────────────────────────────
function colLetter(colIndex: number): string {
  let result = "";
  while (colIndex > 0) {
    const rem = (colIndex - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    colIndex = Math.floor((colIndex - 1) / 26);
  }
  return result;
}

// ─── Main export ──────────────────────────────────────────────────────────

export const generateClientQuoteExcel = async (
  data: ClientQuoteData,
  effortData?: EffortEstimationData
): Promise<Blob> => {
  const summary = generateClientQuoteSummary(data);
  const currencyInfo = getCurrencyByCode(summary.currency);
  const currencyLabel = `${currencyInfo.code} (${currencyInfo.name})`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Picacity";
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  // =========================================================
  // SHEET 1: QUOTE SUMMARY
  // =========================================================
  const summarySheet = workbook.addWorksheet("Quote Summary");
  summarySheet.columns = [{ width: 45 }, { width: 25 }, { width: 25 }];

  const MONEY_FORMAT = "#,##0";
  const PERCENT_FORMAT = "0%";

  const toNumericCurrency = (amount: number): number => {
    const currency = getCurrencyByCode(data.currency);
    return amount * currency.rate;
  };

  const setMoneyCell = (cell: ExcelJS.Cell) => {
    cell.numFmt = MONEY_FORMAT;
    cell.alignment = { horizontal: "right", vertical: "middle" };
  };

  const setPercentCell = (cell: ExcelJS.Cell) => {
    cell.numFmt = PERCENT_FORMAT;
    cell.alignment = { horizontal: "right", vertical: "middle" };
  };

  summarySheet.mergeCells("A1:C1");
  const headerCell = summarySheet.getCell("A1");
  headerCell.value = "CLIENT QUOTE";
  headerCell.font = { bold: true, size: 20, color: { argb: WHITE } };
  headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_PRIMARY } };
  headerCell.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 40;

  let currentRow = 3;

  const addInfoRow = (label: string, value: string) => {
    const row = summarySheet.getRow(currentRow);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true, color: { argb: BRAND_PRIMARY } };
    row.getCell(2).value = value;
    summarySheet.mergeCells(`B${currentRow}:C${currentRow}`);
    currentRow++;
    return currentRow - 1;
  };

  const addSectionHeader = (title: string) => {
    summarySheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const cell = summarySheet.getCell(`A${currentRow}`);
    cell.value = title;
    cell.font = { bold: true, size: 12, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_ACCENT } };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    summarySheet.getRow(currentRow).height = 28;
    currentRow++;
    return currentRow - 1;
  };

  const addTableHeader = (headers: string[]) => {
    const row = summarySheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 11, color: { argb: BRAND_PRIMARY } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E8F0F8" } };
      cell.border = { bottom: { style: "medium", color: { argb: BRAND_PRIMARY } } };
      cell.alignment = { horizontal: index >= 1 ? "right" : "left", vertical: "middle" };
    });
    summarySheet.getRow(currentRow).height = 24;
    currentRow++;
    return currentRow - 1;
  };

  type CellValueInput =
    | string
    | number
    | { formula: string; result: number; kind?: "money" | "percent" | "number" };

  const addDataRow = (values: CellValueInput[], isAlternate = false, isBold = false) => {
    const rowNumber = currentRow;
    const row = summarySheet.getRow(currentRow);
    values.forEach((value, index) => {
      const cell = row.getCell(index + 1);
      if (typeof value === "object" && value !== null && "formula" in value) {
        cell.value = { formula: value.formula, result: value.result };
        if (value.kind === "percent") setPercentCell(cell);
        else if (value.kind === "number") cell.alignment = { horizontal: "right", vertical: "middle" };
        else setMoneyCell(cell);
      } else if (typeof value === "number") {
        cell.value = value;
        if (index >= 1) setMoneyCell(cell);
        else cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.value = value;
        cell.alignment = { horizontal: index >= 1 ? "right" : "left", vertical: "middle" };
      }
      cell.font = { bold: isBold, size: 11 };
      if (isAlternate) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY_LIGHT } };
      cell.border = { bottom: { style: "thin", color: { argb: GRAY_BORDER } } };
    });
    currentRow++;
    return rowNumber;
  };

  addInfoRow("Quote Name:", data.quoteName);
  addInfoRow("Date:", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  addInfoRow("Client:", data.clientName);
  addInfoRow("Main Asset:", data.mainAsset);
  addInfoRow("Commitment Period:", `${data.commitmentYears} Year${data.commitmentYears > 1 ? "s" : ""}`);
  addInfoRow("Currency:", currencyLabel);
  currentRow++;

  addSectionHeader("SELECTED MODULES");
  addTableHeader([
    "Module",
    `Yearly Price (${currencyInfo.code})`,
    `Total Commitment Price (${currencyInfo.code})`,
  ]);

  const hasSustainability = data.lineItems.some(
    (item) => item.sustainability || (item.subLineItems && item.subLineItems.some((sub) => sub.sustainability))
  );
  const hasSecurity = data.lineItems.some(
    (item) => item.security || (item.subLineItems && item.subLineItems.some((sub) => sub.security))
  );
  const hasMobility = data.lineItems.some(
    (item) => item.mobility || (item.subLineItems && item.subLineItems.some((sub) => sub.mobility))
  );
  const hasInsight = data.lineItems.some(
    (item) => item.insight || (item.subLineItems && item.subLineItems.some((sub) => sub.insight))
  );

  addDataRow(["Sustainability", hasSustainability ? "Included" : "Not included", hasSustainability ? "Included in subscription" : "-"]);
  addDataRow(["Security", hasSecurity ? "Included" : "Not included", hasSecurity ? "Included in subscription" : "-"], true);
  addDataRow(["Mobility", hasMobility ? "Included" : "Not included", hasMobility ? "Included in subscription" : "-"]);
  addDataRow(["Insight", hasInsight ? "Included" : "Not included", hasInsight ? "Included in subscription" : "-"], true);
  addDataRow(["Support Plan", "Included", "Included in subscription"]);
  currentRow++;

  addSectionHeader("ANNUAL PLATFORM FEE");
  addTableHeader([
    "Item",
    `Yearly Price (${currencyInfo.code})`,
    `Total Commitment Price (${currencyInfo.code})`,
  ]);

  const yearlyPlatformRaw = summary.yearlyPlatformFee;
  const totalPlatformRaw = yearlyPlatformRaw * data.commitmentYears;
  const yearlyPlatform = toNumericCurrency(yearlyPlatformRaw);
  const totalPlatform = toNumericCurrency(totalPlatformRaw);

  const platformAnnualRow = addDataRow([
    "Platform Subscription Fee",
    yearlyPlatform,
    { formula: `B${currentRow}*${data.commitmentYears}`, result: totalPlatform, kind: "money" },
  ]);
  summarySheet.getCell(`C${platformAnnualRow}`).value = {
    formula: `B${platformAnnualRow}*${data.commitmentYears}`,
    result: totalPlatform,
  };
  setMoneyCell(summarySheet.getCell(`C${platformAnnualRow}`));
  currentRow++;

  addSectionHeader("QUOTE SUMMARY");

  const discountRow = addDataRow(["Discount (%)", summary.discountPercent / 100, ""], false, false);
  setPercentCell(summarySheet.getCell(`B${discountRow}`));
  currentRow++;

  const yearlySubscriptionRaw = summary.yearOneSubscription - summary.yearlyPlatformFee;
  const totalSubscriptionRaw = yearlySubscriptionRaw * data.commitmentYears;
  const totalBeforeDiscountRaw = totalPlatformRaw + totalSubscriptionRaw;
  const discountAmountRaw = totalBeforeDiscountRaw * (summary.discountPercent / 100);
  const finalTotalRaw = totalBeforeDiscountRaw - discountAmountRaw;

  const yearlySubscription = toNumericCurrency(yearlySubscriptionRaw);
  const totalSubscription = toNumericCurrency(totalSubscriptionRaw);
  const totalBeforeDiscountPerYear = toNumericCurrency(totalBeforeDiscountRaw / data.commitmentYears);
  const totalBeforeDiscount = toNumericCurrency(totalBeforeDiscountRaw);
  const discountAmount = toNumericCurrency(discountAmountRaw);
  const finalTotal = toNumericCurrency(finalTotalRaw);
  const yearlyEquivalent = toNumericCurrency(finalTotalRaw / data.commitmentYears);

  const platformSummaryRow = addDataRow([
    `Platform Fee (${data.commitmentYears} Year${data.commitmentYears > 1 ? "s" : ""})`,
    yearlyPlatform,
    { formula: `B${currentRow + 1}*${data.commitmentYears}`, result: totalPlatform, kind: "money" },
  ]);
  summarySheet.getCell(`C${platformSummaryRow}`).value = {
    formula: `B${platformSummaryRow}*${data.commitmentYears}`,
    result: totalPlatform,
  };
  setMoneyCell(summarySheet.getCell(`C${platformSummaryRow}`));

  const subscriptionSummaryRow = addDataRow(
    [
      `Subscription Total (${data.commitmentYears} Year${data.commitmentYears > 1 ? "s" : ""})`,
      yearlySubscription,
      { formula: `B${currentRow + 1}*${data.commitmentYears}`, result: totalSubscription, kind: "money" },
    ],
    true
  );
  summarySheet.getCell(`C${subscriptionSummaryRow}`).value = {
    formula: `B${subscriptionSummaryRow}*${data.commitmentYears}`,
    result: totalSubscription,
  };
  setMoneyCell(summarySheet.getCell(`C${subscriptionSummaryRow}`));

  const totalPriceRow = addDataRow(
    [
      "Total Price",
      { formula: `B${platformSummaryRow}+B${subscriptionSummaryRow}`, result: totalBeforeDiscountPerYear, kind: "money" },
      { formula: `C${platformSummaryRow}+C${subscriptionSummaryRow}`, result: totalBeforeDiscount, kind: "money" },
    ],
    false,
    true
  );

  const commitmentDiscountRow = addDataRow(
    [
      "Commitment Discount",
      {
        formula: `B${totalPriceRow}*B${discountRow}`,
        result: toNumericCurrency((totalBeforeDiscountRaw / data.commitmentYears) * (summary.discountPercent / 100)),
        kind: "money",
      },
      { formula: `C${totalPriceRow}*B${discountRow}`, result: discountAmount, kind: "money" },
    ],
    true
  );
  currentRow++;

  const grandTotalRow = currentRow;
  summarySheet.mergeCells(`A${grandTotalRow}:B${grandTotalRow}`);
  const grandTotalLabelCell = summarySheet.getCell(`A${grandTotalRow}`);
  grandTotalLabelCell.value = "EQUIVALENT AFTER DISCOUNT";
  grandTotalLabelCell.font = { bold: true, size: 14, color: { argb: WHITE } };
  grandTotalLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_PRIMARY } };
  grandTotalLabelCell.alignment = { horizontal: "left", vertical: "middle" };

  const grandTotalValueCell = summarySheet.getCell(`C${grandTotalRow}`);
  grandTotalValueCell.value = { formula: `C${totalPriceRow}-C${commitmentDiscountRow}`, result: finalTotal };
  setMoneyCell(grandTotalValueCell);
  grandTotalValueCell.font = { bold: true, size: 14, color: { argb: WHITE } };
  grandTotalValueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_PRIMARY } };
  summarySheet.getRow(grandTotalRow).height = 32;
  currentRow++;

  addDataRow(
    [
      "Yearly Equivalent",
      { formula: `C${grandTotalRow}/${data.commitmentYears}`, result: yearlyEquivalent, kind: "money" },
      "",
    ],
    false,
    true
  );
  currentRow += 2;

  const footerCell = summarySheet.getCell(`A${currentRow}`);
  footerCell.value = `All prices are in ${currencyLabel} and exclude applicable taxes.`;
  footerCell.font = { italic: true, size: 10, color: { argb: "64748B" } };
  summarySheet.mergeCells(`A${currentRow}:C${currentRow}`);

  // =========================================================
  // SHEET 2: LINE ITEMS
  // =========================================================
  const lineItemsSheet = workbook.addWorksheet("Line Items");
  lineItemsSheet.columns = [
    { width: 25 }, { width: 20 }, { width: 28 }, { width: 12 }, { width: 10 },
    { width: 14 }, { width: 10 }, { width: 16 }, { width: 10 }, { width: 16 }, { width: 10 }, { width: 12 },
  ];

  lineItemsSheet.mergeCells("A1:L1");
  const lineItemsHeader = lineItemsSheet.getCell("A1");
  lineItemsHeader.value = "LINE ITEMS DETAIL";
  lineItemsHeader.font = { bold: true, size: 20, color: { argb: WHITE } };
  lineItemsHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_PRIMARY } };
  lineItemsHeader.alignment = { horizontal: "center", vertical: "middle" };
  lineItemsSheet.getRow(1).height = 40;

  const liHeaders = [
    "Line Item", "Asset Type", "Description", "Size (sqm)", "Quantity",
    "Sustainability", "Security", "Sec. Channels", "Mobility", "Mob. Channels", "Insight", "Support",
  ];
  const headerRow = lineItemsSheet.getRow(3);
  liHeaders.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_ACCENT } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: BRAND_PRIMARY } } };
  });
  lineItemsSheet.getRow(3).height = 28;

  let currentDataRow = 4;
  data.lineItems.forEach((item, index) => {
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
      if (isAlternate) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY_LIGHT } };
      cell.border = {
        bottom: { style: "thin", color: { argb: GRAY_BORDER } },
        left: { style: "thin", color: { argb: GRAY_BORDER } },
        right: { style: "thin", color: { argb: GRAY_BORDER } },
      };
    });
    currentDataRow++;

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
          if (isSubAlternate) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F4F8" } };
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

  // =========================================================
  // SHEET 3: EFFORT ESTIMATION
  // =========================================================
  const effort = effortData ?? defaultEffortEstimation();
  addEffortEstimationSheet(workbook, effort);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

// ─── Effort Estimation Sheet ───────────────────────────────────────────────
function addEffortEstimationSheet(workbook: ExcelJS.Workbook, effort: EffortEstimationData) {
  const ws = workbook.addWorksheet("Effort Estimation");

  // ── Color constants ──
  const RED_BG      = "C00000";
  const BLUE_BG     = "4472C4";
  const YELLOW      = "FFFF00";
  const WHITE       = "FFFFFF";
  const GRAY_BG     = "D9D9D9";
  const LIGHT_GRAY  = "F2F2F2";

  const PCT_FMT     = "0%";
  const NUM_FMT     = "#,##0";
  const MONEY_FMT   = "#,##0";
  const RATE_FMT    = "$ #,##0";

  const NUM_RESOURCES  = 10;
  const NUM_ACTIVITIES = 6;

  // ── Column layout (1-based) ──
  // A=1..D=4: activity label (merged)
  // E=5: WEEKS (formula)
  // F=6: CAL DAYS (yellow, editable) ← $F in formulas
  // G=7: spacer
  // H=8..Q=17: 10 resource allocation % columns
  // R=18: spacer
  // S=19: Effort Breakdown per track
  // T=20: spacer
  // U=21: Price
  // V=22: Cost
  // W=23: spacer
  // X=24: Type (rates table)
  // Y=25: Rate (formula)
  // Z=26: Cost (editable)
  // AA=27: Margin

  const COL_ACT_START   = 1;
  const COL_ACT_END     = 4;
  const COL_WEEKS       = 5;
  const COL_CALDAYS     = 6;  // ← $F in formulas
  const COL_SPACER1     = 7;
  const COL_RES_START   = 8;  // H
  const COL_RES_END     = 17; // Q
  const COL_SPACER2     = 18;
  const COL_BREAKDOWN   = 19; // S
  const COL_SPACER3     = 20;
  const COL_PRICE       = 21; // U
  const COL_COST        = 22; // V
  const COL_SPACER4     = 23;
  const COL_RATE_TYPE   = 24; // X
  const COL_RATE_RATE   = 25; // Y
  const COL_RATE_COST   = 26; // Z
  const COL_RATE_MARGIN = 27; // AA

  // Row positions
  const ACTIVITY_ROWS    = [6, 8, 10, 12, 14, 16];
  const RATES_START_ROW  = 6;
  const EFFORT_TOTAL_ROW = 19; // "Resource Effort Total" header row — also holds col S total
  const VALUES_ROW       = 20; // resource effort day totals per column
  const COST_ROW         = 21;
  const PRICE_ROW        = 22;
  const TRAVEL_ROW       = 23;
  const PRICE_TRAVEL_ROW = 24;

  // Set column widths
  for (let c = COL_ACT_START; c <= COL_ACT_END; c++) ws.getColumn(c).width = 12;
  ws.getColumn(COL_WEEKS).width = 10;
  ws.getColumn(COL_CALDAYS).width = 10;
  ws.getColumn(COL_SPACER1).width = 4;
  for (let c = COL_RES_START; c <= COL_RES_END; c++) ws.getColumn(c).width = 11;
  ws.getColumn(COL_SPACER2).width = 4;
  ws.getColumn(COL_BREAKDOWN).width = 14;
  ws.getColumn(COL_SPACER3).width = 4;
  ws.getColumn(COL_PRICE).width = 13;
  ws.getColumn(COL_COST).width = 13;
  ws.getColumn(COL_SPACER4).width = 4;
  ws.getColumn(COL_RATE_TYPE).width = 16;
  ws.getColumn(COL_RATE_RATE).width = 13;
  ws.getColumn(COL_RATE_COST).width = 13;
  ws.getColumn(COL_RATE_MARGIN).width = 10;

  // ── Helper: style cell ──
  const sc = (
    cell: ExcelJS.Cell,
    opts: {
      v?: any;
      bold?: boolean;
      size?: number;
      color?: string;
      bg?: string;
      ha?: ExcelJS.Alignment["horizontal"];
      va?: ExcelJS.Alignment["vertical"];
      fmt?: string;
      wrap?: boolean;
      italic?: boolean;
      border?: boolean;
    }
  ) => {
    if (opts.v !== undefined) cell.value = opts.v;
    cell.font = {
      bold: opts.bold ?? false,
      size: opts.size ?? 10,
      color: opts.color ? { argb: opts.color } : undefined,
      italic: opts.italic ?? false,
    };
    if (opts.bg) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.bg } };
    }
    cell.alignment = {
      horizontal: opts.ha ?? "center",
      vertical: opts.va ?? "middle",
      wrapText: opts.wrap ?? false,
    };
    if (opts.fmt) cell.numFmt = opts.fmt;
    if (opts.border !== false) {
      cell.border = {
        top:    { style: "thin", color: { argb: "BFBFBF" } },
        bottom: { style: "thin", color: { argb: "BFBFBF" } },
        left:   { style: "thin", color: { argb: "BFBFBF" } },
        right:  { style: "thin", color: { argb: "BFBFBF" } },
      };
    }
  };

  const merge = (r1: number, c1: number, r2: number, c2: number) => {
    try { ws.mergeCells(r1, c1, r2, c2); } catch (e) { /* already merged */ }
  };

  // Resource header names (matching image exactly)
  const RES_HEADERS = ["Partner", "PM", "ANALYST", "3D MODELER", "DATA ENG.", "DATA ENG.", "ML ENG.", "Developer", "Developer", "Tech Lead"];

  // ── ROW 3: Section headers ──
  ws.getRow(3).height = 32;

  // "Resource Allocation (% per track)" merged across H3:Q3
  merge(3, COL_RES_START, 3, COL_RES_END);
  sc(ws.getCell(3, COL_RES_START), {
    v: "Resource Allocation  (% per track)",
    bold: true, size: 10, color: WHITE, bg: BLUE_BG, ha: "center",
  });

  // "Effort Breakdown per track" merged rows 3-4 col S
  merge(3, COL_BREAKDOWN, 4, COL_BREAKDOWN);
  sc(ws.getCell(3, COL_BREAKDOWN), {
    v: "Effort Breakdown\nper track",
    bold: true, size: 9, color: WHITE, bg: RED_BG, ha: "center", wrap: true,
  });

  // "Price" merged rows 3-4 col U
  merge(3, COL_PRICE, 4, COL_PRICE);
  sc(ws.getCell(3, COL_PRICE), {
    v: "Price", bold: true, size: 10, color: WHITE, bg: RED_BG, ha: "center",
  });

  // "Cost" merged rows 3-4 col V
  merge(3, COL_COST, 4, COL_COST);
  sc(ws.getCell(3, COL_COST), {
    v: "Cost", bold: true, size: 10, color: WHITE, bg: RED_BG, ha: "center",
  });

  // "1. Apply rates here" header X3:AA3
  merge(3, COL_RATE_TYPE, 3, COL_RATE_MARGIN);
  sc(ws.getCell(3, COL_RATE_TYPE), {
    v: "1. Apply rates here",
    bold: true, size: 10, color: WHITE, bg: RED_BG, ha: "center",
  });

  // ── ROW 4: Column sub-headers ──
  ws.getRow(4).height = 28;

  sc(ws.getCell(4, COL_WEEKS),   { v: "WEEKS",    bold: true, size: 9, color: WHITE, bg: BLUE_BG });
  sc(ws.getCell(4, COL_CALDAYS), { v: "CAL DAYS", bold: true, size: 9, color: WHITE, bg: BLUE_BG });

  for (let ri = 0; ri < NUM_RESOURCES; ri++) {
    sc(ws.getCell(4, COL_RES_START + ri), {
      v: RES_HEADERS[ri], bold: true, size: 8, color: WHITE, bg: BLUE_BG, ha: "center", wrap: true,
    });
  }

  // Rates table col headers row 4
  sc(ws.getCell(4, COL_RATE_TYPE),   { v: "Type",   bold: true, size: 9, bg: GRAY_BG });
  sc(ws.getCell(4, COL_RATE_RATE),   { v: "Rate",   bold: true, size: 9, bg: GRAY_BG });
  sc(ws.getCell(4, COL_RATE_COST),   { v: "Cost",   bold: true, size: 9, bg: GRAY_BG });
  sc(ws.getCell(4, COL_RATE_MARGIN), { v: "Margin", bold: true, size: 9, bg: GRAY_BG });

  // ── RATES TABLE rows 6..18 (right side) ──
  const ROLES = Object.keys(ROLE_COSTS);
  const ROLE_COST_VALUES = Object.values(ROLE_COSTS);
  const marginCellAddr = `${colLetter(COL_RATE_MARGIN)}${RATES_START_ROW}`; // AA6

  ROLES.forEach((roleName, i) => {
    const rRow = RATES_START_ROW + i;
    ws.getRow(rRow).height = 16;
    const bg = i % 2 === 0 ? WHITE : LIGHT_GRAY;

    sc(ws.getCell(rRow, COL_RATE_TYPE), { v: roleName, size: 9, ha: "left", va: "middle", bg });

    // Cost (editable, yellow)
    sc(ws.getCell(rRow, COL_RATE_COST), { v: ROLE_COST_VALUES[i], size: 9, ha: "right", bg: YELLOW, fmt: RATE_FMT });

    // Margin: first row = editable, rest = reference
    if (i === 0) {
      sc(ws.getCell(rRow, COL_RATE_MARGIN), { v: effort.margin, size: 9, ha: "right", bg: YELLOW, fmt: PCT_FMT });
    } else {
      ws.getCell(rRow, COL_RATE_MARGIN).value = { formula: `$${marginCellAddr}`, result: effort.margin };
      sc(ws.getCell(rRow, COL_RATE_MARGIN), { size: 9, ha: "right", fmt: PCT_FMT });
    }

    // Rate = Cost / (1 - Margin)
    const costRef = `${colLetter(COL_RATE_COST)}${rRow}`;
    ws.getCell(rRow, COL_RATE_RATE).value = {
      formula: `${costRef}/(1-$${marginCellAddr})`,
      result: ROLE_COST_VALUES[i] / (1 - effort.margin),
    };
    sc(ws.getCell(rRow, COL_RATE_RATE), { size: 9, ha: "right", fmt: RATE_FMT, bg: WHITE });
  });

  // ── VLOOKUP helper table at rows 30+ (X:Z) ──
  // Col X = resource header name (matches row 4 headers exactly for VLOOKUP key)
  // Col Y = Rate  → formula referencing the matching Cost cell in the main rates table + $AA$6
  // Col Z = Cost  → formula referencing the matching Cost cell in the main rates table
  //
  // This means: change margin ($AA$6) or any Cost in the rates table above →
  // these cells recalculate → all VLOOKUP-based Price/Cost formulas update automatically.
  //
  // ROLES order in rates table (rows 6..18):
  //   0=Partner, 1=Program Manager, 2=Senior PM, 3=PM, 4=Principal,
  //   5=SME/Sr.Cons, 6=Cons, 7=Data Eng., 8=3D Modeler, 9=ML Eng.,
  //   10=Developer, 11=Tech Lead, 12=Analyst
  // So the row in the rates table for role index i = RATES_START_ROW + i

  const VLOOKUP_TABLE_START = 30;

  // Each entry: resource header name (col X key) + index into ROLES array for cost lookup
  const vlookupRows: { name: string; rolesIdx: number; costVal: number }[] = [
    { name: "Partner",    rolesIdx: 0,  costVal: ROLE_COSTS["Partner"]    },
    { name: "PM",         rolesIdx: 3,  costVal: ROLE_COSTS["PM"]         },
    { name: "ANALYST",    rolesIdx: 12, costVal: ROLE_COSTS["Analyst"]    },
    { name: "3D MODELER", rolesIdx: 8,  costVal: ROLE_COSTS["3D Modeler"] },
    { name: "DATA ENG.",  rolesIdx: 7,  costVal: ROLE_COSTS["Data Eng."]  },
    { name: "DATA ENG.",  rolesIdx: 7,  costVal: ROLE_COSTS["Data Eng."]  },
    { name: "ML ENG.",    rolesIdx: 9,  costVal: ROLE_COSTS["ML Eng."]    },
    { name: "Developer",  rolesIdx: 10, costVal: ROLE_COSTS["Developer"]  },
    { name: "Developer",  rolesIdx: 10, costVal: ROLE_COSTS["Developer"]  },
    { name: "Tech Lead",  rolesIdx: 11, costVal: ROLE_COSTS["Tech Lead"]  },
  ];

  vlookupRows.forEach((d, i) => {
    const vRow = VLOOKUP_TABLE_START + i;
    // The Cost cell in the main rates table for this role
    const ratesTableCostRef = `$${colLetter(COL_RATE_COST)}$${RATES_START_ROW + d.rolesIdx}`;

    // Col X: resource header name (static label — used as VLOOKUP key)
    ws.getCell(vRow, COL_RATE_TYPE).value = d.name;

    // Col Z: Cost — formula referencing the rates table cost cell (stays live)
    ws.getCell(vRow, COL_RATE_COST).value = {
      formula: ratesTableCostRef,
      result: d.costVal,
    };
    ws.getCell(vRow, COL_RATE_COST).numFmt = RATE_FMT;

    // Col Y: Rate = Cost / (1 - Margin) — both inputs are formula-driven
    const thisCostRef = `${colLetter(COL_RATE_COST)}${vRow}`;
    ws.getCell(vRow, COL_RATE_RATE).value = {
      formula: `${thisCostRef}/(1-$${marginCellAddr})`,
      result: d.costVal / (1 - effort.margin),
    };
    ws.getCell(vRow, COL_RATE_RATE).numFmt = RATE_FMT;
  });

  const VL_END   = VLOOKUP_TABLE_START + vlookupRows.length - 1;
  const VL_RANGE = `$${colLetter(COL_RATE_TYPE)}$${VLOOKUP_TABLE_START}:$${colLetter(COL_RATE_COST)}$${VL_END}`;

  // ── ACTIVITY ROWS (6, 8, 10, 12, 14, 16) ──
  ACTIVITY_NAMES.forEach((actName, ai) => {
    const aRow = ACTIVITY_ROWS[ai];
    ws.getRow(aRow).height = 18;

    // Activity name (merged A:D)
    merge(aRow, COL_ACT_START, aRow, COL_ACT_END);
    sc(ws.getCell(aRow, COL_ACT_START), { v: actName, size: 10, ha: "left", va: "middle", bg: "E9EFF8" });

    // Cal Days (F, yellow)
    const calDays = effort.activities[ai]?.calDays ?? 0;
    sc(ws.getCell(aRow, COL_CALDAYS), { v: calDays, size: 10, ha: "right", bg: YELLOW, fmt: NUM_FMT });
    const calRef = `${colLetter(COL_CALDAYS)}${aRow}`; // e.g. F6

    // Weeks = CalDays / 5 (E)
    ws.getCell(aRow, COL_WEEKS).value = { formula: `${calRef}/5`, result: calDays / 5 };
    sc(ws.getCell(aRow, COL_WEEKS), { size: 10, ha: "right", fmt: "0" });

    // Resource allocation % (H..Q, yellow)
    for (let ri = 0; ri < NUM_RESOURCES; ri++) {
      const allocVal = effort.allocation[ai]?.[ri] ?? 0;
      sc(ws.getCell(aRow, COL_RES_START + ri), { v: allocVal, size: 10, ha: "right", bg: YELLOW, fmt: PCT_FMT });
    }

    // ── Col S: Effort Breakdown per track ──
    // =H{r}*$F{r}+I{r}*$F{r}+...+Q{r}*$F{r}
    const breakdownParts = Array.from({ length: NUM_RESOURCES }, (_, ri) =>
      `${colLetter(COL_RES_START + ri)}${aRow}*$${calRef}`
    ).join("+");
    const breakdownResult = (effort.allocation[ai] ?? []).reduce(
      (sum, pct) => sum + pct * calDays, 0
    );
    ws.getCell(aRow, COL_BREAKDOWN).value = { formula: breakdownParts, result: breakdownResult };
    sc(ws.getCell(aRow, COL_BREAKDOWN), { size: 10, ha: "right", fmt: NUM_FMT });

    // ── Col U: Price per track ──
    // =H{r}*F{r}*VLOOKUP($H$4,VL_RANGE,2,0)+...
    const priceParts = Array.from({ length: NUM_RESOURCES }, (_, ri) => {
      const resCol = colLetter(COL_RES_START + ri);
      return `${resCol}${aRow}*${calRef}*VLOOKUP($${resCol}$4,${VL_RANGE},2,0)`;
    }).join("+");
    const priceResult = (effort.allocation[ai] ?? []).reduce((sum, pct, ri) =>
      sum + pct * calDays * (RESOURCE_DAILY_COSTS[ri] / (1 - effort.margin)), 0);
    ws.getCell(aRow, COL_PRICE).value = { formula: priceParts, result: priceResult };
    sc(ws.getCell(aRow, COL_PRICE), { size: 10, ha: "right", fmt: MONEY_FMT });

    // ── Col V: Cost per track ──
    // =H{r}*F{r}*VLOOKUP($H$4,VL_RANGE,3,0)+...
    const costParts = Array.from({ length: NUM_RESOURCES }, (_, ri) => {
      const resCol = colLetter(COL_RES_START + ri);
      return `${resCol}${aRow}*${calRef}*VLOOKUP($${resCol}$4,${VL_RANGE},3,0)`;
    }).join("+");
    const costResult = (effort.allocation[ai] ?? []).reduce((sum, pct, ri) =>
      sum + pct * calDays * RESOURCE_DAILY_COSTS[ri], 0);
    ws.getCell(aRow, COL_COST).value = { formula: costParts, result: costResult };
    sc(ws.getCell(aRow, COL_COST), { size: 10, ha: "right", fmt: MONEY_FMT });
  });

  // ── ROW 19: "Resource Effort Total" header ──
  // This row ALSO holds col S total (effort breakdown sum) — matching the target image
  ws.getRow(EFFORT_TOTAL_ROW).height = 22;

  merge(EFFORT_TOTAL_ROW, COL_ACT_START, EFFORT_TOTAL_ROW, COL_ACT_END);
  sc(ws.getCell(EFFORT_TOTAL_ROW, COL_ACT_START), {
    v: "Resource Effort Total  (in days per resource)",
    bold: true, size: 9, color: WHITE, bg: BLUE_BG, ha: "center",
  });
  sc(ws.getCell(EFFORT_TOTAL_ROW, COL_WEEKS),   { v: "", bg: BLUE_BG });
  sc(ws.getCell(EFFORT_TOTAL_ROW, COL_CALDAYS), { v: "", bg: BLUE_BG });

  for (let ri = 0; ri < NUM_RESOURCES; ri++) {
    sc(ws.getCell(EFFORT_TOTAL_ROW, COL_RES_START + ri), {
      v: RES_HEADERS[ri], bold: true, size: 8, color: WHITE, bg: BLUE_BG, ha: "center", wrap: true,
    });
  }

  // ── Col S row 19: SUM of effort breakdown column for all activity rows ──
  // This is what shows "156" in the target image — it sits IN the header row
  const breakdownTotalFormula = `SUM(${colLetter(COL_BREAKDOWN)}${ACTIVITY_ROWS[0]}:${colLetter(COL_BREAKDOWN)}${ACTIVITY_ROWS[NUM_ACTIVITIES - 1]})`;
  const breakdownTotalVal = ACTIVITY_NAMES.reduce((sum, _, ai) =>
    sum + (effort.allocation[ai] ?? []).reduce((s, pct) =>
      s + pct * (effort.activities[ai]?.calDays ?? 0), 0), 0);
  ws.getCell(EFFORT_TOTAL_ROW, COL_BREAKDOWN).value = { formula: breakdownTotalFormula, result: breakdownTotalVal };
  sc(ws.getCell(EFFORT_TOTAL_ROW, COL_BREAKDOWN), {
    size: 10, ha: "right", fmt: NUM_FMT, bold: true, color: WHITE, bg: RED_BG,
  });

  // Col U/V row 19: show totals of price/cost columns (matching image: 148,992 / 138,562)
  const priceTotalRow19Formula = `SUM(${colLetter(COL_PRICE)}${ACTIVITY_ROWS[0]}:${colLetter(COL_PRICE)}${ACTIVITY_ROWS[NUM_ACTIVITIES - 1]})`;
  const priceTotalRow19Val = ACTIVITY_NAMES.reduce((sum, _, ai) =>
    sum + (effort.allocation[ai] ?? []).reduce((s, pct, ri) =>
      s + pct * (effort.activities[ai]?.calDays ?? 0) * (RESOURCE_DAILY_COSTS[ri] / (1 - effort.margin)), 0), 0);
  ws.getCell(EFFORT_TOTAL_ROW, COL_PRICE).value = { formula: priceTotalRow19Formula, result: priceTotalRow19Val };
  sc(ws.getCell(EFFORT_TOTAL_ROW, COL_PRICE), { size: 10, ha: "right", fmt: MONEY_FMT, bold: true, color: WHITE, bg: BLUE_BG });

  const costTotalRow19Formula = `SUM(${colLetter(COL_COST)}${ACTIVITY_ROWS[0]}:${colLetter(COL_COST)}${ACTIVITY_ROWS[NUM_ACTIVITIES - 1]})`;
  const costTotalRow19Val = ACTIVITY_NAMES.reduce((sum, _, ai) =>
    sum + (effort.allocation[ai] ?? []).reduce((s, pct, ri) =>
      s + pct * (effort.activities[ai]?.calDays ?? 0) * RESOURCE_DAILY_COSTS[ri], 0), 0);
  ws.getCell(EFFORT_TOTAL_ROW, COL_COST).value = { formula: costTotalRow19Formula, result: costTotalRow19Val };
  sc(ws.getCell(EFFORT_TOTAL_ROW, COL_COST), { size: 10, ha: "right", fmt: MONEY_FMT, bold: true, color: WHITE, bg: BLUE_BG });

  // ── ROW 20: Resource Effort Total values (days per resource column) ──
  ws.getRow(VALUES_ROW).height = 18;
  merge(VALUES_ROW, COL_ACT_START, VALUES_ROW, COL_ACT_END);
  sc(ws.getCell(VALUES_ROW, COL_ACT_START), { v: "", bg: WHITE });
  sc(ws.getCell(VALUES_ROW, COL_WEEKS),     { v: "" });
  sc(ws.getCell(VALUES_ROW, COL_CALDAYS),   { v: "" });

  for (let ri = 0; ri < NUM_RESOURCES; ri++) {
    const parts = ACTIVITY_ROWS.map((aRow) =>
      `${colLetter(COL_RES_START + ri)}${aRow}*${colLetter(COL_CALDAYS)}${aRow}`
    ).join("+");
    const totalVal = ACTIVITY_NAMES.reduce((sum, _, ai) =>
      sum + (effort.allocation[ai]?.[ri] ?? 0) * (effort.activities[ai]?.calDays ?? 0), 0);
    const cell = ws.getCell(VALUES_ROW, COL_RES_START + ri);
    cell.value = { formula: parts, result: totalVal };
    sc(cell, { size: 10, ha: "center", fmt: NUM_FMT });
  }

  // Col S row 20: empty (the total is now on row 19)
  ws.getCell(VALUES_ROW, COL_BREAKDOWN).value = "";
  // Col U/V row 20: empty
  ws.getCell(VALUES_ROW, COL_PRICE).value = "";
  ws.getCell(VALUES_ROW, COL_COST).value  = "";

  // ── ROW 21: Cost per resource ──
  // Each resource col: =VLOOKUP(header, VL_RANGE, 3, 0) * effort_total_days(row 20)
  // Col S: =SUM(H21:R21)  ← sum of all resource cost cells on THIS row
  ws.getRow(COST_ROW).height = 18;
  merge(COST_ROW, COL_ACT_START, COST_ROW, COL_CALDAYS);
  sc(ws.getCell(COST_ROW, COL_ACT_START), { v: "Cost", bold: true, size: 10, ha: "right", va: "middle" });

  for (let ri = 0; ri < NUM_RESOURCES; ri++) {
    const effortRef = `${colLetter(COL_RES_START + ri)}${VALUES_ROW}`;
    const headerRef = `$${colLetter(COL_RES_START + ri)}$4`;
    const costFormula = `${effortRef}*VLOOKUP(${headerRef},${VL_RANGE},3,0)`;
    const costVal = ACTIVITY_NAMES.reduce((s, _, ai) =>
      s + (effort.allocation[ai]?.[ri] ?? 0) * (effort.activities[ai]?.calDays ?? 0), 0)
      * RESOURCE_DAILY_COSTS[ri];

    const cell = ws.getCell(COST_ROW, COL_RES_START + ri);
    if (costVal === 0) {
      cell.value = "-";
      sc(cell, { size: 10, ha: "center" });
    } else {
      cell.value = { formula: costFormula, result: costVal };
      sc(cell, { size: 10, ha: "center", fmt: MONEY_FMT });
    }
  }

  // ── Col S row 21: =SUM(H21:R21) — sum of all resource cost cells on this row ──
  const costSumFormula  = `SUM(${colLetter(COL_RES_START)}${COST_ROW}:${colLetter(COL_RES_END)}${COST_ROW})`;
  const costSumVal = ACTIVITY_NAMES.reduce((sum, _, ai) =>
    sum + (effort.allocation[ai] ?? []).reduce((s, pct, ri) =>
      s + pct * (effort.activities[ai]?.calDays ?? 0) * RESOURCE_DAILY_COSTS[ri], 0), 0);
  ws.getCell(COST_ROW, COL_BREAKDOWN).value = { formula: costSumFormula, result: costSumVal };
  sc(ws.getCell(COST_ROW, COL_BREAKDOWN), { size: 10, ha: "right", fmt: MONEY_FMT, bold: true });

  // ── ROW 22: Price per resource ──
  // Each resource col: =VLOOKUP(header, VL_RANGE, 2, 0) * effort_total_days(row 20)
  // Col S: =SUM(H22:R22)
  ws.getRow(PRICE_ROW).height = 18;
  merge(PRICE_ROW, COL_ACT_START, PRICE_ROW, COL_CALDAYS);
  sc(ws.getCell(PRICE_ROW, COL_ACT_START), { v: "Price", bold: true, size: 10, ha: "right", va: "middle" });

  for (let ri = 0; ri < NUM_RESOURCES; ri++) {
    const effortRef = `${colLetter(COL_RES_START + ri)}${VALUES_ROW}`;
    const headerRef = `$${colLetter(COL_RES_START + ri)}$4`;
    const priceFormula = `${effortRef}*VLOOKUP(${headerRef},${VL_RANGE},2,0)`;
    const priceVal = ACTIVITY_NAMES.reduce((s, _, ai) =>
      s + (effort.allocation[ai]?.[ri] ?? 0) * (effort.activities[ai]?.calDays ?? 0), 0)
      * (RESOURCE_DAILY_COSTS[ri] / (1 - effort.margin));

    const cell = ws.getCell(PRICE_ROW, COL_RES_START + ri);
    if (priceVal === 0) {
      cell.value = "-";
      sc(cell, { size: 10, ha: "center" });
    } else {
      cell.value = { formula: priceFormula, result: priceVal };
      sc(cell, { size: 10, ha: "center", fmt: MONEY_FMT });
    }
  }

  // ── Col S row 22: =SUM(H22:R22) — sum of all resource price cells on this row ──
  const priceSumFormula = `SUM(${colLetter(COL_RES_START)}${PRICE_ROW}:${colLetter(COL_RES_END)}${PRICE_ROW})`;
  const priceSumVal = ACTIVITY_NAMES.reduce((sum, _, ai) =>
    sum + (effort.allocation[ai] ?? []).reduce((s, pct, ri) =>
      s + pct * (effort.activities[ai]?.calDays ?? 0) * (RESOURCE_DAILY_COSTS[ri] / (1 - effort.margin)), 0), 0);
  ws.getCell(PRICE_ROW, COL_BREAKDOWN).value = { formula: priceSumFormula, result: priceSumVal };
  sc(ws.getCell(PRICE_ROW, COL_BREAKDOWN), { size: 10, ha: "right", fmt: MONEY_FMT, bold: true });

  // ── ROW 23: Travel % ──
  ws.getRow(TRAVEL_ROW).height = 18;
  merge(TRAVEL_ROW, COL_ACT_START, TRAVEL_ROW, COL_CALDAYS);
  sc(ws.getCell(TRAVEL_ROW, COL_ACT_START), { v: "Travel %", bold: true, size: 10, ha: "right", va: "middle" });

  // Travel % input in each resource cell (yellow, same value)
  for (let ri = 0; ri < NUM_RESOURCES; ri++) {
    const cell = ws.getCell(TRAVEL_ROW, COL_RES_START + ri);
    if (ri === 0) {
      // First cell: actual input
      sc(cell, { v: effort.travelPercent, size: 10, ha: "center", bg: YELLOW, fmt: PCT_FMT });
    } else {
      // Rest reference the first cell
      const firstTravelRef = `$${colLetter(COL_RES_START)}$${TRAVEL_ROW}`;
      cell.value = { formula: firstTravelRef, result: effort.travelPercent };
      sc(cell, { size: 10, ha: "center", bg: YELLOW, fmt: PCT_FMT });
    }
  }

  const travelRef = `$${colLetter(COL_RES_START)}$${TRAVEL_ROW}`;

  // Col S row 23: travel amount = Price total * Travel%
  const travelTotalVal = priceSumVal * effort.travelPercent;
  ws.getCell(TRAVEL_ROW, COL_BREAKDOWN).value = {
    formula: `${colLetter(COL_BREAKDOWN)}${PRICE_ROW}*${travelRef}`,
    result: travelTotalVal,
  };
  sc(ws.getCell(TRAVEL_ROW, COL_BREAKDOWN), { size: 10, ha: "right", fmt: MONEY_FMT });

  // ── ROW 24: Price incl. Travel ──
  ws.getRow(PRICE_TRAVEL_ROW).height = 18;
  merge(PRICE_TRAVEL_ROW, COL_ACT_START, PRICE_TRAVEL_ROW, COL_CALDAYS);
  sc(ws.getCell(PRICE_TRAVEL_ROW, COL_ACT_START), { v: "Price incl. Trav.", bold: true, size: 10, ha: "right", va: "middle" });

  for (let ri = 0; ri < NUM_RESOURCES; ri++) {
    const priceCell = `${colLetter(COL_RES_START + ri)}${PRICE_ROW}`;
    const priceInclFormula = `${priceCell}*(1+${travelRef})`;
    const priceVal = ACTIVITY_NAMES.reduce((s, _, ai) =>
      s + (effort.allocation[ai]?.[ri] ?? 0) * (effort.activities[ai]?.calDays ?? 0), 0)
      * (RESOURCE_DAILY_COSTS[ri] / (1 - effort.margin));
    const priceInclVal = priceVal * (1 + effort.travelPercent);

    const cell = ws.getCell(PRICE_TRAVEL_ROW, COL_RES_START + ri);
    if (priceInclVal === 0) {
      cell.value = "-";
      sc(cell, { size: 10, ha: "center" });
    } else {
      cell.value = { formula: priceInclFormula, result: priceInclVal };
      sc(cell, { size: 10, ha: "center", fmt: MONEY_FMT });
    }
  }

  // Col S row 24: Price incl. Travel total = Price_total * (1 + Travel%)
  const priceInclTotalVal = priceSumVal * (1 + effort.travelPercent);
  ws.getCell(PRICE_TRAVEL_ROW, COL_BREAKDOWN).value = {
    formula: `${colLetter(COL_BREAKDOWN)}${PRICE_ROW}*(1+${travelRef})`,
    result: priceInclTotalVal,
  };
  sc(ws.getCell(PRICE_TRAVEL_ROW, COL_BREAKDOWN), {
    size: 10, ha: "right", fmt: MONEY_FMT, bold: true, color: RED_BG,
  });

  // ── Freeze panes ──
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 4 }];

  // ── Footer note ──
  const noteRow = PRICE_TRAVEL_ROW + 2;
  ws.mergeCells(noteRow, 1, noteRow, COL_COST);
  sc(ws.getCell(noteRow, 1), {
    v: "Yellow cells are editable inputs. All other calculated cells update automatically when inputs change.",
    size: 9, italic: true, color: "64748B", ha: "left", border: false,
  });
}