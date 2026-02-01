import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { SubLineItem } from "@/types/pricing";
import { calculateLineItemPricing, defaultPricingRates } from "@/lib/pricingCalculations";

interface SubLineItemCardProps {
  item: SubLineItem;
  parentIndex: number;
  subIndex: number;
  assetTypes: string[];
  supportPlans: string[];
  formatCurrency: (amount: number, showDecimals?: boolean) => string;
  commitmentYears: number;
  discountPercent: number;
  onUpdate: (updates: Partial<SubLineItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const SubLineItemCard = ({
  item,
  parentIndex,
  subIndex,
  assetTypes,
  supportPlans,
  formatCurrency,
  commitmentYears,
  discountPercent,
  onUpdate,
  onRemove,
  canRemove,
}: SubLineItemCardProps) => {
  const pricing = calculateLineItemPricing(item, defaultPricingRates);

  return (
    <Card className="border-border/50 bg-muted/20 ml-8">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-base text-muted-foreground">
          Sub Line Item {parentIndex + 1}-{subIndex + 1}
        </CardTitle>
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
      <CardContent className="space-y-4 pt-0">
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
            placeholder="Add notes about this sub line item..."
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
      </CardContent>
    </Card>
  );
};

export default SubLineItemCard;
