import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FileText, TrendingUp, DollarSign, Edit, Trash2, Search, Eye, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { quoteService, Quote } from "@/lib/supabase";
import { formatCurrencyValue } from "@/lib/currencies";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([]);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  
  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load quotes on component mount
  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const [recent, all] = await Promise.all([
        quoteService.getRecentQuotes(),
        quoteService.getAllQuotes()
      ]);
      setRecentQuotes(recent || []);
      setAllQuotes(all || []);
    } catch (error) {
      console.error("Failed to load quotes:", error);
      toast.error("Failed to load quotes - using demo data");
      // Set demo data to prevent blank page
      setRecentQuotes([]);
      setAllQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate quotes created this month
  const getQuotesThisMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return allQuotes.filter(quote => {
      if (!quote.created_at) return false;
      const quoteDate = new Date(quote.created_at);
      return quoteDate.getMonth() === currentMonth && quoteDate.getFullYear() === currentYear;
    });
  };

  // Calculate month-over-month change
  const getMonthOverMonthChange = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const thisMonthQuotes = getQuotesThisMonth().length;
    const lastMonthQuotes = allQuotes.filter(quote => {
      if (!quote.created_at) return false;
      const quoteDate = new Date(quote.created_at);
      return quoteDate >= lastMonth && quoteDate <= lastMonthEnd;
    }).length;
    
    if (lastMonthQuotes === 0) return thisMonthQuotes > 0 ? '+100%' : '0%';
    const change = ((thisMonthQuotes - lastMonthQuotes) / lastMonthQuotes) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
  };

  const handleEditQuote = (quoteId: string) => {
    navigate(`/quote-builder?edit=${quoteId}`);
  };

  const handleDeleteQuote = (quoteId: string, quoteName: string) => {
    setQuoteToDelete({ id: quoteId, name: quoteName });
    setDeleteDialogOpen(true);
  };

  const clearSearch = () => {
    setSearchTerm("");
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

  const filteredQuotes = allQuotes.filter(quote => 
    quote.quote_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedQuotes = showAllQuotes ? filteredQuotes : recentQuotes.filter(quote => 
    quote.quote_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Search results count
  const searchResultsCount = showAllQuotes ? filteredQuotes.length : 
    recentQuotes.filter(quote => 
      quote.quote_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    ).length;
  const stats = [
    {
      title: "Active Clients",
      value: "24",
      change: "+12%",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Quotes This Month",
      value: getQuotesThisMonth().length.toString(),
      change: getMonthOverMonthChange(),
      icon: FileText,
      color: "text-accent",
    },
    {
      title: "Revenue Pipeline",
      value: "$245K",
      change: "+24%",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Conversion Rate",
      value: "68%",
      change: "+5%",
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your pricing overview.
            </p>
          </div>
          <Link to="/quote-builder">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              New Quote
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-success mt-1">
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Recent Quotes</CardTitle>
              <CardDescription>Your most recent quote activities</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading quotes...</div>
              ) : recentQuotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No quotes yet. Create your first quote!</p>
                  <Link to="/quote-builder" className="mt-4 inline-block">
                    <Button size="sm">Create Quote</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentQuotes.map((quote) => (
                    <Link key={quote.id} to={`/quotes/${quote.id}`} className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{quote.quote_name}</div>
                          <div className="text-sm text-muted-foreground">{quote.client_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {quote.commitment_years} year{quote.commitment_years > 1 ? 's' : ''} • {quote.currency}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">
                            {formatCurrencyValue(quote.final_total, quote.currency)}
                          </div>
                          <div className="flex gap-1 mt-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                handleEditQuote(quote.id!);
                              }}
                              className="h-8 w-8 p-0"
                              title="Edit quote"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteQuote(quote.id!, quote.quote_name);
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Delete quote"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>View All Quotes</CardTitle>
              <CardDescription>Search and manage all your quotes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search quotes by name or client..."
                      className="w-full pl-10 pr-10 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant={showAllQuotes ? "default" : "outline"}
                    onClick={() => setShowAllQuotes(!showAllQuotes)}
                  >
                    {showAllQuotes ? "Show Recent" : "Show All"}
                  </Button>
                </div>

                {searchTerm && (
                  <div className="text-sm text-muted-foreground">
                    {searchResultsCount} quote{searchResultsCount !== 1 ? 's' : ''} found matching "{searchTerm}"
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : displayedQuotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No quotes found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {displayedQuotes.map((quote) => (
                      <Link key={quote.id} to={`/quotes/${quote.id}`} className="block">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{quote.quote_name}</div>
                            <div className="text-sm text-muted-foreground">{quote.client_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {quote.commitment_years} year{quote.commitment_years > 1 ? 's' : ''} • {quote.currency} • 
                              Created: {new Date(quote.created_at!).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-foreground">
                              {formatCurrencyValue(quote.final_total, quote.currency)}
                            </div>
                            <div className="flex gap-1 mt-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleEditQuote(quote.id!);
                                }}
                                className="h-8 w-8 p-0"
                                title="Edit quote"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteQuote(quote.id!, quote.quote_name);
                                }}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                title="Delete quote"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/quote-builder">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Create New Quote
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={loadQuotes}>
              <FileText className="h-4 w-4" />
              Refresh Quotes
            </Button>
          </CardContent>
        </Card>
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
    </Layout>
  );
};

export default Dashboard;
