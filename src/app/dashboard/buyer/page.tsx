"use client"

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { signOut } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Json } from '@/types/database.types';
import {
  LayoutDashboard,
  BarChart2,
  Megaphone,
  Link2,
  ListChecks,
  Settings,
  Bell,
  LogOut,
  MoreVertical,
  ExternalLink,
  Plus,
  ClipboardList,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Menu,
  X,
  Clock,
} from "lucide-react";

type TaskDetail = {
  task_id: number | null;
  title: string | null;
  description: string | null;
  status: Database['public']['Enums']['TaskStatus'] | null;
  created_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  cost: Json | null;
  source: string | null;
  total_influencers: number | null;
  total_promised_views: number | null;
  total_proof_views?: number | null;
  total_target_views: number | null;
  targets: Json | null;
};

type BrandSyncLink = {
  id: number;
  title: string;
  platform: string;
  brandSyncUrl: string;
  platformUrl?: string | null;
  thumbnailUrl?: string | null;
  shares?: number;
  isPaid?: boolean;
  amount?: number;
  clicks?: number;
  paymentStatus?: string | null;
  rejectionCount?: number;
};

const PINK = "#C8185A";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: BarChart2, label: "Analytics", active: false },
  { icon: Megaphone, label: "Campaigns", active: false },
];

export default function BuyerDashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskDetail[]>([]);
  const [brandSyncLinks, setBrandSyncLinks] = useState<BrandSyncLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast.success('🎉 Payment successful! Your BrandSync link is now active.');
      router.replace('/dashboard/buyer');
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setIsLoadingLinks(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      // Fetch Tasks and Links in parallel for better performance
      const [tasksResult, linksResult] = await Promise.all([
        supabase
          .from('task_details_view')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        fetch('/api/brandsync-links', { credentials: 'include' }).then(res => res.ok ? res.json() : { links: [] })
      ]);

      if (!tasksResult.error) setTasks(tasksResult.data || []);
      setBrandSyncLinks(linksResult.links ?? []);
      
      setIsLoading(false);
      setIsLoadingLinks(false);
    };

    fetchData();
  }, [supabase, router]);

  const handleDeleteLink = async (linkId: number) => {
    if (!window.confirm("Are you sure you want to delete this BrandSync link? This will permanently remove all associated clicks and data.")) {
      return;
    }

    try {
      const resp = await fetch(`/api/brandsync-links/${linkId}`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete link");
      }

      toast.success("BrandSync link deleted successfully");
      const linksResp = await fetch('/api/brandsync-links', { credentials: 'include' });
      if (linksResp.ok) {
        const linksResult = await linksResp.json();
        setBrandSyncLinks(linksResult.links ?? []);
      }
    } catch (err) {
      console.error("Delete link error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete link");
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) { router.push('/auth'); router.refresh(); }
  };

  const handleUploadSlipForLink = async (e: React.ChangeEvent<HTMLInputElement>, linkId: number) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('slip', file);
    setUploadProgress(prev => ({ ...prev, [linkId]: 0 }));
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/brandsync-links/${linkId}/bank-transfer`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(prev => ({ ...prev, [linkId]: Math.round((ev.loaded / ev.total) * 100) }));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(fd);
      });
      toast.success('Slip uploaded — admin will verify');
      const updated = await fetch('/api/brandsync-links', { credentials: 'include' });
      if (updated.ok) { const json = await updated.json(); setBrandSyncLinks(json.links ?? []); }
    } catch { toast.error('Failed to upload slip'); }
    finally { setUploadProgress(prev => { const c = { ...prev }; delete c[linkId]; return c; }); }
  };

  // Stats
  const activeTasksCount = tasks.filter(t => t.status === 'ACTIVE').length;
  const totalBudget = tasks.reduce((sum, task) => {
    const cost = task.cost as { amount: number } | null;
    return sum + (cost?.amount || 0);
  }, 0);
  const platformCounts = tasks.reduce((counts, task) => {
    const targets = task.targets as Array<{ platform: Database['public']['Enums']['Platforms'] }> | null;
    targets?.forEach(t => { counts[t.platform] = (counts[t.platform] || 0) + 1; });
    return counts;
  }, {} as Record<string, number>);
  const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];
  const totalPlatformTasks = Object.values(platformCounts).reduce((s, v) => s + v, 0);
  const topPlatformPct = topPlatform && totalPlatformTasks > 0 ? Math.round((topPlatform[1] / totalPlatformTasks) * 100) : 0;

  const recentLinks = brandSyncLinks.slice(0, 3);
  const recentTasks = tasks.slice(0, 3);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'COMPLETED': return 'bg-blue-100 text-blue-700';
      case 'DRAFT': return 'bg-gray-100 text-gray-600';
      case 'ARCHIVED': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Shared sidebar nav content
  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="BrandSync" className="h-7 w-7 rounded-lg object-contain" />
          <span className="text-base font-bold tracking-tight" style={{ color: PINK }}>BrandSync</span>
        </div>
        {/* Close button — mobile only */}
        {onNavigate && (
          <button onClick={onNavigate} className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-1">Main Menu</p>

        {navItems.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            onClick={() => {
              if (label === 'Dashboard') router.push('/dashboard/buyer');
              else if (label === 'Analytics') router.push('/dashboard/buyer/analytics');
              else if (label === 'Campaigns') router.push('/dashboard/buyer/campaigns');
              onNavigate?.();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              active ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
            style={active ? { background: `linear-gradient(135deg, ${PINK}, #e91e80)` } : {}}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </button>
        ))}

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mt-4 mb-1">Management</p>

        <button
          onClick={() => { router.push('/dashboard/buyer/links'); onNavigate?.(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
        >
          <Link2 className="h-4 w-4 flex-shrink-0" />
          All Links
          {brandSyncLinks.length > 0 && (
            <span className="ml-auto bg-gray-100 text-gray-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              {brandSyncLinks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => { router.push('/dashboard/buyer/all-tasks'); onNavigate?.(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
        >
          <ListChecks className="h-4 w-4 flex-shrink-0" />
          All Tasks
        </button>

        <button
          onClick={() => { router.push('/dashboard/buyer/settings'); onNavigate?.(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          Brand Settings
        </button>
      </nav>

      {/* Help Card */}
      <div className="m-3 rounded-xl p-3 text-xs" style={{ background: 'linear-gradient(135deg, #fff0f6, #ffe4ef)' }}>
        <div className="flex items-center gap-1.5 font-semibold text-gray-800 mb-1">
          <HelpCircle className="h-3.5 w-3.5" style={{ color: PINK }} />
          Need Help?
        </div>
        <p className="text-gray-500 leading-snug mb-2.5">Access our documentation or contact support for assistance.</p>
        <button className="w-full py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: PINK }}>
          Support Center
        </button>
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="hidden lg:block w-52 bg-white border-r border-gray-100 flex-shrink-0" />
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">

      {/* ─── Mobile sidebar backdrop ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Mobile slide-over drawer ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* ─── Desktop sidebar (always visible) ─── */}
      <aside className="hidden lg:flex w-52 bg-white border-r border-gray-100 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: PINK }} />
              Enterprise Portal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push('/dashboard/buyer/tasks/create')}
              className="h-9 px-4 text-sm font-semibold text-white rounded-lg shadow-sm"
              style={{ background: PINK }}
            >
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Create New Task</span>
            </Button>
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: PINK }} />
            </button>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">

          {/* ─── Stat Cards ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Active Tasks */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden">
              <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#fff0f6' }}>
                <ClipboardList className="h-4 w-4" style={{ color: PINK }} />
              </div>
              <p className="text-sm text-gray-500 font-medium">Active Tasks</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">{activeTasksCount}</p>
              <p className="text-xs text-gray-400 mt-1">
                {activeTasksCount === 0 ? '0 campaigns running' : `${activeTasksCount} campaign${activeTasksCount !== 1 ? 's' : ''} running`}
              </p>
              {/* decorative blob */}
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-5" style={{ background: PINK }} />
            </div>

            {/* Total Budget */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden">
              <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
                <BarChart2 className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Budget</p>
              <p className="text-4xl font-bold mt-1" style={{ color: '#0ea5e9' }}>
                Rs. {totalBudget.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">Across all campaigns</p>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-5 bg-blue-500" />
            </div>

            {/* Platform Reach */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Platform Reach</p>
                  {topPlatform ? (
                    <p className="text-lg font-bold text-gray-800 mt-1">{topPlatform[0].charAt(0) + topPlatform[0].slice(1).toLowerCase()}</p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1">No activity yet</p>
                  )}
                </div>
                <button
                  onClick={() => router.push('/dashboard/buyer/analytics')}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: PINK }}
                >
                  Details
                </button>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="w-14 h-14 flex-shrink-0">
                  <CircularProgressbar
                    value={topPlatformPct}
                    text={topPlatform ? `${topPlatformPct}%` : '—'}
                    styles={buildStyles({
                      pathColor: PINK,
                      textColor: '#374151',
                      trailColor: '#f3f4f6',
                      textSize: '26px',
                    })}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  {topPlatform
                    ? <>{topPlatform[1]} task{topPlatform[1] !== 1 ? 's' : ''} on {topPlatform[0].charAt(0) + topPlatform[0].slice(1).toLowerCase()}</>
                    : 'No activity yet'}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Recent BrandSync Links ─── */}
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Recent BrandSync Links</h2>
                <p className="text-xs text-gray-400 mt-0.5">Manage and monitor your top active influencer links.</p>
              </div>
              <button
                onClick={() => router.push('/dashboard/buyer/links')}
                className="flex items-center gap-1 text-xs font-semibold hover:underline"
                style={{ color: PINK }}
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {isLoadingLinks ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentLinks.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-gray-200 py-10 text-center">
                <Link2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">No BrandSync links yet</p>
                <p className="text-xs text-gray-400 mt-1">Share your video with influencers using a hidden proxy link.</p>
                <button
                  onClick={() => router.push('/dashboard/buyer/brandsync')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ background: PINK }}
                >
                  <Plus className="h-3.5 w-3.5" /> Create your first link
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {recentLinks.map(link => (
                  <div key={link.id} className="rounded-xl border border-gray-100 p-3.5 hover:border-pink-100 hover:shadow-sm transition-all relative">
                    {/* Card menu */}
                    <div className="flex items-start justify-between mb-2.5">
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-[75%]">{link.title}</p>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === link.id ? null : link.id)}
                          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                        {openMenuId === link.id && (
                          <div className="absolute right-0 top-7 bg-white border border-gray-100 rounded-lg shadow-lg z-10 py-1 w-28">
                            <button
                              onClick={() => { setOpenMenuId(null); handleDeleteLink(link.id); }}
                              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-medium"
                            >
                              Delete Link
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thumbnail + info */}
                    <div className="flex items-center gap-3 mb-3">
                      {link.thumbnailUrl ? (
                        <img src={link.thumbnailUrl} alt={link.title} className="h-14 w-20 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-14 w-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 flex items-center justify-center">
                          <Link2 className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-600 font-medium">
                          Clicks: {link.clicks ?? 0} / {link.shares ?? 100} • LKR {Number(link.amount ?? 0).toLocaleString()}
                        </p>
                        {link.platformUrl && (
                          <a
                            href={link.platformUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs mt-1 truncate hover:underline"
                            style={{ color: '#3b82f6' }}
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{link.platformUrl.replace(/^https?:\/\//, '')}</span>
                          </a>
                        )}
                        {!link.isPaid && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mt-1"
                            style={
                              link.paymentStatus === "PENDING"
                                ? { background: "#fffbeb", color: "#d97706" }
                                : link.paymentStatus === "REJECTED"
                                ? { background: "#fef2f2", color: "#dc2626" }
                                : { background: "#fff0f6", color: PINK }
                            }
                          >
                            {link.paymentStatus === "PENDING" ? (
                              <Clock className="h-2.5 w-2.5" />
                            ) : link.paymentStatus === "REJECTED" ? (
                              <X className="h-2.5 w-2.5" />
                            ) : (
                              <Clock className="h-2.5 w-2.5" />
                            )}
                            {link.paymentStatus === "PENDING"
                              ? "Verification in Progress"
                              : link.paymentStatus === "REJECTED"
                              ? "Payment Rejected"
                              : "Awaiting payment"}
                          </span>
                        )}
                        {link.isPaid && (
                          <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                            ✓ Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Messaging */}
                    {!link.isPaid && link.paymentStatus === "PENDING" && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
                        Payment verification in progress. Our team will verify your slip shortly.
                      </p>
                    )}
                    {!link.isPaid && link.paymentStatus === "REJECTED" && (link.rejectionCount || 0) < 3 && (
                      <p className="text-[10px] text-red-600 dark:text-red-400 mt-2 font-medium">
                        Your payment slip was rejected. Please upload a valid transfer receipt. (Attempt {link.rejectionCount || 1}/3)
                      </p>
                    )}
                    {!link.isPaid && (link.rejectionCount || 0) >= 3 && (
                      <p className="text-[10px] text-red-600 dark:text-red-400 mt-2 font-semibold bg-red-50 p-2 rounded-lg border border-red-200">
                        ⚠️ Locked: Upload blocked after 3 rejected slips. Contact accounts@brandsync.lk.
                      </p>
                    )}

                    {/* Actions */}
                    {!link.isPaid && (
                      (link.rejectionCount || 0) >= 3 ? (
                        <div className="text-center text-xs text-red-500 font-semibold py-1 bg-red-50/50 rounded-lg border border-dashed border-red-100 mt-2.5">
                          Payment Suspended
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-2.5">
                          <button
                            onClick={async () => {
                              try {
                                const resp = await fetch(`/api/payment/initialize/brandsync/${link.id}`, { method: 'POST' });
                                if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e?.error || 'Failed'); }
                                const formData = await resp.json();
                                const paymentForm = document.createElement('form');
                                paymentForm.method = 'post';
                                paymentForm.action = formData.checkout_url;
                                paymentForm.target = '_blank';
                                Object.entries(formData).forEach(([key, value]) => {
                                  if (value !== undefined && value !== null) {
                                    const input = document.createElement('input');
                                    input.type = 'hidden'; input.name = key; input.value = String(value);
                                    paymentForm.appendChild(input);
                                  }
                                });
                                document.body.appendChild(paymentForm);
                                paymentForm.submit();
                                setTimeout(() => document.body.removeChild(paymentForm), 100);
                              } catch { toast.error('Failed to initialize payment'); }
                            }}
                            className="flex-1 py-1.5 rounded-lg text-white text-xs font-semibold hover:shadow-sm"
                            style={{ background: '#16a34a' }}
                          >
                            Pay
                          </button>
                          <label className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold text-center cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all">
                            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handleUploadSlipForLink(e, link.id)} />
                            {link.paymentStatus === "PENDING" ? "Replace Slip" : "Upload Slip"}
                          </label>
                        </div>
                      )
                    )}
                    {uploadProgress[link.id] != null && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress[link.id]}%`, background: PINK }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Uploading: {uploadProgress[link.id]}%</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ─── Recent Tasks ─── */}
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Recent Tasks</h2>
                <p className="text-xs text-gray-400 mt-0.5">Stay updated on your most recent campaign progress.</p>
              </div>
              <button
                onClick={() => router.push('/dashboard/buyer/all-tasks')}
                className="flex items-center gap-1 text-xs font-semibold hover:underline"
                style={{ color: PINK }}
              >
                View All Tasks <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {recentTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center mt-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <ClipboardList className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No tasks found</p>
                <p className="text-xs text-gray-400 mt-1">Start your first task to begin tracking growth.</p>
                <button
                  onClick={() => router.push('/dashboard/buyer/tasks/create')}
                  className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm"
                  style={{ background: PINK }}
                >
                  <Plus className="h-4 w-4" /> Create First Task
                </button>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-gray-50">
                {recentTasks.map(task => {
                  const cost = task.cost as { amount: number } | null;
                  const budget = cost?.amount || 0;
                  return (
                    <div
                      key={task.task_id}
                      className="flex items-center gap-4 py-3 hover:bg-gray-50/50 rounded-lg px-2 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/task/${task.task_id}`)}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fff0f6' }}>
                        <ClipboardList className="h-4 w-4" style={{ color: PINK }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
                        <p className="text-xs text-gray-400 truncate">{task.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-700">Rs. {budget.toLocaleString()}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ─── Footer ─── */}
          <footer className="flex items-center justify-between text-xs text-gray-400 pt-2 pb-4">
            <span>© {new Date().getFullYear()} BrandSync Platform. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <button className="hover:text-gray-600 transition-colors">Terms</button>
              <button className="hover:text-gray-600 transition-colors">Privacy</button>
              <button className="hover:text-gray-600 transition-colors">Support</button>
            </div>
          </footer>

        </main>
      </div>

      {/* Close dropdown on outside click */}
      {openMenuId !== null && (
        <div className="fixed inset-0 z-[5]" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  );
}