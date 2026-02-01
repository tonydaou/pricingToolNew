import { LineItem, PricingRates } from "@/types/pricing";
import { calculateLineItemPricing, calculateQuoteTotals } from "./pricingCalculations";
import { CurrencyCode } from "./currencies";

export interface ClientQuoteData {
  clientName: string;
  quoteName: string;
  quoteDate: string;
  mainAsset: string;
  commitmentYears: number;
  discountPercent: number;
  lineItems: LineItem[];
  rates: PricingRates;
  currency: CurrencyCode;
}

export interface ClientQuoteSummary {
  // Feature flags (Y/N)
  hasSustainability: boolean;
  hasSecurity: boolean;
  hasMobility: boolean;
  hasInsight: boolean;
  supportPlan: string;
  
  // Aggregated pricing
  yearlyPlatformFee: number;
  yearOneSubscription: number;
  yearTwoOnwardsSubscription: number;
  
  // Totals
  totalBeforeDiscount: number;
  discountAmount: number;
  finalTotal: number;
  
  // Meta
  commitmentYears: number;
  discountPercent: number;
  currency: string;
}

export const generateClientQuoteSummary = (data: ClientQuoteData): ClientQuoteSummary => {
  const totals = calculateQuoteTotals(data.lineItems, data.rates);
  
  // Determine which features are included across all line items
  const hasSustainability = data.lineItems.some(item => item.sustainability);
  const hasSecurity = data.lineItems.some(item => item.security);
  const hasMobility = data.lineItems.some(item => item.mobility);
  const hasInsight = data.lineItems.some(item => item.insight);
  
  // Get the highest support plan tier
  const supportPlanOrder = ["24x7", "16x5", "8x5"];
  const supportPlan = data.lineItems.reduce((highest, item) => {
    const currentIndex = supportPlanOrder.indexOf(item.supportPlan);
    const highestIndex = supportPlanOrder.indexOf(highest);
    return currentIndex < highestIndex ? item.supportPlan : highest;
  }, "8x5");
  
  // Platform fee (yearly, multiplied by commitment years)
  const yearlyPlatformFee = 50000;
  const totalPlatformFee = yearlyPlatformFee * data.commitmentYears;
  
  // Year 1 subscription (full annual cost including platform fee)
  const yearOneSubscription = totals.grandTotal + yearlyPlatformFee;
  
  // Year 2 onwards (same annual cost including platform fee)
  const yearTwoOnwardsSubscription = totals.grandTotal + yearlyPlatformFee;
  
  // Calculate commitment totals
  const totalBeforeDiscount = yearOneSubscription * data.commitmentYears;
  
  // Discount applies to total (including platform fee since it's now yearly recurring)
  const discountAmount = totalBeforeDiscount * (data.discountPercent / 100);
  const finalTotal = totalBeforeDiscount - discountAmount;
  
  return {
    hasSustainability,
    hasSecurity,
    hasMobility,
    hasInsight,
    supportPlan,
    yearlyPlatformFee,
    yearOneSubscription,
    yearTwoOnwardsSubscription,
    totalBeforeDiscount,
    discountAmount,
    finalTotal,
    commitmentYears: data.commitmentYears,
    discountPercent: data.discountPercent,
    currency: data.currency,
  };
};

export { formatCurrencyValue, getCurrencyByCode } from "./currencies";
