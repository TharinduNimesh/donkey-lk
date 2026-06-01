"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { BuyerSidebar, BuyerTopbar } from "@/components/dashboard/buyer-sidebar";
import { 
  TrendingUp, 
  MousePointerClick, 
  DollarSign, 
  Video,
  Calendar,
  BarChart2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const PINK = "#C8185A";
const PURPLE = "#7C3AED";
const CYAN = "#06B6D4";

type BrandSyncLinkEntry = {
  id: number;
  title: string;
  platform: string;
  shares: number;
  clicks: number;
  amount: number;
  createdAt: string;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  
  const [links, setLinks] = useState<BrandSyncLinkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const fetchRealData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth");
          return;
        }

        const response = await fetch("/api/brandsync-links", { credentials: "include" });
        const data = await response.json();
        if (response.ok) {
          // Filter to show only paid links in analytics
          const paidLinks = (data.links || []).filter((l: any) => l.isPaid);
          setLinks(paidLinks);
        }
      } catch (error) {
        console.error("Error fetching real analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealData();
  }, [supabase, router]);

  // 1. Calculate main KPIs
  const totalCampaigns = links.length;
  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const totalBudgetSpent = links.reduce((sum, l) => sum + (l.amount || 0), 0);
  
  // Calculate average completion rate
  const avgCompletion = totalCampaigns > 0 
    ? Math.round((links.reduce((sum, l) => sum + Math.min(100, (l.clicks / l.shares) * 100), 0) / totalCampaigns))
    : 0;

  // 2. Format bar chart data (Campaign target vs actual clicks)
  // Limit to most recent 6 campaigns for optimal chart readability
  const campaignPerformanceData = [...links]
    .reverse()
    .slice(-6)
    .map(l => ({
      name: l.title.length > 15 ? l.title.substring(0, 12) + "..." : l.title,
      target: l.shares || 100,
      clicks: l.clicks || 0
    }));

  // 3. Format pie chart data (Platform distribution)
  const ytClicks = links.filter(l => l.platform === "YOUTUBE").reduce((sum, l) => sum + (l.clicks || 0), 0);
  const ttClicks = links.filter(l => l.platform === "TIKTOK").reduce((sum, l) => sum + (l.clicks || 0), 0);
  const fbClicks = links.filter(l => l.platform === "FACEBOOK").reduce((sum, l) => sum + (l.clicks || 0), 0);
  
  const platformDistributionData = [
    { name: "YouTube", value: ytClicks, color: PINK },
    { name: "TikTok", value: ttClicks, color: PURPLE },
    { name: "Facebook", value: fbClicks, color: CYAN },
  ].filter(p => p.value > 0); // Only show platforms with actual clicks

  // Default fallback if no platform clicks exist yet
  const displayPlatformData = platformDistributionData.length > 0 
    ? platformDistributionData 
    : [
        { name: "YouTube", value: 1, color: "#e5e7eb" },
        { name: "TikTok", value: 0, color: PURPLE },
        { name: "Facebook", value: 0, color: CYAN }
      ];

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <BuyerSidebar activePage="analytics" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <BuyerTopbar title="Analytics" />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Campaign Analytics</h1>
              <p className="text-xs text-gray-400 mt-0.5">Real-time performance analytics of your BrandSync promotion campaigns.</p>
            </div>
            
            {/* Date filter placeholder */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm text-xs font-semibold text-gray-600">
              <Calendar className="h-3.5 w-3.5" style={{ color: PINK }} />
              <span>Real-Time Database Sync</span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-80 bg-white border border-gray-100 rounded-xl animate-pulse" />
                <div className="h-80 bg-white border border-gray-100 rounded-xl animate-pulse" />
              </div>
            </div>
          ) : links.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-dashed border-gray-200">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mb-4">
                <BarChart2 className="h-8 w-8 text-[#C8185A]" />
              </div>
              <p className="text-base font-semibold text-gray-700">No active campaigns to analyze</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Activate a BrandSync link with payment first to start tracking live visitor reach, progress, and traffic metrics here!
              </p>
              <button 
                onClick={() => router.push("/dashboard/buyer/brandsync")}
                className="mt-6 px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                style={{ background: PINK }}
              >
                Create Campaign Link
              </button>
            </div>
          ) : (
            <>
              {/* Stats Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    label: "Active Campaigns", 
                    value: `${totalCampaigns} Live`, 
                    desc: "Currently receiving visitor clicks", 
                    icon: Video, 
                    color: PINK, 
                    bg: "linear-gradient(135deg, #fff0f6, #ffe4ef)" 
                  },
                  { 
                    label: "Total Clicks (Reach)", 
                    value: `${totalClicks.toLocaleString()} Clicks`, 
                    desc: `${avgCompletion}% average completion`, 
                    icon: MousePointerClick, 
                    color: PURPLE, 
                    bg: "linear-gradient(135deg, #f5f3ff, #ede9fe)" 
                  },
                  { 
                    label: "Total Budget Spent", 
                    value: `LKR ${totalBudgetSpent.toLocaleString()}`, 
                    desc: "Rs.6 per unique click", 
                    icon: DollarSign, 
                    color: "#16a34a", 
                    bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)" 
                  },
                  { 
                    label: "Traffic Growth", 
                    value: "Active", 
                    desc: "Based on real-time viewer logs", 
                    icon: TrendingUp, 
                    color: CYAN, 
                    bg: "linear-gradient(135deg, #ecfeff, #cffafe)" 
                  },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute right-0 bottom-0 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform" style={{ background: stat.color }} />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                          <Icon className="h-4 w-4" style={{ color: stat.color }} />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{stat.value}</h3>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">{stat.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Bar Chart */}
                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Campaign Clicks Progress</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">Target shares versus actual unique visitor clicks generated.</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-semibold">
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-gray-200" />
                        <span className="text-gray-500">Target Shares</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PINK }} />
                        <span className="text-gray-500">Actual Clicks</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-72 w-full">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={campaignPerformanceData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          barGap={4}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} 
                            labelStyle={{ fontWeight: 'bold', fontSize: 11, color: '#111827' }}
                          />
                          <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} maxBarSize={30} />
                          <Bar dataKey="clicks" fill={PINK} radius={[4, 4, 0, 0]} maxBarSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full bg-gray-50 rounded-lg animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Platform Pie Chart */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col">
                  <div className="mb-4">
                    <h2 className="text-sm font-bold text-gray-900">Clicks by Social Platform</h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Which platforms drive the most visitor traffic.</p>
                  </div>

                  <div className="h-56 w-full relative flex-1 flex items-center justify-center">
                    {mounted ? (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={displayPlatformData}
                              innerRadius={65}
                              outerRadius={85}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {displayPlatformData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} 
                              labelStyle={{ fontWeight: 'bold', fontSize: 11, color: '#111827' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Centered stat */}
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Traffic</span>
                          <span className="text-xl font-bold text-gray-900 mt-0.5">{totalClicks}</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-50 rounded-lg animate-pulse" />
                    )}
                  </div>

                  {/* Legends */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-50">
                    {(platformDistributionData.length > 0 ? platformDistributionData : [
                      { name: "YouTube", value: 0, color: PINK },
                      { name: "TikTok", value: 0, color: PURPLE },
                      { name: "Facebook", value: 0, color: CYAN }
                    ]).map((p) => (
                      <div key={p.name} className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                          <span className="text-[10px] font-bold text-gray-700">{p.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-400 mt-0.5">
                          {totalClicks > 0 ? ((p.value / totalClicks) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Campaigns Performance Table */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-sm font-bold text-gray-900">Campaign Performance Breakdown</h2>
                  <p className="text-[10px] text-gray-400 mt-0.5">Granular performance statistics of recent campaigns.</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/20">
                        <th className="px-6 py-3">Campaign Details</th>
                        <th className="px-6 py-3">Platform</th>
                        <th className="px-6 py-3">Shares Target</th>
                        <th className="px-6 py-3">Actual Clicks</th>
                        <th className="px-6 py-3">Spend Amount</th>
                        <th className="px-6 py-3">Completion</th>
                        <th className="px-6 py-3">Creation Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
                      {links.map((c) => {
                        const pct = Math.min(100, Math.round((c.clicks / c.shares) * 100));
                        return (
                          <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-gray-900">{c.title}</td>
                            <td className="px-6 py-4">
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                                style={c.platform === "YOUTUBE" 
                                  ? { background: "#fff0f6", color: PINK }
                                  : c.platform === "TIKTOK"
                                  ? { background: "#f5f3ff", color: PURPLE }
                                  : { background: "#ecfeff", color: CYAN }
                                }
                              >
                                {c.platform}
                              </span>
                            </td>
                            <td className="px-6 py-4">{c.shares} shares</td>
                            <td className="px-6 py-4 font-semibold text-gray-800">{c.clicks}</td>
                            <td className="px-6 py-4">LKR {c.amount.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#16a34a" : PINK }} />
                                </div>
                                <span className="font-semibold text-gray-700 text-[10px]">{pct}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-400">
                              {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
