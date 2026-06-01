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
const PINK = "#C8185A";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Overview</h1>
        <p className="text-xs text-gray-500">Monitor platform users, campaigns, and overall business revenues.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Users */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: PINK }} />
          <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#fff0f6' }}>
            <svg className="h-4 w-4" style={{ color: PINK }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Registered Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{(stats.totalBuyers + stats.totalInfluencers).toLocaleString()}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>Buyers: <strong className="text-gray-700 font-medium">{stats.totalBuyers}</strong></span>
            <span>•</span>
            <span>Influencers: <strong className="text-gray-700 font-medium">{stats.totalInfluencers}</strong></span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-[0.03]" style={{ background: PINK }} />
        </div>

        {/* Active Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
          <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
            <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">Active Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeTasks}</p>
          <p className="text-xs text-gray-400 mt-2">Total tasks in system: <strong className="text-gray-700 font-medium">{stats.totalCampaignTasks}</strong></p>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-[0.03] bg-blue-500" />
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
            <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Platform Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">Rs. {stats.totalRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>Monthly: <strong className="text-gray-700 font-medium">Rs. {stats.totalMonthlyRevenue.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Pending: <strong className="text-gray-700 font-medium">Rs. {stats.pendingPayments.toLocaleString()}</strong></span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-[0.03] bg-emerald-500" />
        </div>
      </div>

      {/* Buyers Section */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Registered Buyers</h2>
          <p className="text-xs text-gray-400">Monitor registered buyers, campaigns, and transaction balances.</p>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Name</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Email</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Total Tasks</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Total Paid</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Pending Payments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buyers.map((buyer) => (
                <TableRow key={buyer.id} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                  <TableCell className="py-3.5 px-4">
                    <div className="font-semibold text-sm text-gray-800">{buyer.name}</div>
                  </TableCell>
                  <TableCell className="py-3.5 px-4">
                    <div className="text-xs text-gray-500">{buyer.email}</div>
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-xs font-medium text-gray-700">{buyer.totalTasks}</TableCell>
                  <TableCell className="py-3.5 px-4 text-xs font-semibold text-emerald-600">Rs. {buyer.totalPaid.toLocaleString()}</TableCell>
                  <TableCell className="py-3.5 px-4 text-xs font-semibold text-amber-600">Rs. {buyer.totalPending.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {buyers.length > 0 ? (
            <PaginationControls 
              currentPage={currentBuyersPage}
              totalPages={totalBuyersPages}
              onPageChange={setCurrentBuyersPage}
            />
          ) : (
            <div className="text-center text-gray-400 py-10 text-sm">
              No buyers found
            </div>
          )}
        </div>
      </section>

      {/* Influencers Section */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Registered Influencers</h2>
          <p className="text-xs text-gray-400">Track influencer statistics, verifications, and platforms.</p>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Name</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Email</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Verified Channels</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Completed Tasks</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Total Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {influencers.map((influencer) => (
                <TableRow key={influencer.id} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                  <TableCell className="py-3.5 px-4">
                    <div className="font-semibold text-sm text-gray-800">{influencer.name}</div>
                  </TableCell>
                  <TableCell className="py-3.5 px-4">
                    <div className="text-xs text-gray-500">{influencer.email}</div>
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-xs font-medium text-gray-700">{influencer.verifiedProfiles}</TableCell>
                  <TableCell className="py-3.5 px-4 text-xs font-medium text-gray-700">{influencer.completedTasks}</TableCell>
                  <TableCell className="py-3.5 px-4 text-xs font-semibold text-emerald-600">Rs. {influencer.totalEarnings.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {influencers.length > 0 ? (
            <PaginationControls 
              currentPage={currentInfluencersPage}
              totalPages={totalInfluencersPages}
              onPageChange={setCurrentInfluencersPage}
            />
          ) : (
            <div className="text-center text-gray-400 py-10 text-sm">
              No influencers found
            </div>
          )}
        </div>
      </section>
    </div>
  );
}