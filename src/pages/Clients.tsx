import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const mockClients = [
    {
      id: "1",
      name: "City Museum",
      contactPerson: "John Smith",
      email: "john@citymuseum.com",
      phone: "+1 234 567 8900",
      quotesCount: 5,
    },
    {
      id: "2",
      name: "Tech Corp",
      contactPerson: "Sarah Johnson",
      email: "sarah@techcorp.com",
      phone: "+1 234 567 8901",
      quotesCount: 8,
    },
    {
      id: "3",
      name: "Retail Plaza",
      contactPerson: "Mike Brown",
      email: "mike@retailplaza.com",
      phone: "+1 234 567 8902",
      quotesCount: 3,
    },
  ];

  const filteredClients = mockClients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your client relationships</p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="border-border hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <CardDescription>{client.contactPerson}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {client.quotesCount} quotes created
                  </p>
                </div>
                <Link to={`/clients/${client.id}`}>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Clients;
