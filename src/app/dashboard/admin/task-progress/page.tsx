"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Users,
  Eye,
  Info,
  ExternalLink
} from "lucide-react";
import { Database } from "@/types/database.types";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 8;
const PINK = "#C8185A";

type TaskApplication = {
  id: number;
  created_at: string;
  is_cancelled: boolean;
  task_id: number;
  user_id: string;
  task: {
    id: number;
    title: string;
    description: string;
    status: string;
    created_at: string;
  } | null;
  user: {
    name: string;
    email: string;
  } | null;
  application_promises: Array<{
    id: number;
    platform: Database["public"]["Enums"]["Platforms"];
    promised_reach: string;
    est_profit: string;
  }>;
  application_proofs: Array<{
    id: number;
    platform: Database["public"]["Enums"]["Platforms"];
    proof_type: Database["public"]["Enums"]["ProofType"];
    proof_status: {
      status: Database["public"]["Enums"]["ProofStatus"];
      reviewed_at: string | null;
    } | null;
  }>;
};

type GroupedTask = {
  taskId: number;
  taskTitle: string;
  taskDescription: string;
  taskStatus: string;
  createdAt: string;
  applications: TaskApplication[];
};

export default function AdminTaskProgressPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<TaskApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONGOING" | "COMPLETED" | "REJECTED">("ALL");
  const [platformFilter, setPlatformFilter] = useState<"ALL" | Database["public"]["Enums"]["Platforms"]>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile?.role.includes("ADMIN")) {
        router.push("/dashboard");
        return;
      }
    };

    checkAdminAccess();
  }, [supabase, router]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("task_applications")
        .select(`
          id,
          created_at,
          is_cancelled,
          task_id,
          user_id,
          task:tasks (
            id,
            title,
            description,
            status,
            created_at
          ),
          user:profile!task_applications_user_id_fkey (
            name,
            email
          ),
          application_promises (
            id,
            platform,
            promised_reach,
            est_profit
          ),
          application_proofs (
            id,
            platform,
            proof_type,
            proof_status (
              status,
              reviewed_at
            )
          )
        `)
        .eq("is_cancelled", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications((data as any) || []);
    } catch (err) {
      console.error("Error fetching task progress:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [supabase]);

  // Compute status and payout metrics helper for a single application
  const getAppMetrics = (app: TaskApplication) => {
    let totalPromised = 0;
    let totalPaid = 0;
    let totalPending = 0;

    const platformStatuses = app.application_promises.map(promise => {
      const platformProofs = app.application_proofs.filter(p => p.platform === promise.platform);
      const urlProof = platformProofs.find(p => p.proof_type === "URL");
      const imgProof = platformProofs.find(p => p.proof_type === "IMAGE");
      
      const urlStatus = urlProof?.proof_status?.status || "NOT_SUBMITTED";
      const imgStatus = imgProof?.proof_status?.status || "NOT_SUBMITTED";

      const isCompleted = urlStatus === "ACCEPTED" && imgStatus === "ACCEPTED";
      const isRejected = urlStatus === "REJECTED" || imgStatus === "REJECTED";
      const isUnderReview = urlStatus === "UNDER_REVIEW" || imgStatus === "UNDER_REVIEW";

      const promisedAmount = parseFloat(promise.est_profit) || 0;
      totalPromised += promisedAmount;

      if (isCompleted) {
        totalPaid += promisedAmount;
      } else {
        totalPending += promisedAmount;
      }

      return {
        platform: promise.platform,
        isCompleted,
        isRejected,
        isUnderReview,
        urlStatus,
        imgStatus,
        reviewedAt: urlProof?.proof_status?.reviewed_at || imgProof?.proof_status?.reviewed_at || null
      };
    });

    const isAllCompleted = platformStatuses.length > 0 && platformStatuses.every(p => p.isCompleted);
    const hasAnyRejected = platformStatuses.some(p => p.isRejected);
    const hasAnyUnderReview = platformStatuses.some(p => p.isUnderReview);

    let finalStatus: "ONGOING" | "COMPLETED" | "REJECTED" = "ONGOING";
    if (isAllCompleted) {
      finalStatus = "COMPLETED";
    } else if (hasAnyRejected) {
      finalStatus = "REJECTED";
    }

    let endTimestamp: Date | null = null;
    if (isAllCompleted) {
      const timestamps = platformStatuses
        .map(p => p.reviewedAt ? new Date(p.reviewedAt) : null)
        .filter((t): t is Date => t !== null);
      if (timestamps.length > 0) {
        endTimestamp = new Date(Math.max(...timestamps.map(t => t.getTime())));
      }
    }

    const start = new Date(app.created_at);
    const end = endTimestamp || new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let durationText = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (diffDays <= 1) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      durationText = `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }

    return {
      totalPromised,
      totalPaid,
      totalPending,
      finalStatus,
      durationText,
      platformStatuses
    };
  };

  // Filter applications list
  const filteredApps = useMemo(() => {
    let result = [...applications];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(app => 
        app.task?.title?.toLowerCase().includes(query) ||
        app.user?.name?.toLowerCase().includes(query) ||
        app.user?.email?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter(app => {
        const { finalStatus } = getAppMetrics(app);
        return finalStatus === statusFilter;
      });
    }

    if (platformFilter !== "ALL") {
      result = result.filter(app => 
        app.application_promises.some(p => p.platform === platformFilter)
      );
    }

    return result;
  }, [applications, searchQuery, statusFilter, platformFilter]);

  // Group applications by task
  const groupedTasks = useMemo(() => {
    const map: Record<number, GroupedTask> = {};
    
    filteredApps.forEach(app => {
      const taskId = app.task_id;
      if (!map[taskId]) {
        map[taskId] = {
          taskId,
          taskTitle: app.task?.title || `Task #${taskId}`,
          taskDescription: app.task?.description || "",
          taskStatus: app.task?.status || "ACTIVE",
          createdAt: app.task?.created_at || app.created_at,
          applications: [],
        };
      }
      map[taskId].applications.push(app);
    });

    return Object.values(map).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredApps]);

  // Pagination for tasks overview table
  const totalPages = Math.ceil(groupedTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = useMemo(() => {
    return groupedTasks.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [groupedTasks, currentPage]);

  // If a task is selected, get its detail
  const selectedTask = useMemo(() => {
    if (selectedTaskId === null) return null;
    return groupedTasks.find(t => t.taskId === selectedTaskId) || null;
  }, [groupedTasks, selectedTaskId]);

  // Reset page when switching views/filters
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTaskId, searchQuery, statusFilter, platformFilter]);

  // Overall Stats across all applications
  const overallStats = useMemo(() => {
    let ongoingCount = 0;
    let completedCount = 0;
    let totalPromisedPayout = 0;
    let totalReleasedPayout = 0;

    applications.forEach(app => {
      const { finalStatus, totalPromised, totalPaid } = getAppMetrics(app);
      if (finalStatus === "COMPLETED") {
        completedCount++;
      } else {
        ongoingCount++;
      }
      totalPromisedPayout += totalPromised;
      totalReleasedPayout += totalPaid;
    });

    return {
      totalApplications: applications.length,
      totalTasksCount: new Set(applications.map(a => a.task_id)).size,
      ongoingCount,
      completedCount,
      totalPromisedPayout,
      totalReleasedPayout,
      pendingPayout: totalPromisedPayout - totalReleasedPayout
    };
  }, [applications]);

  const getStatusBadge = (status: "ONGOING" | "COMPLETED" | "REJECTED") => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-full px-2.5 py-0.5 text-xs font-semibold">Completed</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none rounded-full px-2.5 py-0.5 text-xs font-semibold">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none rounded-full px-2.5 py-0.5 text-xs font-semibold">Ongoing</Badge>;
    }
  };

  const getProofIndicator = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.25 rounded border border-emerald-100">Approved</span>;
      case "REJECTED":
        return <span className="inline-flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.25 rounded border border-rose-100">Rejected</span>;
      case "UNDER_REVIEW":
        return <span className="inline-flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.25 rounded border border-amber-100">Review</span>;
      default:
        return <span className="inline-flex items-center text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.25 rounded border border-gray-200">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {selectedTaskId !== null && (
              <button 
                onClick={() => setSelectedTaskId(null)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors mr-1"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {selectedTaskId !== null ? "Task Details & Applications" : "Task Progress & Tracking"}
            </h1>
          </div>
          <p className="text-xs text-gray-500">
            {selectedTaskId !== null 
              ? `Viewing influencer runs, proof submissions, and payout releases for "${selectedTask?.taskTitle}".`
              : "Grouped view of active campaigns, working influencers, work durations, and payout status."
            }
          </p>
        </div>
        <Button 
          onClick={fetchApplications}
          variant="outline"
          size="sm"
          className="border-gray-200 bg-white hover:bg-gray-50 font-semibold shadow-2xs self-start md:self-auto"
        >
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards (Rendered only on main overview page) */}
      {selectedTaskId === null && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Tasks */}
          <Card className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: PINK }} />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active Campaigns</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{overallStats.totalTasksCount}</h3>
                <p className="text-[10px] text-gray-500 mt-2 font-medium">{overallStats.totalApplications} total influencer runs</p>
              </div>
              <div className="p-2.5 rounded-lg bg-pink-50" style={{ background: '#fff0f6' }}>
                <Users className="h-4 w-4" style={{ color: PINK }} />
              </div>
            </div>
          </Card>

          {/* Ongoing */}
          <Card className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Ongoing Work</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{overallStats.ongoingCount}</h3>
                <p className="text-[10px] text-gray-500 mt-2 font-medium">Pending or under review</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
            </div>
          </Card>

          {/* Completed */}
          <Card className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Finished Runs</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{overallStats.completedCount}</h3>
                <p className="text-[10px] text-gray-500 mt-2 font-medium">All proof files accepted</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </Card>

          {/* Released Payout */}
          <Card className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-indigo-500" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Released Earnings</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">Rs. {overallStats.totalReleasedPayout.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-500 mt-2 font-medium">Of Rs. {overallStats.totalPromisedPayout.toLocaleString()} promised</p>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50">
                <DollarSign className="h-4 w-4 text-indigo-500" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      {selectedTaskId === null ? (
        /* ==================== GROUPED TASKS OVERVIEW ==================== */
        <Card className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          {/* Filters bar */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search task title, influencer name..." 
                className="h-9 pl-9 text-xs bg-white border-gray-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">Status</span>
                <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                  <SelectTrigger className="h-9 w-36 text-xs bg-white border-gray-200">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">Platform</span>
                <Select value={platformFilter} onValueChange={(val: any) => setPlatformFilter(val)}>
                  <SelectTrigger className="h-9 w-36 text-xs bg-white border-gray-200">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Platforms</SelectItem>
                    <SelectItem value="YOUTUBE">YouTube</SelectItem>
                    <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                    <SelectItem value="TIKTOK">TikTok</SelectItem>
                    <SelectItem value="FACEBOOK">Facebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Grouped Tasks Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-sm text-gray-400 animate-pulse">
                Loading task progress...
              </div>
            ) : paginatedTasks.length > 0 ? (
              <Table>
                <TableHeader className="bg-gray-50/20">
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs">Task (Campaign) Title</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs">Created At</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs">Total Influencers</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs">Completed Runs</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs text-right">Promised Budget</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs text-right">Released Payouts</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((t) => {
                    // Accumulate metrics for all applications under this task
                    let totalPromised = 0;
                    let totalPaid = 0;
                    let completedRuns = 0;

                    t.applications.forEach(app => {
                      const metrics = getAppMetrics(app);
                      totalPromised += metrics.totalPromised;
                      totalPaid += metrics.totalPaid;
                      if (metrics.finalStatus === "COMPLETED") {
                        completedRuns++;
                      }
                    });

                    return (
                      <TableRow key={t.taskId} className="border-b border-gray-100 hover:bg-gray-50/10 transition-colors">
                        <TableCell className="py-3.5 px-5">
                          <div className="font-semibold text-sm text-gray-800 leading-snug truncate max-w-[280px]">
                            {t.taskTitle}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">Task ID: #{t.taskId}</div>
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-xs text-gray-600">
                          {format(new Date(t.createdAt), "yyyy-MM-dd")}
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-xs font-semibold text-gray-700">
                          <div className="flex items-center gap-1.5">
                            <Users size={14} className="text-gray-400" />
                            <span>{t.applications.length} influencer{t.applications.length !== 1 ? 's' : ''}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-5">
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            {completedRuns} finished
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-right font-semibold text-xs text-gray-800">
                          Rs. {totalPromised.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-right font-bold text-xs text-emerald-600">
                          Rs. {totalPaid.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-center">
                          <Button
                            onClick={() => setSelectedTaskId(t.taskId)}
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg flex items-center gap-1 mx-auto"
                          >
                            <Eye size={13} /> View Progress
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-gray-400 py-16 text-sm">
                <Info className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                No tasks found matching the selected criteria.
              </div>
            )}
          </div>

          {/* Grouped Tasks Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4 px-5 border-t border-gray-100 bg-white">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-md border border-gray-200"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-md border border-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs font-semibold px-2 text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 rounded-md border border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 rounded-md border border-gray-200"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      ) : (
        /* ==================== SELECTED TASK DETAILED VIEW ==================== */
        <div className="space-y-6">
          {/* Selected Task Details Summary */}
          <Card className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 leading-snug">{selectedTask?.taskTitle}</h2>
            {selectedTask?.taskDescription && (
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{selectedTask.taskDescription}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium text-gray-600 border-t border-gray-100 pt-3">
              <span>Task ID: <strong className="text-gray-900">#{selectedTask?.taskId}</strong></span>
              <span>•</span>
              <span>Launched: <strong className="text-gray-900">{selectedTask ? format(new Date(selectedTask.createdAt), "yyyy-MM-dd") : ""}</strong></span>
              <span>•</span>
              <span>Total Assigned: <strong className="text-gray-900">{selectedTask?.applications.length} influencers</strong></span>
            </div>
          </Card>

          {/* Influencer applications detail table */}
          <Card className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800">Influencer Applications & Work Progress</h3>
              <Badge className="bg-pink-100 text-pink-700 font-semibold border-none hover:bg-pink-100">
                {selectedTask?.applications.length} Runs
              </Badge>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/10">
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs">Influencer</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs">Duration of Work</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs">Promised Channels</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs">Proof Progress</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs">Status</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs text-right">Payment Release</TableHead>
                    <TableHead className="py-3 px-5 font-semibold text-gray-500 text-xs text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTask?.applications.map((app) => {
                    const { totalPromised, totalPaid, finalStatus, durationText, platformStatuses } = getAppMetrics(app);

                    return (
                      <TableRow key={app.id} className="border-b border-gray-100 hover:bg-gray-50/10 transition-colors">
                        {/* Influencer Details */}
                        <TableCell className="py-3.5 px-5">
                          <div className="font-semibold text-sm text-gray-800">{app.user?.name || "Unknown"}</div>
                          <div className="text-xs text-gray-400">{app.user?.email || "No email"}</div>
                        </TableCell>

                        {/* Duration */}
                        <TableCell className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>{durationText}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1">
                            Applied: {format(new Date(app.created_at), "yyyy-MM-dd")}
                          </div>
                        </TableCell>

                        {/* Promised Channels */}
                        <TableCell className="py-3.5 px-5">
                          <div className="flex flex-col gap-1">
                            {app.application_promises.map((promise) => (
                              <div key={promise.id} className="flex items-center gap-1 text-xs">
                                <span className="font-bold text-[9px] bg-gray-100 px-1 rounded text-gray-700">{promise.platform}</span>
                                <span className="text-gray-500 font-medium">{promise.promised_reach} reach</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>

                        {/* Proof Progress */}
                        <TableCell className="py-3.5 px-5">
                          <div className="space-y-2">
                            {platformStatuses.map((pStatus) => (
                              <div key={pStatus.platform} className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">{pStatus.platform}</span>
                                <div className="flex gap-1.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[8px] text-gray-500">URL:</span>
                                    {getProofIndicator(pStatus.urlStatus)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[8px] text-gray-500">IMG:</span>
                                    {getProofIndicator(pStatus.imgStatus)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3.5 px-5">
                          {getStatusBadge(finalStatus)}
                        </TableCell>

                        {/* Payment Release */}
                        <TableCell className="py-3.5 px-5 text-right">
                          <div className="font-bold text-sm text-gray-900">
                            Rs. {totalPaid.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                            of Rs. {totalPromised.toLocaleString()}
                          </div>
                          {totalPaid > 0 && totalPaid === totalPromised ? (
                            <span className="inline-block text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.25 rounded mt-1 border border-emerald-100">Released</span>
                          ) : totalPaid > 0 ? (
                            <span className="inline-block text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.25 rounded mt-1 border border-amber-100">Partial</span>
                          ) : (
                            <span className="inline-block text-[9px] font-semibold text-gray-500 bg-gray-50 px-1.5 py-0.25 rounded mt-1 border border-gray-200">Pending</span>
                          )}
                        </TableCell>

                        {/* Direct action to proofs */}
                        <TableCell className="py-3.5 px-5 text-center">
                          <Button
                            onClick={() => router.push(`/dashboard/admin/proofs?search=${app.user?.name || ""}`)}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-gray-200 bg-white hover:bg-gray-50 hover:text-pink-600 font-semibold rounded-lg flex items-center gap-1.5 mx-auto"
                          >
                            Verify Proofs <ExternalLink size={12} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
