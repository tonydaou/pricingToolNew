import ExcelJS from "exceljs";
import {
  ClientQuoteData,
  generateClientQuoteSummary,
  getCurrencyByCode,
} from "./clientQuotePDF";

// Brand colors
const BRAND_PRIMARY = "1E3A5F";
const BRAND_LIGHT = "E8F0F8";
const BRAND_ACCENT = "2563EB";
const WHITE = "FFFFFF";
const GRAY_LIGHT = "F8FAFC";
const GRAY_BORDER = "E2E8F0";

export const generateClientQuoteExcel = async (
  data: ClientQuoteData
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

  const MONEY_FORMAT = "#,##0.00";
  const PERCENT_FORMAT = "0.00%";

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

  // Header
  summarySheet.mergeCells("A1:C1");
  const headerCell = summarySheet.getCell("A1");
  headerCell.value = "CLIENT QUOTE";
  headerCell.font = { bold: true, size: 20, color: { argb: WHITE } };
  headerCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_PRIMARY },
  };
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
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_ACCENT },
    };
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
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: BRAND_LIGHT },
      };
      cell.border = {
        bottom: { style: "medium", color: { argb: BRAND_PRIMARY } },
      };
      cell.alignment = {
        horizontal: index >= 1 ? "right" : "left",
        vertical: "middle",
      };
    });

    summarySheet.getRow(currentRow).height = 24;
    currentRow++;
    return currentRow - 1;
  };

  type CellValueInput =
    | string
    | number
    | {
        formula: string;
        result: number;
        kind?: "money" | "percent" | "number";
      };

  const addDataRow = (
    values: CellValueInput[],
    isAlternate = false,
    isBold = false
  ) => {
    const rowNumber = currentRow;
    const row = summarySheet.getRow(currentRow);

    values.forEach((value, index) => {
      const cell = row.getCell(index + 1);

      if (typeof value === "object" && value !== null && "formula" in value) {
        cell.value = {
          formula: value.formula,
          result: value.result,
        };

        if (value.kind === "percent") {
          setPercentCell(cell);
        } else if (value.kind === "number") {
          cell.alignment = { horizontal: "right", vertical: "middle" };
        } else {
          setMoneyCell(cell);
        }
      } else if (typeof value === "number") {
        cell.value = value;

        if (index >= 1) {
          setMoneyCell(cell);
        } else {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }
      } else {
        cell.value = value;
        cell.alignment = {
          horizontal: index >= 1 ? "right" : "left",
          vertical: "middle",
        };
      }

      cell.font = { bold: isBold, size: 11 };

      if (isAlternate) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: GRAY_LIGHT },
        };
      }

      cell.border = {
        bottom: { style: "thin", color: { argb: GRAY_BORDER } },
      };
    });

    currentRow++;
    return rowNumber;
  };

  // Quote info
  addInfoRow("Quote Name:", data.quoteName);
  addInfoRow(
    "Date:",
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );
  addInfoRow("Client:", data.clientName);
  addInfoRow("Main Asset:", data.mainAsset);
  addInfoRow(
    "Commitment Period:",
    `${data.commitmentYears} Year${data.commitmentYears > 1 ? "s" : ""}`
  );
  addInfoRow("Currency:", currencyLabel);

  currentRow++;

  // =========================================================
  // SELECTED MODULES
  // =========================================================
  addSectionHeader("SELECTED MODULES");
  addTableHeader([
    "Module",
    `Yearly Price (${currencyInfo.code})`,
    `Total Commitment Price (${currencyInfo.code})`,
  ]);

  const hasSustainability = data.lineItems.some(
    (item) =>
      item.sustainability ||
      (item.subLineItems &&
        item.subLineItems.some((sub) => sub.sustainability))
  );

  const hasSecurity = data.lineItems.some(
    (item) =>
      item.security ||
      (item.subLineItems && item.subLineItems.some((sub) => sub.security))
  );

  const hasMobility = data.lineItems.some(
    (item) =>
      item.mobility ||
      (item.subLineItems && item.subLineItems.some((sub) => sub.mobility))
  );

  const hasInsight = data.lineItems.some(
    (item) =>
      item.insight ||
      (item.subLineItems && item.subLineItems.some((sub) => sub.insight))
  );

  addDataRow([
    "Sustainability",
    hasSustainability ? "Included" : "Not included",
    hasSustainability ? "Included in subscription" : "-",
  ]);
  addDataRow(
    [
      "Security",
      hasSecurity ? "Included" : "Not included",
      hasSecurity ? "Included in subscription" : "-",
    ],
    true
  );
  addDataRow([
    "Mobility",
    hasMobility ? "Included" : "Not included",
    hasMobility ? "Included in subscription" : "-",
  ]);
  addDataRow(
    [
      "Insight",
      hasInsight ? "Included" : "Not included",
      hasInsight ? "Included in subscription" : "-",
    ],
    true
  );
  addDataRow(["Support Plan", "Included", "Included in subscription"]);

  currentRow++;

  // =========================================================
  // ANNUAL PLATFORM FEE
  // =========================================================
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
    {
      formula: `B${currentRow}*${data.commitmentYears}`,
      result: totalPlatform,
      kind: "money",
    },
  ]);

  summarySheet.getCell(`C${platformAnnualRow}`).value = {
    formula: `B${platformAnnualRow}*${data.commitmentYears}`,
    result: totalPlatform,
  };
  setMoneyCell(summarySheet.getCell(`C${platformAnnualRow}`));

  currentRow++;

  // =========================================================
  // QUOTE SUMMARY
  // =========================================================
  addSectionHeader("QUOTE SUMMARY");

  const discountRow = addDataRow(
    ["Discount (%)", summary.discountPercent / 100, ""],
    false,
    false
  );
  setPercentCell(summarySheet.getCell(`B${discountRow}`));

  currentRow++;

  const yearlySubscriptionRaw =
    summary.yearOneSubscription - summary.yearlyPlatformFee;
  const totalSubscriptionRaw = yearlySubscriptionRaw * data.commitmentYears;
  const totalBeforeDiscountRaw = totalPlatformRaw + totalSubscriptionRaw;
  const discountAmountRaw =
    totalBeforeDiscountRaw * (summary.discountPercent / 100);
  const finalTotalRaw = totalBeforeDiscountRaw - discountAmountRaw;

  const yearlySubscription = toNumericCurrency(yearlySubscriptionRaw);
  const totalSubscription = toNumericCurrency(totalSubscriptionRaw);
  const totalBeforeDiscountPerYear = toNumericCurrency(
    totalBeforeDiscountRaw / data.commitmentYears
  );
  const totalBeforeDiscount = toNumericCurrency(totalBeforeDiscountRaw);
  const discountAmount = toNumericCurrency(discountAmountRaw);
  const finalTotal = toNumericCurrency(finalTotalRaw);
  const yearlyEquivalent = toNumericCurrency(
    finalTotalRaw / data.commitmentYears
  );

  const platformSummaryRow = addDataRow([
    `Platform Fee (${data.commitmentYears} Year${
      data.commitmentYears > 1 ? "s" : ""
    })`,
    yearlyPlatform,
    {
      formula: `B${platformSummaryRowPlaceholder()}*${data.commitmentYears}`,
      result: totalPlatform,
      kind: "money",
    },
  ]);

  function platformSummaryRowPlaceholder() {
    return currentRow;
  }

  summarySheet.getCell(`C${platformSummaryRow}`).value = {
    formula: `B${platformSummaryRow}*${data.commitmentYears}`,
    result: totalPlatform,
  };
  setMoneyCell(summarySheet.getCell(`C${platformSummaryRow}`));

  const subscriptionSummaryRow = addDataRow(
    [
      `Subscription Total (${data.commitmentYears} Year${
        data.commitmentYears > 1 ? "s" : ""
      })`,
      yearlySubscription,
      {
        formula: `B${subscriptionSummaryRowPlaceholder()}*${data.commitmentYears}`,
        result: totalSubscription,
        kind: "money",
      },
    ],
    true
  );

  function subscriptionSummaryRowPlaceholder() {
    return currentRow;
  }

  summarySheet.getCell(`C${subscriptionSummaryRow}`).value = {
    formula: `B${subscriptionSummaryRow}*${data.commitmentYears}`,
    result: totalSubscription,
  };
  setMoneyCell(summarySheet.getCell(`C${subscriptionSummaryRow}`));

  const totalPriceRow = addDataRow(
    [
      "Total Price",
      {
        formula: `B${platformSummaryRow}+B${subscriptionSummaryRow}`,
        result: totalBeforeDiscountPerYear,
        kind: "money",
      },
      {
        formula: `C${platformSummaryRow}+C${subscriptionSummaryRow}`,
        result: totalBeforeDiscount,
        kind: "money",
      },
    ],
    false,
    true
  );

  const commitmentDiscountRow = addDataRow(
    [
      "Commitment Discount",
      {
        formula: `B${totalPriceRow}*B${discountRow}`,
        result: toNumericCurrency(
          (totalBeforeDiscountRaw / data.commitmentYears) *
            (summary.discountPercent / 100)
        ),
        kind: "money",
      },
      {
        formula: `C${totalPriceRow}*B${discountRow}`,
        result: discountAmount,
        kind: "money",
      },
    ],
    true
  );

  currentRow++;

  // Grand total
  const grandTotalRow = currentRow;

  summarySheet.mergeCells(`A${grandTotalRow}:B${grandTotalRow}`);
  const grandTotalLabelCell = summarySheet.getCell(`A${grandTotalRow}`);
  grandTotalLabelCell.value = "EQUIVALENT AFTER DISCOUNT";
  grandTotalLabelCell.font = { bold: true, size: 14, color: { argb: WHITE } };
  grandTotalLabelCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_PRIMARY },
  };
  grandTotalLabelCell.alignment = { horizontal: "left", vertical: "middle" };

  const grandTotalValueCell = summarySheet.getCell(`C${grandTotalRow}`);
  grandTotalValueCell.value = {
    formula: `C${totalPriceRow}-C${commitmentDiscountRow}`,
    result: finalTotal,
  };
  setMoneyCell(grandTotalValueCell);
  grandTotalValueCell.font = { bold: true, size: 14, color: { argb: WHITE } };
  grandTotalValueCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_PRIMARY },
  };
  summarySheet.getRow(grandTotalRow).height = 32;

  currentRow++;

  addDataRow(
    [
      "Yearly Equivalent",
      {
        formula: `C${grandTotalRow}/${data.commitmentYears}`,
        result: yearlyEquivalent,
        kind: "money",
      },
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
    { width: 25 },
    { width: 20 },
    { width: 28 },
    { width: 12 },
    { width: 10 },
    { width: 14 },
    { width: 10 },
    { width: 16 },
    { width: 10 },
    { width: 16 },
    { width: 10 },
    { width: 12 },
  ];

  lineItemsSheet.mergeCells("A1:L1");
  const lineItemsHeader = lineItemsSheet.getCell("A1");
  lineItemsHeader.value = "LINE ITEMS DETAIL";
  lineItemsHeader.font = { bold: true, size: 20, color: { argb: WHITE } };
  lineItemsHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_PRIMARY },
  };
  lineItemsHeader.alignment = { horizontal: "center", vertical: "middle" };
  lineItemsSheet.getRow(1).height = 40;

  const headers = [
    "Line Item",
    "Asset Type",
    "Description",
    "Size (sqm)",
    "Quantity",
    "Sustainability",
    "Security",
    "Sec. Channels",
    "Mobility",
    "Mob. Channels",
    "Insight",
    "Support",
  ];

  const headerRow = lineItemsSheet.getRow(3);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_ACCENT },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "medium", color: { argb: BRAND_PRIMARY } },
    };
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

      if (isAlternate) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: GRAY_LIGHT },
        };
      }

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

          if (isSubAlternate) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F0F4F8" },
            };
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

  const buffer = await workbook.xlsx.writeBuffer();

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};