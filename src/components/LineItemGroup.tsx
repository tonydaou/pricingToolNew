import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { LineItem, SubLineItem } from "@/types/pricing";
import { calculateLineItemPricing, defaultPricingRates } from "@/lib/pricingCalculations";
import SubLineItemCard from "./SubLineItemCard";

interface LineItemGroupProps {
  item: LineItem;
  index: number;
  isHierarchicalMode: boolean;
  mainAsset: string;
  mainAssetTypes: string[];
  assetTypes: string[];
  supportPlans: string[];
  formatCurrency: (amount: number, showDecimals?: boolean) => string;
  commitmentYears: number;
  discountPercent: number;
  onUpdate: (updates: Partial<LineItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const LineItemGroup = ({
  item,
  index,
  isHierarchicalMode,
  mainAsset,
  mainAssetTypes,
  assetTypes,
  supportPlans,
  formatCurrency,
  commitmentYears,
  discountPercent,
  onUpdate,
  onRemove,
  canRemove,
}: LineItemGroupProps) => {
  const pricing = calculateLineItemPricing(item, defaultPricingRates);

  // Filter out the main asset from sub-main asset options
  const subMainAssetOptions = mainAssetTypes.filter((type) => type !== mainAsset);

  const addSubLineItem = () => {
    const newSubItem: SubLineItem = {
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
    };
    onUpdate({
      subLineItems: [...(item.subLineItems || []), newSubItem],
    });
  };

  const updateSubLineItem = (subId: string, updates: Partial<SubLineItem>) => {
    const updatedSubItems = (item.subLineItems || []).map((sub) =>
      sub.id === subId ? { ...sub, ...updates } : sub
    );
    onUpdate({ subLineItems: updatedSubItems });
  };

  const removeSubLineItem = (subId: string) => {
    onUpdate({
      subLineItems: (item.subLineItems || []).filter((sub) => sub.id !== subId),
    });
  };

  // Calculate total for this group (including sub-line items)
  const subLineItemsTotals = (item.subLineItems || []).reduce(
    (acc, sub) => {
      const subPricing = calculateLineItemPricing(sub, defaultPricingRates);
      return {
        lineTotal: acc.lineTotal + subPricing.lineTotal,
      };
    },
    { lineTotal: 0 }
  );

  const groupTotal = pricing.lineTotal + subLineItemsTotals.lineTotal;

  return (
    <div className="space-y-3">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg">Line Item {index + 1}</CardTitle>
            {isHierarchicalMode && item.subMainAsset && (
              <span className="text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                {item.subMainAsset}
              </span>
            )}
          </div>
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sub Main Asset selector for hierarchical mode */}
          {isHierarchicalMode && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Sub Main Asset</Label>
                <Select
                  value={item.subMainAsset || ""}
                  onValueChange={(value) => onUpdate({ subMainAsset: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub main asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {subMainAssetOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Only show full line item config if NOT in hierarchical mode, or if no sub-line items */}
          {(!isHierarchicalMode || !(item.subLineItems && item.subLineItems.length > 0)) && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select
                    value={item.assetType}
                    onValueChange={(value) => onUpdate({ assetType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Size (sqm)</Label>
                  <Input
                    type="text"
                    value={item.size === 0 ? '' : item.size.toLocaleString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      const numValue = value === '' ? 0 : Number(value);
                      if (!isNaN(numValue)) {
                        onUpdate({ size: numValue });
                      }
                    }}
                    placeholder="e.g. 10,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdate({ quantity: Number(e.target.value) })}
                    placeholder="e.g. 1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input
                  placeholder="Add notes about this line item..."
                  value={item.description}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label>Sustainability</Label>
                    <p className="text-sm text-muted-foreground">Energy monitoring</p>
                  </div>
                  <Switch
                    checked={item.sustainability}
                    onCheckedChange={(checked) => onUpdate({ sustainability: checked })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label>Security</Label>
                    <p className="text-sm text-muted-foreground">Video AI analysis</p>
                  </div>
                  <Switch
                    checked={item.security}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        security: checked,
                        securityChannels: checked ? item.securityChannels : 0,
                      })
                    }
                  />
                </div>

                {item.security && (
                  <div className="space-y-2">
                    <Label>Security Channels</Label>
                    <Input
                      type="number"
                      value={item.securityChannels}
                      onChange={(e) => onUpdate({ securityChannels: Number(e.target.value) })}
                      placeholder="e.g. 4"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label>Mobility</Label>
                    <p className="text-sm text-muted-foreground">Traffic analysis</p>
                  </div>
                  <Switch
                    checked={item.mobility}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        mobility: checked,
                        mobilityChannels: checked ? item.mobilityChannels : 0,
                      })
                    }
                  />
                </div>

                {item.mobility && (
                  <div className="space-y-2">
                    <Label>Mobility Channels</Label>
                    <Input
                      type="number"
                      value={item.mobilityChannels}
                      onChange={(e) => onUpdate({ mobilityChannels: Number(e.target.value) })}
                      placeholder="e.g. 2"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label>Insight</Label>
                    <p className="text-sm text-muted-foreground">Data insights</p>
                  </div>
                  <Switch
                    checked={item.insight}
                    onCheckedChange={(checked) => onUpdate({ insight: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Support Plan</Label>
                  <Select
                    value={item.supportPlan}
                    onValueChange={(value) => onUpdate({ supportPlan: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportPlans.map((plan) => (
                        <SelectItem key={plan} value={plan}>
                          {plan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold text-lg mb-3 text-primary">Pricing Results</h3>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-b from-primary to-primary/90">
                        <th className="text-left text-primary-foreground font-semibold px-3 py-3 text-sm">METRIC</th>
                        <th className="text-left text-primary-foreground font-semibold px-3 py-3 text-sm">VALUE</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-border">
                        <td className="px-3 py-3">Subscription Sustainability</td>
                        <td className="px-3 py-3 font-medium">{formatCurrency(pricing.sustainabilityCost)}</td>
                      </tr>
                      <tr className="border-b border-border bg-muted/30">
                        <td className="px-3 py-3">Subscription Security</td>
                        <td className="px-3 py-3 font-medium">{formatCurrency(pricing.securityBaseCost)}</td>
                      </tr>
                      <tr className="border-b border-border bg-muted/50">
                        <td className="px-3 py-3">Video AI cost (security) estimate</td>
                        <td className="px-3 py-3 font-medium">{formatCurrency(pricing.securityChannelCost)}</td>
                      </tr>
                      <tr className="border-b border-border bg-muted/30">
                        <td className="px-3 py-3">Subscription Mobility</td>
                        <td className="px-3 py-3 font-medium">{formatCurrency(pricing.mobilityBaseCost)}</td>
                      </tr>
                      <tr className="border-b border-border bg-muted/50">
                        <td className="px-3 py-3">Video AI cost (mobility) estimate</td>
                        <td className="px-3 py-3 font-medium">{formatCurrency(pricing.mobilityChannelCost)}</td>
                      </tr>
                      <tr className="border-b border-border bg-muted/30">
                        <td className="px-3 py-3">Subscription Insight</td>
                        <td className="px-3 py-3 font-medium">{formatCurrency(pricing.insightCost)}</td>
                      </tr>
                      <tr className="border-b border-border bg-muted/30">
                        <td className="px-3 py-3">Yearly Subscription</td>
                        <td className="px-3 py-3 font-medium">{formatCurrency(pricing.yearlySubscription)}</td>
                      </tr>
                      <tr className="border-b border-border bg-muted/30">
                        <td className="px-3 py-3">Yearly Support</td>
                        <td className="px-3 py-3 font-medium">{formatCurrency(pricing.supportCost)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-primary bg-muted/50">
                        <td className="px-3 py-3 font-bold text-base">Yearly License + Support + Platform</td>
                        <td className="px-3 py-3 font-bold text-base text-primary">{formatCurrency(pricing.lineTotal)}</td>
                      </tr>
                      <tr className="bg-muted/30">
                        <td className="px-3 py-3 font-semibold">Commitment Period ({commitmentYears} Year{commitmentYears > 1 ? 's' : ''})</td>
                        <td className="px-3 py-3 font-semibold">{formatCurrency(pricing.lineTotal * commitmentYears)}</td>
                      </tr>
                      {discountPercent > 0 && (
                        <>
                          <tr className="bg-muted/30">
                            <td className="px-3 py-3 text-emerald-600">Discount ({discountPercent}%)</td>
                            <td className="px-3 py-3 text-emerald-600 font-semibold">-{formatCurrency(pricing.lineTotal * commitmentYears * (discountPercent / 100))}</td>
                          </tr>
                          <tr className="border-t-2 border-primary bg-primary/10">
                            <td className="px-3 py-3 font-bold text-lg">Final Total</td>
                            <td className="px-3 py-3 font-bold text-lg text-primary">{formatCurrency(pricing.lineTotal * commitmentYears * (1 - discountPercent / 100))}</td>
                          </tr>
                          <tr>
                            <td colSpan={2} className="px-3 py-1 text-xs text-muted-foreground text-right italic">*Excluding applicable taxes</td>
                          </tr>
                        </>
                      )}
                      {discountPercent === 0 && (
                        <tr>
                          <td colSpan={2} className="px-3 py-1 text-xs text-muted-foreground text-right italic">*Excluding applicable taxes</td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Add Sub Line Item button for hierarchical mode */}
          {isHierarchicalMode && item.subMainAsset && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 mt-2"
              onClick={addSubLineItem}
            >
              <Plus className="h-4 w-4" />
              Add Sub Line Item to {item.subMainAsset}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sub Line Items */}
      {isHierarchicalMode && item.subLineItems && item.subLineItems.length > 0 && (
        <div className="space-y-3">
          {item.subLineItems.map((subItem, subIndex) => (
            <SubLineItemCard
              key={subItem.id}
              item={subItem}
              parentIndex={index}
              subIndex={subIndex}
              assetTypes={assetTypes}
              supportPlans={supportPlans}
              formatCurrency={formatCurrency}
              commitmentYears={commitmentYears}
              discountPercent={discountPercent}
              onUpdate={(updates) => updateSubLineItem(subItem.id, updates)}
              onRemove={() => removeSubLineItem(subItem.id)}
              canRemove={item.subLineItems!.length > 1}
            />
          ))}

          {/* Group Total Summary */}
          <Card className="border-primary/50 bg-primary/5 ml-8">
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">
                  {item.subMainAsset} Group Total (Yearly)
                </span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(subLineItemsTotals.lineTotal)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LineItemGroup;
