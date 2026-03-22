import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Eye, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { quoteService, Quote } from "@/lib/supabase";
import { formatCurrencyValue } from "@/lib/currencies";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const Quotes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const allQuotes = await quoteService.getAllQuotes();
      setQuotes(allQuotes);
    } catch (error) {
      console.error("Failed to load quotes:", error);
      toast.error("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.quote_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditQuote = (quoteId: string) => {
    navigate(`/quote-builder?edit=${quoteId}`);
  };

  const handleDeleteQuote = (quoteId: string, quoteName: string) => {
    setQuoteToDelete({ id: quoteId, name: quoteName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteQuote = async () => {
    if (!quoteToDelete) return;

    try {
      setIsDeleting(true);
      await quoteService.deleteQuote(quoteToDelete.id);
      toast.success("Quote deleted successfully");
      loadQuotes(); // Reload quotes
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    } catch (error) {
      console.error("Failed to delete quote:", error);
      toast.error("Failed to delete quote");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quotes</h1>
            <p className="text-muted-foreground mt-1">View and manage all pricing quotes</p>
          </div>
          <Link to="/quote-builder">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              New Quote
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quotes by ID or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading quotes...</p>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quotes found</p>
              <Link to="/quote-builder" className="mt-4 inline-block">
                <Button>Create Quote</Button>
              </Link>
            </div>
          ) : (
            filteredQuotes.map((quote) => (
              <Card key={quote.id} className="border-border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">{quote.quote_name}</CardTitle>
                    </div>
                    <CardDescription className="text-base">{quote.client_name}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/quotes/${quote.id}`}>
                      <Button variant="outline" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                    <Button variant="outline" className="gap-2" onClick={(e) => {
                      e.preventDefault();
                      handleEditQuote(quote.id!);
                    }}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={(e) => {
                      e.preventDefault();
                      handleDeleteQuote(quote.id!, quote.quote_name);
                    }}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
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
                      <p className="text-sm text-muted-foreground">Line Items</p>
                      <p className="font-medium text-foreground">{quote.line_items?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Final Total</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrencyValue(quote.final_total, quote.currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Quote"
          description={`Are you sure you want to delete the quote "${quoteToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete Quote"
          cancelText="Cancel"
          onConfirm={confirmDeleteQuote}
          isLoading={isDeleting}
        />
      </div>
    </Layout>
  );
};

export default Quotes;
