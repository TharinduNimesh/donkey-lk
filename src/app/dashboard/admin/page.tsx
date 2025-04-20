"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type TaskDetail = Database['public']['Views']['task_details']['Row'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBuyers: 0,
    totalInfluencers: 0,
    activeTasks: 0,
    totalCampaignTasks: 0,
    totalRevenue: 0,
    totalMonthlyRevenue: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data, error } = await supabase.rpc('get_dashboard_data');
        if (error) throw error;

        if (data && data.length > 0) {
          const dashboardData = data[0];
          setStats({
            totalBuyers: dashboardData.total_buyers,
            totalInfluencers: dashboardData.total_influencers,
            activeTasks: dashboardData.active_tasks,
            totalCampaignTasks: dashboardData.total_campaign_tasks,
            totalRevenue: dashboardData.total_revenue,
            totalMonthlyRevenue: dashboardData.total_monthly_revenue,
            pendingPayments: dashboardData.pending_payments
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [supabase]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // Verify admin role
      const { data: profile } = await supabase
        .from('profile')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile?.role.includes('ADMIN')) {
        router.push('/dashboard');
        return;
      }
    };

    checkAdminAccess();
  }, [supabase, router]);

  const handleLogout = async () => {
    setIsLoading(true);
    const { error } = await signOut();
    if (!error) {
      router.push('/auth');
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Buyers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalBuyers}</p>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground">Influencers: {stats.totalInfluencers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeTasks}</p>
            <p className="text-sm text-muted-foreground">Total campaign tasks: {stats.totalCampaignTasks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">Rs. {stats.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Monthly revenue: Rs. {stats.totalMonthlyRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Pending payments: Rs. {stats.pendingPayments.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add more admin features here */}
    </div>
  );
}