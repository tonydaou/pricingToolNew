import { LineItem, PricingRates } from "@/types/pricing";

const AI_PROVISION = 0.2; // 20%
const MARGIN = 0.25; // 25%
const CHANNEL_BASE_COST = 250;
const INSIGHT_PROVISION = 0.2; // 20%

export const defaultPricingRates: PricingRates = {
  energy: {
    "Commercial Building": 0.9615413993,
    "Residential Building": 0.76925,
    "Warehouse": 0.38466667,
    "Open Area": 0.1923,
    "Data Centre": 4.80775,
    "Sports District": 1.73076,
    "Airport Terminal(s)": 2.6923,
    "Port Terminal": 1.92308,
    "Commercial Center (Mall)": 1.73077,
    "Manufacturing Facility": 2.307666667,
    "Hospital Building": 2.8846,
    "Education Building": 1.15385,
    "Parking Area": 0.1923,
    "Open Road": 0.1923,
    "Intersection": 0.3845,
    "Public Transport Terminal": 1.3462,
  },
  security: {
    "Commercial Building": 0.96,
    "Residential Building": 0.64,
    "Warehouse": 0.64,
    "Open Area": 0.32,
    "Data Centre": 1.28,
    "Sports District": 1.28,
    "Airport Terminal(s)": 1.92,
    "Port Terminal": 0.64,
    "Commercial Center (Mall)": 1.28,
    "Manufacturing Facility": 0.96,
    "Hospital Building": 1.28,
    "Education Building": 0.96,
    "Parking Area": 0.32,
    "Open Road": 0.32,
    "Intersection": 0.96,
    "Public Transport Terminal": 1.28,
  },
  mobility: {
    "Commercial Building": 0.96,
    "Residential Building": 0.64,
    "Warehouse": 0.64,
    "Open Area": 0.32,
    "Data Centre": 0.64,
    "Sports District": 1.60,
    "Airport Terminal(s)": 1.92,
    "Port Terminal": 0.96,
    "Commercial Center (Mall)": 1.28,
    "Manufacturing Facility": 0.64,
    "Hospital Building": 1.28,
    "Education Building": 0.96,
    "Parking Area": 0.32,
    "Open Road": 0.32,
    "Intersection": 0.96,
    "Public Transport Terminal": 1.28,
  },
  supportPlans: {
    "8x5": 0.12,
    "16x5": 0.15,
    "24x7": 0.20,
  },
};

export const calculateLineItemPricing = (item: LineItem, rates: PricingRates) => {
  const energyRate = rates.energy[item.assetType] || 0;
  const securityRate = rates.security[item.assetType] || 0;
  const mobilityRate = rates.mobility[item.assetType] || 0;
  const supportRate = rates.supportPlans[item.supportPlan] || 0;

  // L5: Sustainability (baseEnergy * qty * (1 + provision))
  const sustainabilityCost = item.sustainability
    ? energyRate * item.size * item.quantity * (1 + AI_PROVISION)
    : 0;

  // M5: Security (baseSecurity * qty * (1 + provision))
  const securityBaseCost = item.security
    ? securityRate * item.size * item.quantity * (1 + AI_PROVISION)
    : 0;

  // O5: Security Channels (channels * (250 / (1 - margin)))
  const securityChannelCost = item.securityChannels * (CHANNEL_BASE_COST / (1 - MARGIN));

  // P5: Mobility (baseMobility * qty * (1 + provision))
  const mobilityBaseCost = item.mobility
    ? mobilityRate * item.size * item.quantity * (1 + AI_PROVISION)
    : 0;

  // R5: Mobility Channels (channels * (250 / (1 - margin)))
  const mobilityChannelCost = item.mobilityChannels * (CHANNEL_BASE_COST / (1 - MARGIN));

  // S5: Insight - calculated ONLY on base subscriptions (L5 + M5 + P5), NOT on channel costs
  const baseSubscriptionForInsight = sustainabilityCost + securityBaseCost + mobilityBaseCost;
  const insightCost = item.insight ? baseSubscriptionForInsight * INSIGHT_PROVISION : 0;

  // T5: Yearly subscription total (includes all components)
  const yearlySubscription = 
    sustainabilityCost + securityBaseCost + mobilityBaseCost + insightCost + 
    securityChannelCost + mobilityChannelCost;

  // U5: Support (calculated on total yearly subscription)
  const supportCost = yearlySubscription * supportRate;

  // V5: Line total
  const lineTotal = yearlySubscription + supportCost;

  return {
    sustainabilityCost,
    securityBaseCost,
    securityChannelCost,
    securityCost: securityBaseCost + securityChannelCost,
    mobilityBaseCost,
    mobilityChannelCost,
    mobilityCost: mobilityBaseCost + mobilityChannelCost,
    insightCost,
    supportCost,
    yearlySubscription,
    lineTotal,
  };
};

export const calculateQuoteTotals = (lineItems: LineItem[], rates: PricingRates) => {
  let totalSustainability = 0;
  let totalSecurity = 0;
  let totalMobility = 0;
  let totalInsight = 0;
  let totalSupport = 0;
  let grandTotal = 0;

  lineItems.forEach((item) => {
    // If item has sub-line items, calculate pricing for sub-items instead
    if (item.subLineItems && item.subLineItems.length > 0) {
      item.subLineItems.forEach((subItem) => {
        const pricing = calculateLineItemPricing(subItem, rates);
        totalSustainability += pricing.sustainabilityCost;
        totalSecurity += pricing.securityCost;
        totalMobility += pricing.mobilityCost;
        totalInsight += pricing.insightCost;
        totalSupport += pricing.supportCost;
        grandTotal += pricing.lineTotal;
      });
    } else {
      // Calculate pricing for main item if no sub-items
      const pricing = calculateLineItemPricing(item, rates);
      totalSustainability += pricing.sustainabilityCost;
      totalSecurity += pricing.securityCost;
      totalMobility += pricing.mobilityCost;
      totalInsight += pricing.insightCost;
      totalSupport += pricing.supportCost;
      grandTotal += pricing.lineTotal;
    }
  });

  return {
    totalSustainability,
    totalSecurity,
    totalMobility,
    totalInsight,
    totalSupport,
    grandTotal,
  };
};
