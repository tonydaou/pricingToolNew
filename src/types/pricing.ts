export interface SubLineItem {
  id: string;
  assetType: string;
  description: string;
  size: number;
  sustainability: boolean;
  security: boolean;
  securityChannels: number;
  mobility: boolean;
  mobilityChannels: number;
  insight: boolean;
  supportPlan: string;
  quantity: number;
}

export interface LineItem {
  id: string;
  assetType: string;
  description: string;
  size: number;
  sustainability: boolean;
  security: boolean;
  securityChannels: number;
  mobility: boolean;
  mobilityChannels: number;
  insight: boolean;
  supportPlan: string;
  quantity: number;
  // For hierarchical structure when main asset is City/Municipality/Mixed-Use District/Mixed-Use Campus
  subMainAsset?: string;
  subLineItems?: SubLineItem[];
}

export interface Quote {
  id: string;
  clientId: string;
  clientName: string;
  createdAt: string;
  createdBy: string;
  lineItems: LineItem[];
  totalSustainability: number;
  totalSecurity: number;
  totalMobility: number;
  totalInsight: number;
  totalSupport: number;
  grandTotal: number;
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface PricingRates {
  energy: Record<string, number>;
  security: Record<string, number>;
  mobility: Record<string, number>;
  supportPlans: Record<string, number>;
}
