"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { signOut } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const ITEMS_PER_PAGE = 10;

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
  const [buyers, setBuyers] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [currentBuyersPage, setCurrentBuyersPage] = useState(1);
  const [currentInfluencersPage, setCurrentInfluencersPage] = useState(1);
  const [totalBuyers, setTotalBuyers] = useState(0);
  const [totalInfluencers, setTotalInfluencers] = useState(0);

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
    const fetchUsersData = async () => {
      // Fetch buyers data with pagination
      const { data: buyersData, count: buyersCount, error: buyersError } = await supabase
        .from('profile')
        .select(`
          id,
          name,
          email,
          tasks:tasks(
            id,
            task_cost(amount, is_paid)
          )
        `, { count: 'exact' })
        .contains('role', ['BUYER'])
        .range((currentBuyersPage - 1) * ITEMS_PER_PAGE, currentBuyersPage * ITEMS_PER_PAGE - 1);

      if (!buyersError && buyersData) {
        const processedBuyersData = buyersData.map(buyer => {
          const totalPaid = buyer.tasks?.reduce((sum: number, task: any) => 
            sum + (task.task_cost?.is_paid ? task.task_cost.amount : 0), 0) || 0;
          const totalPending = buyer.tasks?.reduce((sum: number, task: any) => 
            sum + (!task.task_cost?.is_paid ? task.task_cost?.amount : 0), 0) || 0;
          
          return {
            ...buyer,
            totalPaid,
            totalPending,
            totalTasks: buyer.tasks?.length || 0
          };
        });
        setBuyers(processedBuyersData);
        setTotalBuyers(buyersCount || 0);
      }

      // Fetch influencers data with pagination
      const { data: influencersData, count: influencersCount, error: influencersError } = await supabase
        .from('profile')
        .select(`
          id,
          name,
          email,
          influencer_profile(count),
          task_applications(
            id,
            task_id,
            application_proofs(
              proof_status(status)
            )
          ),
          account_balance(
            total_earning
          )
        `, { count: 'exact' })
        .contains('role', ['INFLUENCER'])
        .range((currentInfluencersPage - 1) * ITEMS_PER_PAGE, currentInfluencersPage * ITEMS_PER_PAGE - 1);

      if (!influencersError && influencersData) {
        const processedInfluencersData = influencersData.map(influencer => {
          const verifiedProfiles = influencer.influencer_profile?.length || 0;
          const completedTasks = influencer.task_applications?.filter((app: any) => 
            app.application_proofs?.some((proof: any) => 
              proof.proof_status?.status === 'ACCEPTED'
            )
          ).length || 0;
          const totalEarnings = influencer.account_balance?.total_earning || 0;
          
          return {
            ...influencer,
            verifiedProfiles,
            completedTasks,
            totalEarnings
          };
        });
        setInfluencers(processedInfluencersData);
        setTotalInfluencers(influencersCount || 0);
      }
    };

    fetchUsersData();
  }, [supabase, currentBuyersPage, currentInfluencersPage]);

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

  // Pagination helpers
  const totalBuyersPages = Math.ceil(totalBuyers / ITEMS_PER_PAGE);
  const totalInfluencersPages = Math.ceil(totalInfluencers / ITEMS_PER_PAGE);

  const PaginationControls = ({ currentPage, totalPages, onPageChange }: { 
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-sm">
        Page {currentPage} of {totalPages}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );

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

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Buyers</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Tasks</TableHead>
                  <TableHead>Total Paid (Rs.)</TableHead>
                  <TableHead>Pending Payment (Rs.)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyers.map((buyer) => (
                  <TableRow key={buyer.id}>
                    <TableCell>{buyer.name}</TableCell>
                    <TableCell>{buyer.email}</TableCell>
                    <TableCell>{buyer.totalTasks}</TableCell>
                    <TableCell>{buyer.totalPaid.toLocaleString()}</TableCell>
                    <TableCell>{buyer.totalPending.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls 
              currentPage={currentBuyersPage}
              totalPages={totalBuyersPages}
              onPageChange={setCurrentBuyersPage}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Influencers</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Verified Profiles</TableHead>
                  <TableHead>Completed Tasks</TableHead>
                  <TableHead>Total Earnings (Rs.)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {influencers.map((influencer) => (
                  <TableRow key={influencer.id}>
                    <TableCell>{influencer.name}</TableCell>
                    <TableCell>{influencer.email}</TableCell>
                    <TableCell>{influencer.verifiedProfiles}</TableCell>
                    <TableCell>{influencer.completedTasks}</TableCell>
                    <TableCell>{influencer.totalEarnings.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls 
              currentPage={currentInfluencersPage}
              totalPages={totalInfluencersPages}
              onPageChange={setCurrentInfluencersPage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}