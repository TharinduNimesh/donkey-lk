"use client";

import { useEffect, useState } from "react";
import { useSetupStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { InfluencerTaskCard } from "@/components/dashboard/influencer-task-card";
import { GiftBonusModal } from "@/components/dashboard/gift-bonus-modal";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Copy,
  ExternalLink,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Wallet,
  DollarSign,
  Users,
  Plus,
  Eye,
  MousePointerClick,
  Lock
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { InfluencerSidebar, InfluencerTopbar } from "@/components/dashboard/influencer-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/dashboard/task-application/platform-icon";

const PINK = "#C8185A";
const ITEMS_PER_PAGE = 6;

const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  onFirstPage, 
  onPrevPage, 
  onNextPage, 
  onLastPage 
}: { 
  currentPage: number;
  totalPages: number;
  onFirstPage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onLastPage: () => void;
}) => (
  <div className="flex items-center justify-end space-x-2 py-4">
    <Button variant="outline" size="sm" onClick={onFirstPage} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-md border border-gray-200">
      <ChevronsLeft className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="sm" onClick={onPrevPage} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-md border border-gray-200">
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <div className="text-sm font-medium px-4 text-gray-500">
      Page {currentPage} of {totalPages}
    </div>
    <Button variant="outline" size="sm" onClick={onNextPage} disabled={currentPage === totalPages} className="h-8 w-8 p-0 rounded-md border border-gray-200">
      <ChevronRight className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="sm" onClick={onLastPage} disabled={currentPage === totalPages} className="h-8 w-8 p-0 rounded-md border border-gray-200">
      <ChevronsRight className="h-4 w-4" />
    </Button>
  </div>
);

type TaskDetail = Database["public"]["Views"]["task_details_view"]["Row"];
type TaskApplication = Database["public"]["Tables"]["task_applications"]["Row"] & {
  application_promises: Database["public"]["Tables"]["application_promises"]["Row"][];
  application_proofs?: (Database["public"]["Tables"]["application_proofs"]["Row"] & {
    proof_status?: {
      status: Database["public"]["Enums"]["ProofStatus"];
    } | null;
  })[];
};
type AccountBalance = Database["public"]["Tables"]["account_balance"]["Row"];
type ConnectedPlatform = {
  type: 'verified' | 'pending';
  id: number;
  platform: Database['public']['Enums']['Platforms'];
  name?: string;
  followers?: string;
  profile_pic?: string | null;
  is_verified: boolean;
  url: string;
};
type BrandSyncLinkEntry = {
  id: number;
  title: string;
  platform: Database['public']['Enums']['Platforms'];
  thumbnailUrl?: string | null;
  brandSyncUrl: string;
  createdAt: string;
  uniqueUrl?: string | null;
  clicks?: number;
  myClicks?: number;
  shares?: number;
  unlocked?: boolean;
  nextUnlockAt?: string | null;
};

const UnlockButtonWithCountdown = ({ 
  linkId, 
  nextUnlockAt, 
  isUnlocking, 
  onUnlock 
}: { 
  linkId: number; 
  nextUnlockAt?: string | null; 
  isUnlocking: boolean; 
  onUnlock: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!nextUnlockAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = new Date(nextUnlockAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      
      const formatted = [
        h > 0 ? `${h}h` : null,
        m > 0 || h > 0 ? `${m}m` : null,
        `${s}s`
      ].filter(Boolean).join(" ");
      
      setTimeLeft(formatted);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [nextUnlockAt]);

  const isDisabled = isUnlocking || !!timeLeft;
  const PINK = "#C8185A";

  return (
    <Button
      className="w-full text-xs h-8 font-semibold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
      style={{ background: PINK }}
      disabled={isDisabled}
      onClick={onUnlock}
    >
      {isUnlocking ? (
        <>
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Unlocking...
        </>
      ) : timeLeft ? (
        <>
          <Lock className="h-3.5 w-3.5" /> Unlock in {timeLeft}
        </>
      ) : (
        <>
          <Lock className="h-3.5 w-3.5" /> Unlock Task Link
        </>
      )}
    </Button>
  );
};

export default function InfluencerDashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();


  // Clear setup store & storage on dashboard mount
  useEffect(() => {
    useSetupStore.getState().reset();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("setup-storage");
    }
  }, []);

  // Redirect to task apply page if 'target' exists in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const target = localStorage.getItem("target");
      if (target) {
        localStorage.removeItem("target");
        router.replace(`/dashboard/task/${target}/apply?source=home`);
        return;
      }
    }
  }, [router]);

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([]);
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null);
  const [appliedTasks, setAppliedTasks] = useState<(TaskDetail & { application?: TaskApplication })[]>([]);
  const [availableTasks, setAvailableTasks] = useState<(TaskDetail & { application?: TaskApplication })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("created_at_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredTasks, setFilteredTasks] = useState<(TaskDetail & { application?: TaskApplication })[]>([]);
  const [hasIncompleteTask, setHasIncompleteTask] = useState(false);
  const [brandSyncLinks, setBrandSyncLinks] = useState<BrandSyncLinkEntry[]>([]);
  const [isLoadingBrandSyncLinks, setIsLoadingBrandSyncLinks] = useState(true);

  const LKR_PER_USD = Number(process.env.NEXT_PUBLIC_LKR_PER_USD ?? "295");
  const LKR_TO_USD = 1 / (LKR_PER_USD || 295);
  const MIN_WITHDRAWAL_LKR = 10 * LKR_PER_USD;

  const formatUSD = (lkrAmount: number) => {
    const usd = lkrAmount * LKR_TO_USD;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(usd);
  };

  const [isUnlocking, setIsUnlocking] = useState<number | null>(null);

  const handleUnlockLink = async (linkId: number) => {
    try {
      setIsUnlocking(linkId);
      const res = await fetch(`/api/brandsync-links/${linkId}/influencer-token`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "daily_limit_reached") {
          toast.error("Daily limit reached! You can only unlock 3 links per day.");
          if (data.nextUnlockAt) {
            setBrandSyncLinks(prev => prev.map(link => 
              !link.unlocked 
                ? { ...link, nextUnlockAt: data.nextUnlockAt } 
                : link
            ));
          }
        } else {
          toast.error(data.error || "Failed to unlock link.");
        }
        return;
      }
      
      setBrandSyncLinks(prev => prev.map(link => 
        link.id === linkId 
          ? { ...link, uniqueUrl: data.uniqueUrl, unlocked: true } 
          : link
      ));
      toast.success("Link unlocked successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to unlock link.");
    } finally {
      setIsUnlocking(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/auth"); return; }
        setUserId(user.id);

        const { data: incomplete, error: incompleteError } = await supabase.rpc('has_incomplete_applications');
        setHasIncompleteTask(!incompleteError && incomplete === true);

        const [
          balanceResponse,
          verifiedProfilesResponse,
          pendingVerificationsResponse,
          tasksResponse,
          brandsyncLinksData
        ] = await Promise.all([
          supabase.from("account_balance").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("influencer_profile").select("*").eq("user_id", user.id),
          supabase.from("influencer_profile_verification_requests").select("*").eq("user_id", user.id).neq("platform", "YOUTUBE"),
          supabase.from("task_details_view").select(`
            *,
            applications:task_applications(
              id, created_at, is_cancelled,
              application_promises(platform, promised_reach, est_profit),
              application_proofs(
                id, platform, proof_type, content,
                proof_status(status)
              )
            )
          `).eq("status", "ACTIVE"),
          (async () => {
            try {
              const res = await fetch("/api/brandsync-links?scope=public");
              if (!res.ok) return [];
              const data = await res.json();
              const links: BrandSyncLinkEntry[] = data.links || [];
              const linksWithTokens = await Promise.all(
                links.map(async (link) => {
                  try {
                    const tokenResp = await fetch(`/api/brandsync-links/${link.id}/influencer-token`, { credentials: 'include' });
                    if (tokenResp.ok) {
                      const data = await tokenResp.json();
                      if (data.unlocked) {
                        return { ...link, uniqueUrl: data.uniqueUrl as string, unlocked: true };
                      } else {
                        return { ...link, uniqueUrl: null, unlocked: false, nextUnlockAt: data.nextUnlockAt };
                      }
                    }
                  } catch {}
                  return { ...link, uniqueUrl: null, unlocked: false };
                })
              );
              return linksWithTokens;
            } catch (err) {
              console.error("Error fetching BrandSync links:", err);
              return [];
            }
          })()
        ]);

        setBrandSyncLinks(brandsyncLinksData);

        setAccountBalance(balanceResponse.data);

        const allPlatforms: ConnectedPlatform[] = [
          ...(verifiedProfilesResponse.data?.map(profile => ({
            type: 'verified' as const, id: profile.id, platform: profile.platform, name: profile.name, followers: profile.followers, profile_pic: profile.profile_pic, is_verified: profile.is_verified, url: profile.url
          })) || []),
          ...(pendingVerificationsResponse.data?.map(request => ({
            type: 'pending' as const, id: request.id, platform: request.platform, is_verified: false, url: request.profile_url
          })) || [])
        ];
        setConnectedPlatforms(allPlatforms);

        if (tasksResponse.data) {
          const available: typeof availableTasks = [];
          const applied: typeof appliedTasks = [];

          tasksResponse.data.forEach((task) => {
            const applications = task.applications as TaskApplication[];
            const userApplication = applications?.find(app => !app.is_cancelled);
            const taskWithApp = { ...task, application: userApplication };
            if (userApplication) applied.push(taskWithApp);
            else available.push(taskWithApp);
          });
          // Sort applied tasks by application creation time descending
          applied.sort((a, b) => {
            const dateA = a.application?.created_at ? new Date(a.application.created_at).getTime() : 0;
            const dateB = b.application?.created_at ? new Date(b.application.created_at).getTime() : 0;
            return dateB - dateA;
          });
          setAvailableTasks(available);
          setAppliedTasks(applied);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingBrandSyncLinks(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [supabase, router]);

  useEffect(() => {
    let filtered = [...availableTasks];
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (platformFilter !== "ALL") {
      filtered = filtered.filter(task => {
        const targets = task.targets as Array<{ platform: string }> | null;
        return targets?.some(t => t.platform === platformFilter);
      });
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created_at_desc": return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "created_at_asc": return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "title_asc": return (a.title || "").localeCompare(b.title || "");
        case "title_desc": return (b.title || "").localeCompare(a.title || "");
        default: return 0;
      }
    });
    setFilteredTasks(filtered);
    setCurrentPage(1);
  }, [availableTasks, searchQuery, platformFilter, sortBy]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      YOUTUBE: "bg-red-500", FACEBOOK: "bg-blue-600", INSTAGRAM: "bg-pink-500", TIKTOK: "bg-black",
    };
    return colors[platform] || "bg-gray-500";
  };

  const formatFollowers = (followers: string | null | undefined) => {
    if (!followers) return '0';
    if (/[a-zA-Z]/.test(followers)) {
      return followers;
    }
    const num = Number(followers);
    return isNaN(num) ? followers : num.toLocaleString();
  };

  const handleWithdrawal = () => router.push("/withdraw");

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <InfluencerSidebar activePage="dashboard" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <InfluencerTopbar 
          title="Dashboard" 
          actions={
            <Button
              onClick={() => router.push("/dashboard/influencer/platforms")}
              className="h-9 px-4 text-sm font-semibold text-white rounded-lg shadow-sm"
              style={{ background: PINK }}
            >
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Connect Platform</span>
            </Button>
          } 
        />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
              </div>
              <div className="h-64 bg-white rounded-xl border border-gray-100 animate-pulse" />
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Available Balance */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#fff0f6' }}>
                    <Wallet className="h-4 w-4" style={{ color: PINK }} />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Available Balance</p>
                  <p className="text-4xl font-bold mt-1 text-gray-900">{formatUSD(accountBalance?.balance || 0)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    LKR {(accountBalance?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="mt-4">
                    {(accountBalance?.balance || 0) < MIN_WITHDRAWAL_LKR ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button className="w-full text-xs font-semibold py-1.5 h-8 bg-pink-50 text-pink-700 hover:bg-pink-100 border-none shadow-none">
                            Withdraw Funds
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 text-xs">
                          <p className="font-semibold text-gray-900 mb-1">Minimum Withdrawal</p>
                          <p className="text-gray-500">You need {formatUSD(MIN_WITHDRAWAL_LKR)} to withdraw. Current: {formatUSD(accountBalance?.balance || 0)}.</p>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Button onClick={handleWithdrawal} className="w-full text-xs font-semibold py-1.5 h-8 text-white shadow-sm" style={{ background: PINK }}>
                        Withdraw Funds
                      </Button>
                    )}
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-5" style={{ background: PINK }} />
                </div>

                {/* Total Earnings */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Lifetime Earnings</p>
                  <p className="text-4xl font-bold mt-1 text-gray-900">{formatUSD(accountBalance?.total_earning || 0)}</p>
                  <p className="text-xs text-gray-400 mt-1">Across all completed tasks</p>
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-5 bg-blue-500" />
                </div>

                {/* Connected Accounts */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50">
                    <Users className="h-4 w-4 text-indigo-500" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Connected Accounts</p>
                  <p className="text-4xl font-bold mt-1 text-gray-900">{connectedPlatforms.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Active linked platforms</p>
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-5 bg-indigo-500" />
                </div>
              </div>

              {/* BrandSync Links */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">BrandSync Links</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Your unique tracking links for active campaigns.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push("/dashboard/influencer/links")}
                    className="h-8 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    View All Links
                  </Button>
                </div>
                <div className="p-5">
                  {isLoadingBrandSyncLinks ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-50 rounded-lg animate-pulse" />)}
                    </div>
                  ) : brandSyncLinks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {brandSyncLinks.slice(0, 3).map((link) => (
                        <div key={link.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-pink-200 transition-colors">
                          {link.thumbnailUrl ? (
                            <img src={link.thumbnailUrl} alt={link.title} className="h-32 w-full object-cover" />
                          ) : (
                            <div className="h-32 w-full bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                              <ExternalLink className="h-8 w-8 text-pink-200" />
                            </div>
                          )}
                          <div className="p-4">
                            {/* Title */}
                            <div className="mb-2">
                              <h3 className="font-semibold text-sm text-gray-900 truncate">{link.title}</h3>
                            </div>

                            {/* Clicks stats block */}
                            <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100/50">
                              <div className="flex flex-col items-center justify-center py-1 border-r border-gray-200">
                                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <Eye className="h-3 w-3" /> Total Clicks
                                </span>
                                <span className="text-xs font-bold text-gray-700">{(link.clicks ?? 0).toLocaleString()} / {(link.shares ?? 0).toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col items-center justify-center py-1">
                                <span className="text-[10px] text-pink-500 font-semibold uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <MousePointerClick className="h-3 w-3" /> My Clicks
                                </span>
                                <span className="text-xs font-bold text-pink-600 bg-pink-50/50 px-1.5 py-0.5 rounded-md">{(link.myClicks ?? 0).toLocaleString()}</span>
                              </div>
                            </div>

                            {link.clicks && link.shares && link.clicks > link.shares ? (
                              <div className="mb-3 p-1.5 bg-amber-50 rounded-lg border border-amber-200 text-center text-[10px] text-amber-700 font-medium">
                                Extra clicks: {link.clicks - link.shares} ({"We can't pay for extra views"})
                              </div>
                            ) : null}
                            <div className="flex items-center gap-2 w-full">
                              {typeof link.clicks === "number" && typeof link.shares === "number" && link.clicks >= link.shares ? (
                                <Button
                                  className="w-full text-xs h-8 font-semibold text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed flex items-center justify-center gap-1.5 transition-all shadow-none"
                                  disabled
                                >
                                  Campaign Full
                                </Button>
                              ) : !link.unlocked ? (
                                <UnlockButtonWithCountdown
                                  linkId={link.id}
                                  nextUnlockAt={link.nextUnlockAt}
                                  isUnlocking={isUnlocking === link.id}
                                  onUnlock={() => handleUnlockLink(link.id)}
                                />
                              ) : (
                                <>
                                  <Button
                                    className="flex-1 text-xs h-8 font-medium text-white shadow-sm"
                                    style={{ background: PINK }}
                                    onClick={async () => {
                                      if (link.uniqueUrl) {
                                        await navigator.clipboard.writeText(link.uniqueUrl);
                                        toast.success("Link copied!");
                                      }
                                    }}
                                  >
                                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Link
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0 shrink-0 text-gray-500 hover:text-gray-900"
                                    asChild
                                  >
                                    <a href={link.uniqueUrl || undefined} target="_blank" rel="noopener noreferrer" title="Open Link">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <p className="text-sm font-semibold text-gray-700">No links yet</p>
                      <p className="text-xs text-gray-500 mt-1">Check back when you have an active campaign.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Connected Platforms */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-base font-semibold text-gray-900">Connected Platforms</h2>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connectedPlatforms.map((platform) => (
                    <div key={`${platform.type}-${platform.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white shadow-sm hover:border-pink-100 transition-colors">
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs overflow-hidden ${!platform.profile_pic ? getPlatformColor(platform.platform) : ""}`}>
                          {platform.profile_pic ? (
                            <img src={platform.profile_pic} alt={platform.name || 'Profile'} className="w-full h-full object-cover" />
                          ) : (
                            <span>{platform.platform.charAt(0)}</span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 rounded-full border border-white dark:border-gray-900 shadow-3xs overflow-hidden">
                          <PlatformIcon platform={platform.platform} size="xs" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{platform.name || 'Unknown'}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className={`text-[8px] font-bold px-1.5 py-0.25 rounded text-white ${getPlatformColor(platform.platform)}`}>
                            {platform.platform}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {platform.followers ? `${formatFollowers(platform.followers)} followers` : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {platform.type === 'pending' ? (
                          <span className="text-[10px] font-semibold bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md border border-yellow-100">Requested</span>
                        ) : platform.is_verified ? (
                          <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">Verified</span>
                        ) : (
                          <span className="text-[10px] font-semibold bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-200">Pending</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Applied Tasks */}
              {appliedTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3 pl-1">
                    <h2 className="text-base font-semibold text-gray-900">Active Applications</h2>
                    {appliedTasks.length > 3 && (
                      <Link 
                        href="/dashboard/influencer/tasks?tab=active"
                        className="text-xs font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-0.5 transition-colors"
                      >
                        View All ({appliedTasks.length}) <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {appliedTasks.slice(0, 3).map((task) => (
                      <InfluencerTaskCard key={task.task_id} task={task} application={task.application} />
                    ))}
                  </div>
                </div>
              )}


            </>
          )}

          {/* Footer */}
          <footer className="flex items-center justify-between text-xs text-gray-400 pt-2 pb-4">
            <span>© {new Date().getFullYear()} BrandSync Platform. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link href="/policies/terms-of-service" className="hover:text-gray-650 transition-colors">Terms</Link>
              <Link href="/policies/privacy-policy" className="hover:text-gray-650 transition-colors">Privacy</Link>
              <button className="hover:text-gray-650 transition-colors">Support</button>
            </div>
          </footer>
        </main>
      </div>
      {userId && (
        <GiftBonusModal
          userId={userId}
          totalEarning={accountBalance?.total_earning ?? 0}
          onClaimSuccess={(newBalance) => setAccountBalance(newBalance)}
        />
      )}
    </div>
  );
}
