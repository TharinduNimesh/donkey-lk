"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { InfluencerSidebar, InfluencerTopbar } from "@/components/dashboard/influencer-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  TrendingUp, 
  MousePointerClick, 
  Calendar, 
  ExternalLink,
  ArrowRight,
  RefreshCcw,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

const PINK = "#C8185A";

type AccountBalance = Database["public"]["Tables"]["account_balance"]["Row"];
type BrandSyncLinkEntry = {
  id: number;
  title: string;
  platform: Database["public"]["Enums"]["Platforms"];
  brandSyncUrl: string;
  createdAt: string;
  uniqueUrl?: string | null;
  clicks?: number;
  myClicks?: number;
  shares?: number;
};
type WithdrawalRequest = Database["public"]["Tables"]["withdrawal_requests"]["Row"] & {
  withdrawal_request_status?: Database["public"]["Tables"]["withdrawal_request_status"]["Row"][];
};
type EarnedTask = {
  id: string;
  title: string;
  platform: Database["public"]["Enums"]["Platforms"];
  earnedAmount: number;
  completedAt: string;
};

export default function EarningsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null);
  const [brandSyncLinks, setBrandSyncLinks] = useState<BrandSyncLinkEntry[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [earnedTasks, setEarnedTasks] = useState<EarnedTask[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const LKR_PER_USD = Number(process.env.NEXT_PUBLIC_LKR_PER_USD ?? "340");

  const formatUSD = (lkrAmount: number) => {
    const usd = lkrAmount / LKR_PER_USD;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(usd);
  };

  const formatLKR = (lkrAmount: number) => {
    return `LKR ${lkrAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchData = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      // Fetch balance, links, withdrawals, and task applications in parallel
      const [balanceResponse, linksResponse, withdrawalsResponse, appsResponse] = await Promise.all([
        supabase.from("account_balance").select("*").eq("user_id", user.id).maybeSingle(),
        fetch("/api/brandsync-links?scope=public").then(res => res.ok ? res.json() : { links: [] }),
        fetch("/api/withdrawals").then(res => res.ok ? res.json() : { data: [] }),
        supabase.from("task_applications").select(`
          id,
          created_at,
          is_cancelled,
          task_details (
            title
          ),
          application_promises (
            platform,
            est_profit
          ),
          application_proofs (
            platform,
            proof_type,
            proof_status (
              status,
              reviewed_at
            )
          )
        `).eq("user_id", user.id)
      ]);

      if (balanceResponse.data) {
        setAccountBalance(balanceResponse.data);
      }

      // Retrieve unique URLs and tokens for user clicks
      const rawLinks: BrandSyncLinkEntry[] = linksResponse.links || [];
      const linksWithTokens = await Promise.all(
        rawLinks.map(async (link) => {
          try {
            const tokenResp = await fetch(`/api/brandsync-links/${link.id}/influencer-token`, { credentials: 'include' });
            if (tokenResp.ok) {
              const tokenData = await tokenResp.json();
              return { ...link, uniqueUrl: tokenData.uniqueUrl };
            }
          } catch {}
          return { ...link, uniqueUrl: link.brandSyncUrl };
        })
      );
      setBrandSyncLinks(linksWithTokens);

      setWithdrawalRequests(withdrawalsResponse.data || []);

      // Process task applications to find earned tasks (both URL & IMAGE proofs are ACCEPTED)
      const rawApps = (appsResponse.data || []) as any[];
      const processedTasks: EarnedTask[] = [];

      rawApps.forEach((app) => {
        if (app.is_cancelled) return;
        
        const taskObj = Array.isArray(app.task_details) ? app.task_details[0] : app.task_details;
        const taskTitle = taskObj?.title || "Campaign Task";
        
        const promises = app.application_promises || [];
        const proofs = app.application_proofs || [];

        promises.forEach((promise: any) => {
          const platform = promise.platform;
          const platformProofs = proofs.filter((p: any) => p.platform === platform);
          
          const getProofStatus = (proof: any) => {
            const s = proof.proof_status;
            if (!s) return null;
            return Array.isArray(s) ? s[0]?.status : s?.status;
          };
          
          const getReviewedAt = (proof: any) => {
            const s = proof.proof_status;
            if (!s) return null;
            return Array.isArray(s) ? s[0]?.reviewed_at : s?.reviewed_at;
          };

          const isUrlAccepted = platformProofs.some((p: any) => p.proof_type === "URL" && getProofStatus(p) === "ACCEPTED");
          const isImageAccepted = platformProofs.some((p: any) => p.proof_type === "IMAGE" && getProofStatus(p) === "ACCEPTED");

          if (isUrlAccepted && isImageAccepted) {
            const acceptedProofs = platformProofs.filter((p: any) => getProofStatus(p) === "ACCEPTED");
            const verifiedTimes = acceptedProofs.map((p: any) => getReviewedAt(p)).filter(Boolean);
            const completedAt = verifiedTimes.length > 0 
              ? new Date(Math.max(...verifiedTimes.map((t: string) => new Date(t).getTime()))).toISOString()
              : app.created_at;

            processedTasks.push({
              id: `${app.id}-${platform}`,
              title: taskTitle,
              platform,
              earnedAmount: parseFloat(promise.est_profit || "0"),
              completedAt
            });
          }
        });
      });
      setEarnedTasks(processedTasks);

      if (showToast) {
        toast.success("Earnings data refreshed successfully!");
      }
    } catch (error) {
      console.error("Error fetching earnings data:", error);
      toast.error("Failed to load earnings details");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase, router]);

  const totalClicks = brandSyncLinks.reduce((sum, link) => sum + (link.myClicks || 0), 0);
  const totalMilestones = brandSyncLinks.reduce((sum, link) => sum + Math.floor((link.myClicks || 0) / 10), 0);
  const nextMilestoneClicks = (totalMilestones + 1) * 10;
  const progressToNextMilestone = brandSyncLinks.length > 0
    ? Math.max(...brandSyncLinks.map(link => (link.myClicks || 0) % 10))
    : 0;

  // Only display BrandSync links that have at least one click (clicks > 0)
  const earnedLinks = brandSyncLinks.filter(link => (link.myClicks || 0) > 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200">Completed</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200">Rejected</Badge>;
      case "PENDING":
      default:
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200">Pending</Badge>;
    }
  };

  const renderSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="h-32 border border-gray-100 bg-white" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 h-96 border border-gray-100 bg-white" />
        <Card className="h-96 border border-gray-100 bg-white" />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <InfluencerSidebar activePage="earnings" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <InfluencerTopbar 
          title="My Earnings" 
          actions={
            <Button
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={() => fetchData(true)}
              className="h-9 border border-gray-200 bg-white text-gray-650 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <RefreshCcw className={`h-4 w-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {isLoading ? (
            renderSkeleton()
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Available Balance */}
                <Card className="overflow-hidden border border-gray-100 bg-white shadow-xs relative">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Available Balance</CardTitle>
                      <CardDescription className="text-xs">Withdrawable balance</CardDescription>
                    </div>
                    <div className="bg-pink-50 p-2.5 rounded-xl">
                      <Wallet className="h-5 w-5" style={{ color: PINK }} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-gray-900">{formatUSD(accountBalance?.balance || 0)}</div>
                    <div className="text-sm font-semibold text-pink-600 mt-1">{formatLKR(accountBalance?.balance || 0)}</div>
                    <div className="mt-4">
                      <Button 
                        onClick={() => router.push("/withdraw")}
                        className="w-full text-xs font-bold uppercase tracking-wider h-8 text-white shadow-xs transition-transform duration-200 active:scale-95"
                        style={{ background: PINK }}
                      >
                        Withdraw Funds
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
 
                {/* Lifetime Earnings */}
                <Card className="overflow-hidden border border-gray-100 bg-white shadow-xs relative">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Lifetime Earnings</CardTitle>
                      <CardDescription className="text-xs">Cumulative historical earnings</CardDescription>
                    </div>
                    <div className="bg-blue-50 p-2.5 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-end h-[100px]">
                    <div className="text-3xl font-extrabold text-gray-900">{formatUSD(accountBalance?.total_earning || 0)}</div>
                    <div className="text-sm font-semibold text-blue-600 mt-1">{formatLKR(accountBalance?.total_earning || 0)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detail Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Link Performance Details */}
                <Card className="lg:col-span-2 border border-gray-100 bg-white shadow-xs flex flex-col">
                  <CardHeader className="border-b border-gray-50 pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">Campaigns Breakdown</CardTitle>
                    <CardDescription className="text-xs">Clicks performance and rewards earned per proxy link or task</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 flex flex-col">
                    <Tabs defaultValue="links" className="w-full flex flex-col flex-1">
                      <div className="px-5 pt-3 pb-2 border-b border-gray-100 bg-gray-50/30">
                        <TabsList className="grid w-full max-w-[240px] grid-cols-2">
                          <TabsTrigger value="links" className="text-xs">Proxy Links</TabsTrigger>
                          <TabsTrigger value="tasks" className="text-xs">Completed Tasks</TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="links" className="m-0 flex-1 overflow-x-auto">
                        {earnedLinks.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <th className="py-3 px-5">Campaign Link</th>
                                <th className="py-3 px-4 text-center">My Clicks</th>
                                <th className="py-3 px-4 text-right">Milestone Earnings</th>
                                <th className="py-3 px-5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                              {earnedLinks.map((link) => {
                                const milestoneCount = Math.floor((link.myClicks || 0) / 10);
                                const rewardLKR = milestoneCount * 0.01 * LKR_PER_USD;
                                return (
                                  <tr key={link.id} className="hover:bg-gray-50/40 transition-colors">
                                    <td className="py-3.5 px-5 max-w-[200px]">
                                      <p className="font-bold text-gray-800 truncate">{link.title}</p>
                                      <Badge className="mt-1 text-[8px] font-bold uppercase tracking-wider text-white" style={{ background: link.platform === "YOUTUBE" ? "#ef4444" : link.platform === "FACEBOOK" ? "#3b82f6" : "#000" }}>
                                        {link.platform}
                                      </Badge>
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-semibold text-gray-700">
                                      {link.myClicks || 0}
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                      <p className="font-bold text-emerald-600">{formatLKR(rewardLKR)}</p>
                                      <p className="text-[10px] text-gray-400 font-semibold">{milestoneCount} x $0.01 milestone(s)</p>
                                    </td>
                                    <td className="py-3.5 px-5 text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        asChild
                                        className="h-8 text-pink-650 hover:text-pink-700 hover:bg-pink-50"
                                      >
                                        <a href={link.uniqueUrl || link.brandSyncUrl} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-16 text-gray-400 flex flex-col items-center justify-center">
                            <MousePointerClick className="h-10 w-10 text-gray-250 mb-2" />
                            <p className="font-semibold text-sm">No earned proxy links yet</p>
                            <p className="text-xs text-gray-400 mt-1">Get at least 10 clicks on a proxy link to see earnings.</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="tasks" className="m-0 flex-1 overflow-x-auto">
                        {earnedTasks.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <th className="py-3 px-5">Completed Task</th>
                                <th className="py-3 px-4 text-center">Date Completed</th>
                                <th className="py-3 px-4 text-right">Earnings</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                              {earnedTasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-50/40 transition-colors">
                                  <td className="py-3.5 px-5 max-w-[200px]">
                                    <p className="font-bold text-gray-800 truncate">{task.title}</p>
                                    <Badge className="mt-1 text-[8px] font-bold uppercase tracking-wider text-white" style={{ background: task.platform === "YOUTUBE" ? "#ef4444" : task.platform === "FACEBOOK" ? "#3b82f6" : "#000" }}>
                                      {task.platform}
                                    </Badge>
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-semibold text-gray-600">
                                    {new Date(task.completedAt).toLocaleDateString()}
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <p className="font-bold text-emerald-600">{formatLKR(task.earnedAmount)}</p>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-16 text-gray-400 flex flex-col items-center justify-center">
                            <MousePointerClick className="h-10 w-10 text-gray-250 mb-2" />
                            <p className="font-semibold text-sm">No earned tasks yet</p>
                            <p className="text-xs text-gray-400 mt-1">Submit proofs of work for active tasks to earn payouts.</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Withdrawals Log */}
                <Card className="border border-gray-100 bg-white shadow-xs flex flex-col h-full">
                  <CardHeader className="border-b border-gray-50">
                    <CardTitle className="text-base font-semibold text-gray-900">Recent Withdrawals</CardTitle>
                    <CardDescription className="text-xs">History of your bank payouts</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px]">
                    {withdrawalRequests.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {withdrawalRequests.map((req) => (
                          <div key={req.id} className="p-4 hover:bg-gray-50/40 transition-colors flex justify-between items-center text-xs">
                            <div className="space-y-1 pr-2">
                              <p className="font-bold text-gray-800">{formatLKR(req.amount)}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold">
                                <Calendar className="h-3 w-3" />
                                {new Date(req.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(req.withdrawal_request_status?.[0]?.status || "PENDING")}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-400 flex flex-col items-center justify-center h-full">
                        <Wallet className="h-10 w-10 text-gray-250 mb-2" />
                        <p className="font-semibold text-sm">No withdrawals yet</p>
                        <p className="text-xs text-gray-400 mt-1">Payout history will populate here.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
