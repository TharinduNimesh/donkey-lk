import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Analytics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1,234</p>
            <p className="text-sm text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        {/* Earnings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$2,345</p>
            <p className="text-sm text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        {/* Projects Card */}
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">12</p>
            <p className="text-sm text-muted-foreground">2 pending approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div>
                  <p className="font-medium">Project Updated</p>
                  <p className="text-sm text-muted-foreground">Changes were made to Project ABC</p>
                </div>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}