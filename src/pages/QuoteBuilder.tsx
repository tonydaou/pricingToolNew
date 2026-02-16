import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Save, FileText, FileSpreadsheet } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LineItem } from "@/types/pricing";
import { calculateQuoteTotals, defaultPricingRates } from "@/lib/pricingCalculations";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import ClientQuotePDF from "@/components/ClientQuotePDF";
import { ClientQuoteData } from "@/lib/clientQuotePDF";
import { generateClientQuoteExcel } from "@/lib/clientQuoteExcel";
import { getCurrencies, CurrencyCode, getCurrencyByCode, formatCurrencyValue, updateCurrencyRates } from "@/lib/currencies";
import LineItemGroup from "@/components/LineItemGroup";

const QuoteBuilder = () => {
  const navigate = useNavigate();
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
  
  // Fetch real-time currency rates on component mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        await updateCurrencyRates();
        console.log("Currency rates updated successfully");
      } catch (error) {
        console.error("Failed to update currency rates:", error);
      }
    };
    
    fetchRates();
  }, []);
  
  const currencyInfo = getCurrencyByCode(currency);
  const formatCurrency = (amount: number, showDecimals = false) => 
    formatCurrencyValue(amount, currency, { showDecimals });
  
  const mainAssetTypes = [
    "City",
    "Municipality",
    "Mixed-Use District",
    "Mixed-Use Campus",
    "Sports District",
    "Industrial District",
    "Airport",
    "Port",
    "Healthcare Campus",
    "Education Campus",
    "Large Enterprise",
    "Commercial Portfolio Owner",
    "Residential Portfolio Owner",
    "Data Center",
    "Warehouse",
    "Open Area",
    "Remote Site",
    "Building"
  ];
  
  const defaultDiscounts = {
    1: 0,
    3: 15,
    5: 25,
  };
  
  const handleCommitmentChange = (years: number) => {
    setCommitmentYears(years);
    setDiscountPercent(defaultDiscounts[years as keyof typeof defaultDiscounts] || 0);
  };

  // Check if we're in hierarchical mode (first 4 main asset types)
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
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Calculate totals including sub-line items
  const calculateAllTotals = () => {
    let allLineItems: LineItem[] = [];
    
    if (isHierarchicalMode) {
      // In hierarchical mode, include sub-line items in totals
      lineItems.forEach((item) => {
        if (item.subLineItems && item.subLineItems.length > 0) {
          // Add sub-line items as regular line items for calculation
          item.subLineItems.forEach((sub) => {
            allLineItems.push({
              ...sub,
              subMainAsset: undefined,
              subLineItems: [],
            });
          });
        } else {
          // Add the main line item if no sub-line items
          allLineItems.push(item);
        }
      });
    } else {
      allLineItems = lineItems;
    }
    
    return calculateQuoteTotals(allLineItems, defaultPricingRates);
  };

  const totals = calculateAllTotals();
  
  // Platform subscription - yearly recurring fee
  const yearlyPlatformFee = 50000;
  
  // Calculate multi-year totals with discount
  // Platform subscription is yearly and multiplied by commitment years
  const yearlyTotal = totals.grandTotal + yearlyPlatformFee;
  const commitmentTotal = yearlyTotal * commitmentYears;
  // Discount now applies to total (including platform fee since it's recurring)
  const discountAmount = commitmentTotal * (discountPercent / 100);
  const finalTotal = commitmentTotal - discountAmount;

  const handleSave = () => {
    toast.success("Quote saved successfully!");
  };

  const handleGenerateClientPDF = async () => {
    try {
      toast.info("Generating PDF...");
      
      const quoteData: ClientQuoteData = {
        clientName: "", // Will be populated from input
        quoteName: `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        quoteDate: new Date().toISOString(),
        mainAsset,
        commitmentYears,
        discountPercent,
        lineItems,
        rates: defaultPricingRates,
        currency,
      };

      // Get client name from input if available
      const clientNameInput = document.querySelector('input[placeholder="Select or enter client name"]') as HTMLInputElement;
      if (clientNameInput) {
        quoteData.clientName = clientNameInput.value;
      }

      // Get quote name from input if available
      const quoteNameInput = document.querySelector('input[placeholder="Q-2025-001"]') as HTMLInputElement;
      if (quoteNameInput && quoteNameInput.value) {
        quoteData.quoteName = quoteNameInput.value;
      }

      const blob = await pdf(<ClientQuotePDF data={quoteData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${quoteData.quoteName}_Client_Quote.pdf`;
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
        clientName: "",
        quoteName: `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        quoteDate: new Date().toISOString(),
        mainAsset,
        commitmentYears,
        discountPercent,
        lineItems,
        rates: defaultPricingRates,
        currency,
      };

      // Get client name from input if available
      const clientNameInput = document.querySelector('input[placeholder="Select or enter client name"]') as HTMLInputElement;
      if (clientNameInput) {
        quoteData.clientName = clientNameInput.value;
      }

      // Get quote name from input if available
      const quoteNameInput = document.querySelector('input[placeholder="Q-2025-001"]') as HTMLInputElement;
      if (quoteNameInput && quoteNameInput.value) {
        quoteData.quoteName = quoteNameInput.value;
      }

      const blob = await generateClientQuoteExcel(quoteData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${quoteData.quoteName}_Client_Quote.xlsx`;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">New Quote</h1>
            <p className="text-muted-foreground mt-1">Create a pricing quote for your client</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => navigate("/quotes")}>
              Cancel
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              className="gap-2" 
              onClick={handleGenerateClientPDF}
            >
              <FileText className="h-4 w-4" />
              Generate Client Quote (PDF)
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              className="gap-2" 
              onClick={handleGenerateClientExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Generate Client Quote (Excel)
            </Button>
            <Button size="lg" className="gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Save Quote
            </Button>
          </div>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input placeholder="Select or enter client name" />
              </div>
              <div className="space-y-2">
                <Label>Quote Name</Label>
                <Input placeholder="Q-2025-001" />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Commitment Period</Label>
                <Select
                  value={commitmentYears.toString()}
                  onValueChange={(value) => handleCommitmentChange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Main Asset</Label>
                <Select
                  value={mainAsset}
                  onValueChange={setMainAsset}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select main asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainAssetTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={currency}
                  onValueChange={(value) => setCurrency(value as CurrencyCode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getCurrencies().map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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

        <Card className="border-primary bg-gradient-to-br from-card to-muted/30">
          <CardHeader>
            <CardTitle className="text-2xl">Quote Summary ({commitmentYears} Year{commitmentYears > 1 ? 's' : ''})</CardTitle>
            {mainAsset && (
              <p className="text-muted-foreground">Main Asset: <span className="font-semibold text-foreground">{mainAsset}</span></p>
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
                  <span className="font-semibold line-through text-destructive">{formatCurrency(commitmentTotal, true)}</span>
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
            <p className="text-xs text-muted-foreground text-right italic mt-2">*All prices in {currencyInfo.code}, excluding applicable taxes</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default QuoteBuilder;
