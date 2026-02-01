import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Building2, Calendar, FileText } from "lucide-react";
import { useParams, Link } from "react-router-dom";

const ClientDetail = () => {
  const { id } = useParams();

  // Mock data - in real app this would fetch from API/database
  const client = {
    id: id || "1",
    name: "City Museum",
    contactPerson: "John Smith",
    email: "john@citymuseum.com",
    phone: "+1 234 567 8900",
    address: "123 Museum Avenue, New York, NY 10001",
    createdAt: "2024-01-15",
    notes: "Premium client with ongoing projects",
    quotes: [
      {
        id: "Q-2025-001",
        createdAt: "2025-01-15",
        status: "Sent",
        total: 45230.5,
      },
      {
        id: "Q-2025-002",
        createdAt: "2025-01-10",
        status: "Accepted",
        total: 32100.0,
      },
      {
        id: "Q-2024-045",
        createdAt: "2024-12-20",
        status: "Draft",
        total: 28500.0,
      },
    ],
  };

  const totalQuotesValue = client.quotes.reduce((sum, q) => sum + q.total, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/clients">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
              </div>
              <p className="text-muted-foreground mt-1">{client.contactPerson}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Edit Client</Button>
            <Link to="/quotes/new">
              <Button>Create Quote</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground">{client.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Client Since</p>
                  <p className="font-medium text-foreground">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Quotes</p>
                <p className="text-2xl font-bold text-foreground">{client.quotes.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-primary">
                  ${Math.round(totalQuotesValue).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium text-foreground">{client.notes}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quote History</CardTitle>
              <Link to="/quotes/new">
                <Button size="sm" variant="outline">New Quote</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {client.quotes.map((quote) => (
                <Link key={quote.id} to={`/quotes/${quote.id}`}>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{quote.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          quote.status === "Accepted"
                            ? "bg-green-100 text-green-700"
                            : quote.status === "Sent"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {quote.status}
                      </span>
                      <p className="text-lg font-bold text-foreground">
                        ${Math.round(quote.total).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClientDetail;
