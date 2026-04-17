// Complete fixed Effort Estimation implementation
if (effortEstimation) {
  console.log('Creating Effort Estimation sheet...');
  
  const effortSheet = workbook.addWorksheet("Effort Estimation");
  
  // Define activities and resources
  const activities = [
    { key: "partnerInCharge", name: "Partner in charge" },
    { key: "techLead", name: "Tech Lead" },
    { key: "requirementDesignPlan", name: "Requirement / Design / Plan" },
    { key: "developmentIntegration", name: "Development & Integration" },
    { key: "compliance", name: "Compliance - Infrastructure, Cyber Security, and Data" },
    { key: "qaDocumentation", name: "QA & Documentation" },
  ];

  const resources = [
    "Partner", "PM", "Analyst", "3D Modeler", "Data Eng. 1", "Data Eng. 2", "ML Eng.", "Developer 1", "Developer 2", "Tech Lead"
  ];

  const roleCostsData = [
    { name: "Partner", cost: effortEstimation.roleCosts.partner },
    { name: "PM", cost: effortEstimation.roleCosts.pm },
    { name: "Analyst", cost: effortEstimation.roleCosts.analyst },
    { name: "3D Modeler", cost: effortEstimation.roleCosts.modeler3D },
    { name: "Data Eng. 1", cost: effortEstimation.roleCosts.dataEngineer },
    { name: "Data Eng. 2", cost: effortEstimation.roleCosts.dataEngineer },
    { name: "ML Eng.", cost: effortEstimation.roleCosts.mlEngineer },
    { name: "Developer 1", cost: effortEstimation.roleCosts.developer },
    { name: "Developer 2", cost: effortEstimation.roleCosts.developer },
    { name: "Tech Lead", cost: effortEstimation.roleCosts.techLead },
  ];

  // Set column widths
  effortSheet.columns = [
    { width: 30 }, // A - Activity
    { width: 10 }, // B - Weeks
    { width: 10 }, // C - Cal Days
    { width: 3 },  // D - Spacer
    { width: 12 }, // E - Partner
    { width: 10 }, // F - PM
    { width: 12 }, // G - Analyst
    { width: 12 }, // H - 3D Modeler
    { width: 12 }, // I - Data Eng 1
    { width: 12 }, // J - Data Eng 2
    { width: 10 }, // K - ML Eng
    { width: 12 }, // L - Developer 1
    { width: 12 }, // M - Developer 2
    { width: 12 }, // N - Tech Lead
    { width: 3 },  // O - Spacer
    { width: 15 }, // P - Cost
    { width: 10 }, // Q - Margin
    { width: 12 }, // R - Rate
  ];

  let currentRow = 1;

  // Main header
  effortSheet.mergeCells("A1:R1");
  const mainHeaderCell = effortSheet.getCell("A1");
  mainHeaderCell.value = "EFFORT ESTIMATION";
  mainHeaderCell.font = { bold: true, size: 16, color: { argb: BRAND_PRIMARY } };
  mainHeaderCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_PRIMARY },
  };
  mainHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
  effortSheet.getRow(1).height = 30;

  currentRow = 3;

  // =========================================================
  // SECTION 1: LEFT - Activity Table
  // =========================================================
  effortSheet.getCell("A" + currentRow).value = "Activity";
  effortSheet.getCell("B" + currentRow).value = "Weeks";
  effortSheet.getCell("C" + currentRow).value = "Cal Days";
  
  ["A", "B", "C"].forEach(col => {
    const cell = effortSheet.getCell(col + currentRow);
    cell.font = { bold: true, color: { argb: BRAND_PRIMARY } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_LIGHT } };
    cell.border = { bottom: { style: "medium", color: { argb: BRAND_PRIMARY } } };
    cell.alignment = { horizontal: col === "A" ? "left" : "center", vertical: "middle" };
  });
  
  currentRow++;

  // Activity data rows
  activities.forEach((activity, index) => {
    const row = currentRow + index;
    const calDaysCell = "C" + row;
    const weeksCell = "B" + row;
    const calDaysValue = effortEstimation.activityDurations[activity.key] || 0;
    
    // Activity name
    effortSheet.getCell("A" + row).value = activity.name;
    effortSheet.getCell("A" + row).font = { size: 10 };
    effortSheet.getCell("A" + row).alignment = { horizontal: "left", vertical: "middle" };
    
    // Weeks (formula)
    effortSheet.getCell(weeksCell).value = {
      formula: `${calDaysCell}/5`,
      result: calDaysValue / 5
    };
    effortSheet.getCell(weeksCell).numFmt = "#,##0.0";
    effortSheet.getCell(weeksCell).font = { size: 10 };
    effortSheet.getCell(weeksCell).alignment = { horizontal: "right", vertical: "middle" };
    
    // Cal Days (editable)
    effortSheet.getCell(calDaysCell).value = calDaysValue;
    effortSheet.getCell(calDaysCell).numFmt = "#,##0";
    effortSheet.getCell(calDaysCell).font = { size: 10 };
    effortSheet.getCell(calDaysCell).alignment = { horizontal: "right", vertical: "middle" };
  });

  currentRow += activities.length + 2;

  // =========================================================
  // SECTION 2: CENTER - Resource Allocation Table
  // =========================================================
  effortSheet.getCell("E" + currentRow).value = "Resource Allocation (% per track)";
  effortSheet.getCell("E" + currentRow).font = { bold: true, size: 12, color: { argb: WHITE } };
  effortSheet.getCell("E" + currentRow).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_ACCENT },
  };
  effortSheet.getCell("E" + currentRow).alignment = { horizontal: "left", vertical: "middle" };
  effortSheet.getRow(currentRow).height = 25;

  currentRow++;

  // Resource allocation headers
  resources.forEach((resource, index) => {
    const cell = effortSheet.getCell(String.fromCharCode(69 + index) + currentRow); // E, F, G, H, I, J, K, L, M, N
    cell.value = resource;
    cell.font = { bold: true, color: { argb: BRAND_PRIMARY } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_LIGHT } };
    cell.border = { bottom: { style: "medium", color: { argb: BRAND_PRIMARY } } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  currentRow++;

  // Resource allocation data rows
  activities.forEach((activity, activityIndex) => {
    const row = currentRow + activityIndex;
    
    // Activity name (left aligned)
    effortSheet.getCell("A" + row).value = activity.name;
    effortSheet.getCell("A" + row).font = { size: 10 };
    effortSheet.getCell("A" + row).alignment = { horizontal: "left", vertical: "middle" };
    
    // Resource allocation percentages (editable)
    resources.forEach((resource, resourceIndex) => {
      const cell = effortSheet.getCell(String.fromCharCode(69 + resourceIndex) + row);
      let allocationValue = 0;
      
      // Map resource names to actual state keys
      if (resourceIndex === 0) allocationValue = effortEstimation.resourceAllocation[activity.key]?.partner || 0;
      else if (resourceIndex === 1) allocationValue = effortEstimation.resourceAllocation[activity.key]?.pm || 0;
      else if (resourceIndex === 2) allocationValue = effortEstimation.resourceAllocation[activity.key]?.analyst || 0;
      else if (resourceIndex === 3) allocationValue = effortEstimation.resourceAllocation[activity.key]?.modeler3D || 0;
      else if (resourceIndex === 4) allocationValue = effortEstimation.resourceAllocation[activity.key]?.dataEngineer || 0;
      else if (resourceIndex === 5) allocationValue = effortEstimation.resourceAllocation[activity.key]?.dataEngineer2 || 0;
      else if (resourceIndex === 6) allocationValue = effortEstimation.resourceAllocation[activity.key]?.mlEngineer || 0;
      else if (resourceIndex === 7) allocationValue = effortEstimation.resourceAllocation[activity.key]?.developer || 0;
      else if (resourceIndex === 8) allocationValue = effortEstimation.resourceAllocation[activity.key]?.developer2 || 0;
      else if (resourceIndex === 9) allocationValue = effortEstimation.resourceAllocation[activity.key]?.techLead || 0;
      
      cell.value = allocationValue;
      cell.numFmt = "0%";
      cell.font = { size: 10 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
  });

  currentRow += activities.length + 2;

  // =========================================================
  // SECTION 3: RIGHT - Effort Breakdown
  // =========================================================
  effortSheet.getCell("E" + currentRow).value = "Effort Breakdown per activity";
  effortSheet.getCell("E" + currentRow).font = { bold: true, size: 12, color: { argb: WHITE } };
  effortSheet.getCell("E" + currentRow).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_ACCENT },
  };
  effortSheet.getCell("E" + currentRow).alignment = { horizontal: "left", vertical: "middle" };
  effortSheet.getRow(currentRow).height = 25;

  currentRow++;

  // Effort breakdown headers
  resources.forEach((resource, index) => {
    const cell = effortSheet.getCell(String.fromCharCode(69 + index) + currentRow);
    cell.value = resource;
    cell.font = { bold: true, color: { argb: BRAND_PRIMARY } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_LIGHT } };
    cell.border = { bottom: { style: "medium", color: { argb: BRAND_PRIMARY } } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  currentRow++;

  // Effort breakdown data rows
  activities.forEach((activity, activityIndex) => {
    const row = currentRow + activityIndex;
    const calDaysCell = "C" + (row - activities.length - 1 + activityIndex);
    
    // Activity name
    effortSheet.getCell("A" + row).value = activity.name;
    effortSheet.getCell("A" + row).font = { size: 10 };
    effortSheet.getCell("A" + row).alignment = { horizontal: "left", vertical: "middle" };
    
    // Calculate effort breakdown for each resource
    resources.forEach((resource, resourceIndex) => {
      const cell = effortSheet.getCell(String.fromCharCode(69 + resourceIndex) + row);
      const allocationCell = String.fromCharCode(69 + resourceIndex) + (row - activities.length - 1 + activityIndex);
      
      cell.value = {
        formula: `${allocationCell}*${calDaysCell}`,
        result: 0 // Will be calculated
      };
      cell.numFmt = "#,##0.0";
      cell.font = { size: 10 };
      cell.alignment = { horizontal: "right", vertical: "middle" };
    });
  });

  currentRow += activities.length + 2;

  // =========================================================
  // SECTION 4: BOTTOM - Totals and Calculations
  // =========================================================
  
  // A. Resource Effort Total
  effortSheet.getCell("E" + currentRow).value = "Resource Effort Total (in days per resource)";
  effortSheet.getCell("E" + currentRow).font = { bold: true, size: 12, color: { argb: WHITE } };
  effortSheet.getCell("E" + currentRow).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_ACCENT },
  };
  effortSheet.getCell("E" + currentRow).alignment = { horizontal: "left", vertical: "middle" };
  effortSheet.getRow(currentRow).height = 25;

  currentRow++;

  // Resource effort total headers
  resources.forEach((resource, index) => {
    const cell = effortSheet.getCell(String.fromCharCode(69 + index) + currentRow);
    cell.value = resource;
    cell.font = { bold: true, color: { argb: BRAND_PRIMARY } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_LIGHT } };
    cell.border = { bottom: { style: "medium", color: { argb: BRAND_PRIMARY } } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  currentRow++;

  // Resource effort total calculations
  resources.forEach((resource, resourceIndex) => {
    const cell = effortSheet.getCell(String.fromCharCode(69 + resourceIndex) + currentRow);
    
    // Build formula to sum (allocation % × cal days) for each activity
    const effortFormulas = activities.map((activity, activityIndex) => {
      const allocationCell = String.fromCharCode(69 + resourceIndex) + (currentRow - activities.length - 1 + activityIndex);
      const calDaysCell = "C" + (currentRow - activities.length - 1 + activityIndex);
      return `${allocationCell}*${calDaysCell}`;
    });
    
    cell.value = {
      formula: `SUM(${effortFormulas.join(',')})`,
      result: 0 // Will be calculated
    };
    cell.numFmt = "#,##0.0";
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: "right", vertical: "middle" };
  });

  currentRow += 2;

  // B. COST
  effortSheet.getCell("E" + currentRow).value = "Cost";
  effortSheet.getCell("E" + currentRow).font = { bold: true, size: 12, color: { argb: WHITE } };
  effortSheet.getCell("E" + currentRow).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_ACCENT },
  };
  effortSheet.getCell("E" + currentRow).alignment = { horizontal: "left", vertical: "middle" };
  effortSheet.getRow(currentRow).height = 25;

  currentRow++;

  // Global margin input (single cell)
  const globalMarginCell = "Q" + currentRow;
  effortSheet.getCell("P" + currentRow).value = "Global Margin";
  effortSheet.getCell("P" + currentRow).font = { bold: true, size: 10, color: { argb: BRAND_PRIMARY } };
  effortSheet.getCell("P" + currentRow).alignment = { horizontal: "right", vertical: "middle" };
  
  effortSheet.getCell(globalMarginCell).value = effortEstimation.margin / 100;
  effortSheet.getCell(globalMarginCell).numFmt = PERCENT_FORMAT;
  effortSheet.getCell(globalMarginCell).font = { size: 10 };
  effortSheet.getCell(globalMarginCell).alignment = { horizontal: "right", vertical: "middle" };

  currentRow++;

  // Cost calculations for each resource
  resources.forEach((resource, resourceIndex) => {
    const cell = effortSheet.getCell(String.fromCharCode(69 + resourceIndex) + currentRow);
    const effortCell = String.fromCharCode(69 + resourceIndex) + (currentRow - 2);
    const roleCost = roleCostsData.find(r => r.name === resource)?.cost || 0;
    
    cell.value = {
      formula: `${effortCell}*${roleCost}`,
      result: 0 // Will be calculated
    };
    cell.numFmt = MONEY_FORMAT;
    cell.font = { size: 10 };
    cell.alignment = { horizontal: "right", vertical: "middle" };
  });

  currentRow += 2;

  // C. PRICE
  effortSheet.getCell("E" + currentRow).value = "Price";
  effortSheet.getCell("E" + currentRow).font = { bold: true, size: 12, color: { argb: WHITE } };
  effortSheet.getCell("E" + currentRow).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_ACCENT },
  };
  effortSheet.getCell("E" + currentRow).alignment = { horizontal: "left", vertical: "middle" };
  effortSheet.getRow(currentRow).height = 25;

  currentRow++;

  // Price calculations for each resource
  resources.forEach((resource, resourceIndex) => {
    const cell = effortSheet.getCell(String.fromCharCode(69 + resourceIndex) + currentRow);
    const costCell = String.fromCharCode(69 + resourceIndex) + (currentRow - 2);
    
    cell.value = {
      formula: `${costCell}/(1-${globalMarginCell})`,
      result: 0 // Will be calculated
    };
    cell.numFmt = MONEY_FORMAT;
    cell.font = { size: 10 };
    cell.alignment = { horizontal: "right", vertical: "middle" };
  });

  currentRow += 2;

  // D. TRAVEL %
  effortSheet.getCell("E" + currentRow).value = "Travel %";
  effortSheet.getCell("E" + currentRow).font = { bold: true, size: 12, color: { argb: WHITE } };
  effortSheet.getCell("E" + currentRow).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_ACCENT },
  };
  effortSheet.getCell("E" + currentRow).alignment = { horizontal: "left", vertical: "middle" };
  effortSheet.getRow(currentRow).height = 25;

  currentRow++;

  // Global travel input (single cell)
  const globalTravelCell = "Q" + currentRow;
  effortSheet.getCell("P" + currentRow).value = "Global Travel";
  effortSheet.getCell("P" + currentRow).font = { bold: true, size: 10, color: { argb: BRAND_PRIMARY } };
  effortSheet.getCell("P" + currentRow).alignment = { horizontal: "right", vertical: "middle" };
  
  effortSheet.getCell(globalTravelCell).value = effortEstimation.travelPercentage / 100;
  effortSheet.getCell(globalTravelCell).numFmt = PERCENT_FORMAT;
  effortSheet.getCell(globalTravelCell).font = { size: 10 };
  effortSheet.getCell(globalTravelCell).alignment = { horizontal: "right", vertical: "middle" };

  currentRow += 2;

  // E. PRICE INCLUDING TRAVEL
  effortSheet.getCell("E" + currentRow).value = "Price incl. Travel";
  effortSheet.getCell("E" + currentRow).font = { bold: true, size: 12, color: { argb: WHITE } };
  effortSheet.getCell("E" + currentRow).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_ACCENT },
  };
  effortSheet.getCell("E" + currentRow).alignment = { horizontal: "left", vertical: "middle" };
  effortSheet.getRow(currentRow).height = 25;

  currentRow++;

  // Price incl. Travel calculations for each resource
  resources.forEach((resource, resourceIndex) => {
    const cell = effortSheet.getCell(String.fromCharCode(69 + resourceIndex) + currentRow);
    const priceCell = String.fromCharCode(69 + resourceIndex) + (currentRow - 2);
    
    cell.value = {
      formula: `${priceCell}*(1+${globalTravelCell})`,
      result: 0 // Will be calculated
    };
    cell.numFmt = MONEY_FORMAT;
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: "right", vertical: "middle" };
  });

  currentRow += 3;

  // =========================================================
  // RATES TABLE (RIGHT SIDE)
  // =========================================================
  effortSheet.getCell("P" + currentRow).value = "Daily Rates";
  effortSheet.getCell("P" + currentRow).font = { bold: true, size: 12, color: { argb: BRAND_PRIMARY } };
  effortSheet.getCell("P" + currentRow).alignment = { horizontal: "center", vertical: "middle" };

  currentRow++;

  // Rates headers
  effortSheet.getCell("P" + currentRow).value = "Type";
  effortSheet.getCell("Q" + currentRow).value = "Cost";
  effortSheet.getCell("R" + currentRow).value = "Margin";
  effortSheet.getCell("S" + currentRow).value = "Rate";
  
  ["P", "Q", "R", "S"].forEach((col, index) => {
    const cell = effortSheet.getCell(col + currentRow);
    cell.font = { bold: true, color: { argb: BRAND_PRIMARY } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_LIGHT } };
    cell.border = { bottom: { style: "medium", color: { argb: BRAND_PRIMARY } } };
    cell.alignment = { horizontal: index === 0 ? "left" : "center", vertical: "middle" };
  });

  currentRow++;

  // Daily rates data
  roleCostsData.forEach((role, index) => {
    const row = currentRow + index;
    const typeCell = "P" + row;
    const costCell = "Q" + row;
    const marginCell = "R" + row;
    const rateCell = "S" + row;
    
    // Type
    effortSheet.getCell(typeCell).value = role.name;
    effortSheet.getCell(typeCell).font = { size: 10 };
    effortSheet.getCell(typeCell).alignment = { horizontal: "left", vertical: "middle" };
    
    // Cost (editable)
    effortSheet.getCell(costCell).value = role.cost;
    effortSheet.getCell(costCell).numFmt = "#,##0";
    effortSheet.getCell(costCell).font = { size: 10 };
    effortSheet.getCell(costCell).alignment = { horizontal: "right", vertical: "middle" };
    
    // Margin (reference to global margin)
    effortSheet.getCell(marginCell).value = {
      formula: globalMarginCell,
      result: effortEstimation.margin / 100
    };
    effortSheet.getCell(marginCell).numFmt = PERCENT_FORMAT;
    effortSheet.getCell(marginCell).font = { size: 10 };
    effortSheet.getCell(marginCell).alignment = { horizontal: "right", vertical: "middle" };
    
    // Rate (formula)
    effortSheet.getCell(rateCell).value = {
      formula: `${costCell}/(1-${marginCell})`,
      result: role.cost / (1 - effortEstimation.margin / 100)
    };
    effortSheet.getCell(rateCell).numFmt = "#,##0";
    effortSheet.getCell(rateCell).font = { bold: true, size: 10 };
    effortSheet.getCell(rateCell).alignment = { horizontal: "right", vertical: "middle" };
  });
  
  console.log('Effort Estimation sheet created successfully');
}
