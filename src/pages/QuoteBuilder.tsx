import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Save, FileText, FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LineItem } from "@/types/pricing";
import { calculateQuoteTotals, defaultPricingRates } from "@/lib/pricingCalculations";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import ClientQuotePDF from "@/components/ClientQuotePDF";
import { ClientQuoteData } from "@/lib/clientQuotePDF";
import {
  generateClientQuoteExcel,
  EffortEstimationData,
  ACTIVITY_NAMES,
  RESOURCE_NAMES,
  defaultEffortEstimation,
} from "@/lib/clientQuoteExcel";
import { getCurrencies, CurrencyCode, getCurrencyByCode, formatCurrencyValue, updateCurrencyRates } from "@/lib/currencies";
import LineItemGroup from "@/components/LineItemGroup";
import { quoteService, Quote } from "@/lib/supabase";

const QuoteBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [quoteName, setQuoteName] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");

  // Effort Estimation state
  const [effortData, setEffortData] = useState<EffortEstimationData>(defaultEffortEstimation());
  const [showEffortSection, setShowEffortSection] = useState(false);

  // Auto-increment quote name
  const getNextQuoteNumber = async () => {
    try {
      const allQuotes = await quoteService.getAllQuotes();
      const currentYear = new Date().getFullYear();

      const currentYearQuotes = allQuotes.filter(quote => {
        if (!quote.created_at) return false;
        const quoteDate = new Date(quote.created_at);
        return quoteDate.getFullYear() === currentYear;
      });

      const existingNumbers = currentYearQuotes
        .map(quote => {
          const match = quote.quote_name.match(/Q-(\d{4})-(\d+)/);
          return match ? parseInt(match[2]) : 0;
        })
        .filter(num => num > 0);

      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

      return `Q-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error("Error getting next quote number:", error);
      return `Q-${new Date().getFullYear()}-0001`;
    }
  };

  useEffect(() => {
    if (!quoteName && !isEditMode) {
      getNextQuoteNumber().then(setQuoteName);
    }
  }, [isEditMode]);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      assetType: "Commercial Building",
      description: "",
      size: 10000,
      sustainability: true,
      security: true,
      securityChannels: 4,
      mobility: true,
      mobilityChannels: 2,
      insight: true,
      supportPlan: "8x5",
      quantity: 1,
    },
  ]);

  const [commitmentYears, setCommitmentYears] = useState<number>(1);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [mainAsset, setMainAsset] = useState<string>("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  useEffect(() => {
    const fetchRates = async () => {
      try {
        await updateCurrencyRates();
      } catch (error) {
        console.error("Failed to update currency rates:", error);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const quoteId = searchParams.get('edit');
    if (quoteId) {
      setIsEditMode(true);
      setEditingQuoteId(quoteId);
      loadQuoteForEdit(quoteId);
    }
  }, [searchParams]);

  const loadQuoteForEdit = async (quoteId: string) => {
    try {
      const quote = await quoteService.getQuoteById(quoteId);
      setQuoteName(quote.quote_name);
      setClientName(quote.client_name);
      setMainAsset(quote.main_asset);
      setCommitmentYears(quote.commitment_years);
      setDiscountPercent(quote.discount_percent);
      setCurrency(quote.currency as CurrencyCode);
      setLineItems(quote.line_items);
      toast.success("Quote loaded for editing");
    } catch (error) {
      console.error("Failed to load quote:", error);
      toast.error("Failed to load quote");
      navigate('/');
    }
  };

  const handleSaveQuote = async () => {
    if (!quoteName.trim() || !clientName.trim()) {
      toast.error("Please enter both quote name and client name");
      return;
    }
    if (!mainAsset.trim()) {
      toast.error("Please select a main asset");
      return;
    }

    try {
      const totals = calculateQuoteTotals(lineItems, defaultPricingRates);
      const yearlyPlatformFee = 50000;
      const yearlyTotal = totals.grandTotal + yearlyPlatformFee;
      const commitmentTotal = yearlyTotal * commitmentYears;
      const discountAmount = commitmentTotal * (discountPercent / 100);
      const totalBeforeDiscount = commitmentTotal;
      const finalTotal = commitmentTotal - discountAmount;
      const yearOneSubscription = totals.grandTotal + yearlyPlatformFee;

      const quoteData: Omit<Quote, 'id' | 'created_at' | 'updated_at'> = {
        quote_name: quoteName,
        client_name: clientName,
        main_asset: mainAsset,
        commitment_years: commitmentYears,
        discount_percent: discountPercent,
        currency: currency,
        yearly_platform_fee: yearlyPlatformFee,
        year_one_subscription: yearOneSubscription,
        total_before_discount: totalBeforeDiscount,
        discount_amount: discountAmount,
        final_total: finalTotal,
        line_items: lineItems,
        rates: defaultPricingRates,
      };

      if (isEditMode && editingQuoteId) {
        await quoteService.updateQuote(editingQuoteId, quoteData);
        toast.success("Quote updated successfully!");
      } else {
        await quoteService.saveQuote(quoteData);
        toast.success("Quote saved successfully!");
      }

      navigate('/');
    } catch (error) {
      console.error("Failed to save quote:", error);
      toast.error(`Failed to save quote: ${error.message || 'Unknown error'}`);
    }
  };

  const currencyInfo = getCurrencyByCode(currency);
  const formatCurrency = (amount: number, showDecimals = false) =>
    formatCurrencyValue(amount, currency, { showDecimals });

  const mainAssetTypes = [
    "City", "Municipality", "Mixed-Use District", "Mixed-Use Campus",
    "Sports District", "Industrial District", "Airport", "Port",
    "Healthcare Campus", "Education Campus", "Large Enterprise",
    "Commercial Portfolio Owner", "Residential Portfolio Owner",
    "Data Center", "Warehouse", "Open Area", "Remote Site", "Building"
  ];

  const defaultDiscounts = { 1: 0, 3: 15, 5: 25 };

  const handleCommitmentChange = (years: number) => {
    setCommitmentYears(years);
    setDiscountPercent(defaultDiscounts[years as keyof typeof defaultDiscounts] || 0);
  };

  const hierarchicalMainAssets = ["City", "Municipality", "Mixed-Use District", "Mixed-Use Campus"];
  const isHierarchicalMode = hierarchicalMainAssets.includes(mainAsset);

  const assetTypes = Object.keys(defaultPricingRates.energy);
  const supportPlans = Object.keys(defaultPricingRates.supportPlans);

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      assetType: "Commercial Building",
      description: "",
      size: 1000,
      sustainability: false,
      security: false,
      securityChannels: 0,
      mobility: false,
      mobilityChannels: 0,
      insight: false,
      supportPlan: "8x5",
      quantity: 1,
      subMainAsset: undefined,
      subLineItems: [],
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(lineItems.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const calculateAllTotals = () => {
    let allLineItems: LineItem[] = [];
    if (isHierarchicalMode) {
      lineItems.forEach((item) => {
        if (item.subLineItems && item.subLineItems.length > 0) {
          item.subLineItems.forEach((sub) => {
            allLineItems.push({ ...sub, subMainAsset: undefined, subLineItems: [] });
          });
        } else {
          allLineItems.push(item);
        }
      });
    } else {
      allLineItems = lineItems;
    }
    return calculateQuoteTotals(allLineItems, defaultPricingRates);
  };

  const totals = calculateAllTotals();
  const yearlyPlatformFee = 50000;
  const yearlyTotal = totals.grandTotal + yearlyPlatformFee;
  const commitmentTotal = yearlyTotal * commitmentYears;
  const discountAmount = commitmentTotal * (discountPercent / 100);
  const finalTotal = commitmentTotal - discountAmount;

  // ── Effort Estimation helpers ──────────────────────────────────────────

  const updateEffortMargin = (val: number) => {
    setEffortData(prev => ({ ...prev, margin: val }));
  };

  const updateTravelPercent = (val: number) => {
    setEffortData(prev => ({ ...prev, travelPercent: val }));
  };

  const updateCalDays = (activityIndex: number, val: number) => {
    setEffortData(prev => {
      const activities = prev.activities.map((a, i) =>
        i === activityIndex ? { ...a, calDays: val } : a
      );
      return { ...prev, activities };
    });
  };

  const updateAllocation = (activityIndex: number, resourceIndex: number, val: number) => {
    setEffortData(prev => {
      const allocation = prev.allocation.map((row, ai) =>
        ai === activityIndex
          ? row.map((v, ri) => (ri === resourceIndex ? val : v))
          : row
      );
      return { ...prev, allocation };
    });
  };

  // ── Generate Excel ─────────────────────────────────────────────────────

  const handleGenerateClientPDF = async () => {
    try {
      toast.info("Generating PDF...");
      const quoteData: ClientQuoteData = {
        clientName,
        quoteName,
        quoteDate: new Date().toISOString(),
        mainAsset,
        commitmentYears,
        discountPercent,
        lineItems,
        rates: defaultPricingRates,
        currency,
      };
      const blob = await pdf(<ClientQuotePDF data={quoteData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${quoteName}_Client_Quote.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Client quote PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handleGenerateClientExcel = async () => {
    try {
      toast.info("Generating Excel...");
      const quoteData: ClientQuoteData = {
        clientName,
        quoteName,
        quoteDate: new Date().toISOString(),
        mainAsset,
        commitmentYears,
        discountPercent,
        lineItems,
        rates: defaultPricingRates,
        currency,
      };
      const blob = await generateClientQuoteExcel(quoteData, effortData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${quoteName}_Client_Quote.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Client quote Excel generated successfully!");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEditMode ? "Edit Quote" : "New Quote"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode ? "Modify your pricing quote" : "Create a pricing quote for your client"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button variant="secondary" size="lg" className="gap-2" onClick={handleGenerateClientPDF}>
              <FileText className="h-4 w-4" />
              Generate Client Quote (PDF)
            </Button>
            <Button variant="secondary" size="lg" className="gap-2" onClick={handleGenerateClientExcel}>
              <FileSpreadsheet className="h-4 w-4" />
              Generate Client Quote (Excel)
            </Button>
            <Button size="lg" className="gap-2" onClick={handleSaveQuote}>
              <Save className="h-4 w-4" />
              {isEditMode ? "Update Quote" : "Save Quote"}
            </Button>
          </div>
        </div>

        {/* ── Client Info ── */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input
                  placeholder="Select or enter client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Quote Name</Label>
                <Input
                  placeholder="Q-2025-001"
                  value={quoteName}
                  onChange={(e) => setQuoteName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Commitment Period</Label>
                <Select
                  value={commitmentYears.toString()}
                  onValueChange={(value) => handleCommitmentChange(Number(value))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Year</SelectItem>
                    <SelectItem value="3">3 Years</SelectItem>
                    <SelectItem value="5">5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  min="0" max="100" placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Main Asset</Label>
                <Select value={mainAsset} onValueChange={setMainAsset}>
                  <SelectTrigger><SelectValue placeholder="Select main asset type" /></SelectTrigger>
                  <SelectContent>
                    {mainAssetTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getCurrencies().map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Line Items ── */}
        {lineItems.map((item, index) => (
          <LineItemGroup
            key={item.id}
            item={item}
            index={index}
            isHierarchicalMode={isHierarchicalMode}
            mainAsset={mainAsset}
            mainAssetTypes={mainAssetTypes}
            assetTypes={assetTypes}
            supportPlans={supportPlans}
            formatCurrency={formatCurrency}
            commitmentYears={commitmentYears}
            discountPercent={discountPercent}
            onUpdate={(updates) => updateLineItem(item.id, updates)}
            onRemove={() => removeLineItem(item.id)}
            canRemove={lineItems.length > 1}
          />
        ))}

        <Button variant="outline" size="lg" className="w-full gap-2" onClick={addLineItem}>
          <Plus className="h-4 w-4" />
          Add Line Item
        </Button>

        {/* ══════════════════════════════════════════════════════════
            EFFORT ESTIMATION SECTION
        ══════════════════════════════════════════════════════════ */}
        <Card className="border-border">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setShowEffortSection(v => !v)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Effort Estimation
              </CardTitle>
              {showEffortSection
                ? <ChevronUp className="h-5 w-5 text-muted-foreground" />
                : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Fill in the fields below to populate the "Effort Estimation" sheet in the generated Excel file.
            </p>
          </CardHeader>

          {showEffortSection && (
            <CardContent className="space-y-8">

              {/* ── Global Inputs ── */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Margin (%)</Label>
                  <Input
                    type="number"
                    min="0" max="99" step="0.1"
                    value={(effortData.margin * 100).toFixed(1)}
                    onChange={(e) => updateEffortMargin(Number(e.target.value) / 100)}
                    placeholder="e.g. 30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Applies to all roles. Rate = Cost / (1 – Margin)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Travel (%)</Label>
                  <Input
                    type="number"
                    min="0" max="100" step="0.1"
                    value={(effortData.travelPercent * 100).toFixed(1)}
                    onChange={(e) => updateTravelPercent(Number(e.target.value) / 100)}
                    placeholder="e.g. 10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Final Price incl. Travel = Price × (1 + Travel%)
                  </p>
                </div>
              </div>

              <Separator />

              {/* ── Cal Days per Activity ── */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Calendar Days per Activity</h3>
                <p className="text-xs text-muted-foreground">Weeks = Cal Days / 5</p>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {ACTIVITY_NAMES.map((actName, ai) => (
                    <div key={ai} className="space-y-1">
                      <Label className="text-xs leading-tight">{actName}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={effortData.activities[ai]?.calDays ?? 0}
                        onChange={(e) => updateCalDays(ai, Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* ── Resource Allocation % ── */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Resource Allocation (%) per Activity</h3>
                <p className="text-xs text-muted-foreground">
                  Enter the allocation percentage (0–100) for each resource per activity.
                  These are the yellow editable cells in the Excel sheet.
                </p>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-3 py-2 text-left font-semibold text-foreground min-w-[200px]">Activity</th>
                        {RESOURCE_NAMES.map((rn, ri) => (
                          <th key={ri} className="px-2 py-2 text-center font-semibold text-foreground min-w-[90px] text-xs">
                            {rn}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ACTIVITY_NAMES.map((actName, ai) => (
                        <tr key={ai} className={ai % 2 === 0 ? "bg-background" : "bg-muted/40"}>
                          <td className="px-3 py-2 font-medium text-foreground text-xs">{actName}</td>
                          {RESOURCE_NAMES.map((_, ri) => (
                            <td key={ri} className="px-1 py-1 text-center">
                              <Input
                                type="number"
                                min="0" max="100" step="1"
                                className="h-7 w-20 text-center text-xs bg-yellow-50 border-yellow-200 focus:border-yellow-400"
                                value={((effortData.allocation[ai]?.[ri] ?? 0) * 100).toFixed(0)}
                                onChange={(e) =>
                                  updateAllocation(ai, ri, Number(e.target.value) / 100)
                                }
                                placeholder="0"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Preview summary ── */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Quick Preview</h3>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  {RESOURCE_NAMES.map((rn, ri) => {
                    const totalEffort = ACTIVITY_NAMES.reduce((sum, _, ai) => {
                      return sum + (effortData.allocation[ai]?.[ri] ?? 0) * (effortData.activities[ai]?.calDays ?? 0);
                    }, 0);
                    if (totalEffort === 0) return null;
                    return (
                      <div key={ri} className="flex justify-between">
                        <span>{rn}</span>
                        <span className="font-medium text-foreground">{totalEffort.toFixed(1)} days</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </CardContent>
          )}
        </Card>

        {/* ── Quote Summary ── */}
        <Card className="border-primary bg-gradient-to-br from-card to-muted/30">
          <CardHeader>
            <CardTitle className="text-2xl">
              Quote Summary ({commitmentYears} Year{commitmentYears > 1 ? 's' : ''})
            </CardTitle>
            {mainAsset && (
              <p className="text-muted-foreground">
                Main Asset: <span className="font-semibold text-foreground">{mainAsset}</span>
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Yearly Sustainability</span>
              <span className="font-semibold">{formatCurrency(totals.totalSustainability, true)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Yearly Security</span>
              <span className="font-semibold">{formatCurrency(totals.totalSecurity, true)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Yearly Mobility</span>
              <span className="font-semibold">{formatCurrency(totals.totalMobility, true)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Yearly Insight</span>
              <span className="font-semibold">{formatCurrency(totals.totalInsight, true)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Yearly Support</span>
              <span className="font-semibold">{formatCurrency(totals.totalSupport, true)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Platform Subscription (Yearly)</span>
              <span className="font-semibold">{formatCurrency(yearlyPlatformFee, true)}</span>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Yearly Total</span>
              <span className="font-semibold">{formatCurrency(yearlyTotal, true)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Commitment Period</span>
              <span className="font-semibold">{commitmentYears} Year{commitmentYears > 1 ? 's' : ''}</span>
            </div>
            <Separator className="my-2" />
            {discountPercent > 0 ? (
              <>
                <div className="flex justify-between text-xl">
                  <span className="text-muted-foreground">Total Before Discount</span>
                  <span className="font-semibold line-through text-destructive">
                    {formatCurrency(commitmentTotal, true)}
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Discount ({discountPercent}%)</span>
                  <span className="font-semibold text-emerald-600">-{formatCurrency(discountAmount, true)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-2xl font-bold text-foreground">
                  <span>Final Total</span>
                  <span className="text-primary">{formatCurrency(finalTotal, true)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-2xl font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(commitmentTotal, true)}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-right italic mt-2">
              *All prices in {currencyInfo.code}, excluding applicable taxes
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default QuoteBuilder;
