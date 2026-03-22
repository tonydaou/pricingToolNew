import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, Edit, Trash2 } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { quoteService, Quote } from "@/lib/supabase";
import { formatCurrencyValue } from "@/lib/currencies";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { generateClientQuoteExcel } from "@/lib/clientQuoteExcel";
import { pdf } from "@react-pdf/renderer";
import ClientQuotePDF from "@/components/ClientQuotePDF";

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuote(id);
    }
  }, [id]);

  const loadQuote = async (quoteId: string) => {
    try {
      setLoading(true);
      const quoteData = await quoteService.getQuoteById(quoteId);
      setQuote(quoteData);
    } catch (error) {
      console.error("Failed to load quote:", error);
      toast.error("Failed to load quote");
      navigate('/quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuote = () => {
    if (quote) {
      navigate(`/quote-builder?edit=${quote.id}`);
    }
  };

  const handleDeleteQuote = () => {
    if (quote) {
      setDeleteDialogOpen(true);
    }
  };

  const confirmDeleteQuote = async () => {
    if (!quote) return;

    try {
      setIsDeleting(true);
      await quoteService.deleteQuote(quote.id);
      toast.success("Quote deleted successfully");
      navigate('/quotes');
    } catch (error) {
      console.error("Failed to delete quote:", error);
      toast.error("Failed to delete quote");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!quote) return;
    try {
      toast.loading("Generating PDF...");
      
      // Use the existing ClientQuotePDF component
      const pdfDoc = (
        <ClientQuotePDF 
          data={{
            clientName: quote.client_name,
            quoteName: quote.quote_name,
            quoteDate: new Date(quote.created_at!).toLocaleDateString(),
            mainAsset: quote.main_asset,
            commitmentYears: quote.commitment_years,
            discountPercent: quote.discount_percent,
            lineItems: quote.line_items,
            rates: quote.rates,
            currency: quote.currency as any,
          }} 
        />
      );

      // Generate PDF blob
      const pdfBlob = await pdf(pdfDoc).toBlob();
      
      // Download the PDF
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quote.quote_name.replace(/[^a-zA-Z0-9]/g, '_')}_quote.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const handleDownloadExcel = async () => {
    if (!quote) return;
    try {
      toast.loading("Generating Excel file...");
      
      const excelBuffer = await generateClientQuoteExcel({
        clientName: quote.client_name,
        quoteName: quote.quote_name,
        quoteDate: new Date(quote.created_at!).toLocaleDateString(),
        mainAsset: quote.main_asset,
        lineItems: quote.line_items,
        rates: quote.rates,
        commitmentYears: quote.commitment_years,
        discountPercent: quote.discount_percent,
        currency: quote.currency as any,
      });

      // Create blob and download
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quote.quote_name.replace(/[^a-zA-Z0-9]/g, '_')}_quote.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Failed to download Excel:", error);
      toast.error("Failed to download Excel file");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading quote details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!quote) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Quote not found</p>
            <Link to="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">{quote.quote_name}</h1>
              </div>
              <p className="text-muted-foreground mt-1">{quote.client_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleEditQuote}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleDeleteQuote}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button className="gap-2" onClick={handleDownloadExcel}>
              <Download className="h-4 w-4" />
              Download Excel
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
                <p className="font-medium text-foreground">{quote.main_asset}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created Date</p>
                <p className="font-medium text-foreground">
                  {new Date(quote.created_at!).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commitment Period</p>
                <p className="font-medium text-foreground">{quote.commitment_years} year{quote.commitment_years > 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium text-foreground">{quote.currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Discount</p>
                <p className="font-medium text-foreground">{quote.discount_percent}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Number of Line Items</p>
                <p className="font-medium text-foreground">{quote.line_items?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Yearly Platform Fee</span>
                <span className="font-medium">{formatCurrencyValue(quote.yearly_platform_fee, quote.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Year One Subscription</span>
                <span className="font-medium">{formatCurrencyValue(quote.year_one_subscription, quote.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Before Discount</span>
                <span className="font-medium">{formatCurrencyValue(quote.total_before_discount, quote.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount Amount</span>
                <span className="font-medium">{formatCurrencyValue(quote.discount_amount, quote.currency)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="font-bold text-foreground">Final Total</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrencyValue(quote.final_total, quote.currency)}
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
              {quote.line_items?.map((item, index) => (
                <div key={item.id || index} className="p-4 border border-border rounded-lg">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Asset Type</p>
                      <p className="font-medium text-foreground">{item.assetType || "-"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-medium text-foreground">{item.description || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium text-foreground">{(item.size || 0).toLocaleString()} sqm</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-medium text-foreground">{item.quantity || 1}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Support Plan</p>
                      <p className="font-medium text-foreground">{item.supportPlan || "-"}</p>
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
                            Security ({item.securityChannels || 0} channels)
                          </span>
                        )}
                        {item.mobility && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            Mobility ({item.mobilityChannels || 0} channels)
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
        
        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Quote"
          description={`Are you sure you want to delete the quote "${quote?.quote_name}"? This action cannot be undone.`}
          confirmText="Delete Quote"
          cancelText="Cancel"
          onConfirm={confirmDeleteQuote}
          isLoading={isDeleting}
        />
      </div>
    </Layout>
  );
};

export default QuoteDetail;
