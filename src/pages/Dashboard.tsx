import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FileText, TrendingUp, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
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
      value: "18",
      change: "+8%",
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
          <Link to="/quotes/new">
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
              <CardDescription>Your latest pricing quotes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">Client Name {i}</p>
                      <p className="text-sm text-muted-foreground">2 days ago</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">${(i * 25000).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{i + 2} line items</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/quotes">
                <Button variant="outline" className="w-full mt-4">
                  View All Quotes
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/quotes/new">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Quote
                </Button>
              </Link>
              <Link to="/clients">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Manage Clients
                </Button>
              </Link>
              <Link to="/quotes">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  View All Quotes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
