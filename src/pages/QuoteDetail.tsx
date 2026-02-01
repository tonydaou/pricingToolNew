import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, Mail } from "lucide-react";
import { useParams, Link } from "react-router-dom";

const QuoteDetail = () => {
  const { id } = useParams();

  // Mock data - in real app this would fetch from API/database
  const quote = {
    id: id || "Q-2025-001",
    clientName: "City Museum",
    mainAsset: "Municipality",
    createdAt: "2025-01-15",
    createdBy: "John Doe",
    lineItems: [
      {
        id: "1",
        assetType: "Commercial Building",
        description: "Main exhibition hall",
        size: 50000,
        sustainability: true,
        security: true,
        securityChannels: 3,
        mobility: false,
        mobilityChannels: 0,
        insight: true,
        supportPlan: "24x7",
        quantity: 1,
      }
    ],
    totalSustainability: 57925,
    totalSecurity: 58000,
    totalMobility: 0,
    totalInsight: 23185,
    totalSupport: 16693,
    grandTotal: 155803,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/quotes">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">{quote.id}</h1>
              </div>
              <p className="text-muted-foreground mt-1">{quote.clientName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              Send
            </Button>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quote Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Main Asset</p>
                <p className="font-medium text-foreground">{quote.mainAsset}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created Date</p>
                <p className="font-medium text-foreground">
                  {new Date(quote.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium text-foreground">{quote.createdBy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Number of Line Items</p>
                <p className="font-medium text-foreground">{quote.lineItems.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sustainability</span>
                <span className="font-medium">${Math.round(quote.totalSustainability).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security</span>
                <span className="font-medium">${Math.round(quote.totalSecurity).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mobility</span>
                <span className="font-medium">${Math.round(quote.totalMobility).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insight</span>
                <span className="font-medium">${Math.round(quote.totalInsight).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Support</span>
                <span className="font-medium">${Math.round(quote.totalSupport).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="font-bold text-foreground">Grand Total</span>
                <span className="text-xl font-bold text-primary">
                  ${Math.round(quote.grandTotal).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Detailed breakdown of assets in this quote</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quote.lineItems.map((item) => (
                <div key={item.id} className="p-4 border border-border rounded-lg">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Asset Type</p>
                      <p className="font-medium text-foreground">{item.assetType}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-medium text-foreground">{item.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium text-foreground">{item.size.toLocaleString()} sqm</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-medium text-foreground">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Support Plan</p>
                      <p className="font-medium text-foreground">{item.supportPlan}</p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-sm text-muted-foreground mb-2">Features</p>
                      <div className="flex gap-2 flex-wrap">
                        {item.sustainability && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            Sustainability
                          </span>
                        )}
                        {item.security && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            Security ({item.securityChannels} channels)
                          </span>
                        )}
                        {item.mobility && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            Mobility ({item.mobilityChannels} channels)
                          </span>
                        )}
                        {item.insight && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            Insight
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default QuoteDetail;
