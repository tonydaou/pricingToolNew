import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Quotes = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const mockQuotes = [
    {
      id: "Q-2025-001",
      clientName: "City Museum",
      mainAsset: "Municipality",
      createdAt: "2025-01-15",
      createdBy: "John Doe",
      lineItemsCount: 3,
      grandTotal: 45230.5,
    },
    {
      id: "Q-2025-002",
      clientName: "Tech Corp",
      mainAsset: "Large Enterprise",
      createdAt: "2025-01-14",
      createdBy: "Sarah Smith",
      lineItemsCount: 5,
      grandTotal: 87500.0,
    },
    {
      id: "Q-2025-003",
      clientName: "Retail Plaza",
      mainAsset: "Commercial Portfolio Owner",
      createdAt: "2025-01-13",
      createdBy: "Mike Johnson",
      lineItemsCount: 2,
      grandTotal: 32100.25,
    },
  ];

  const filteredQuotes = mockQuotes.filter(
    (quote) =>
      quote.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quotes</h1>
            <p className="text-muted-foreground mt-1">View and manage all pricing quotes</p>
          </div>
          <Link to="/quotes/new">
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
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} className="border-border hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{quote.id}</CardTitle>
                  </div>
                  <CardDescription className="text-base">{quote.clientName}</CardDescription>
                </div>
                <Link to={`/quotes/${quote.id}`}>
                  <Button variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
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
                    <p className="text-sm text-muted-foreground">Line Items</p>
                    <p className="font-medium text-foreground">{quote.lineItemsCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-lg font-bold text-primary">
                      ${quote.grandTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Quotes;
