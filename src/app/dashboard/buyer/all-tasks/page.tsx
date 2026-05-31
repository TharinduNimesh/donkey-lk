"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { Json } from "@/types/database.types";
import {
  ClipboardList,
  Plus,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  X,
  ArrowUpDown,
} from "lucide-react";
import { BuyerSidebar, BuyerTopbar } from "@/components/dashboard/buyer-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PINK = "#C8185A";

type TaskDetail = {
  task_id: number | null;
  title: string | null;
  description: string | null;
  status: Database["public"]["Enums"]["TaskStatus"] | null;
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

type StatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "COMPLETED" | "ARCHIVED";

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ACTIVE:    { label: "Active",    color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
  DRAFT:     { label: "Draft",     color: "#6b7280", bg: "#f3f4f6", icon: Clock },
  COMPLETED: { label: "Completed", color: "#0ea5e9", bg: "#f0f9ff", icon: CheckCircle2 },
  ARCHIVED:  { label: "Archived",  color: "#d97706", bg: "#fffbeb", icon: Archive },
};

export default function AllTasksPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [tasks, setTasks] = useState<TaskDetail[]>([]);
  const [filtered, setFiltered] = useState<TaskDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az">("newest");

  useEffect(() => {
    const fetchTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data, error } = await supabase
        .from("task_details_view")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setTasks(data || []);
      setIsLoading(false);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    let f = [...tasks];
    if (search) f = f.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "ALL") f = f.filter(t => t.status === statusFilter);
    f.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (sortBy === "oldest") return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      return (a.title || "").localeCompare(b.title || "");
    });
    setFiltered(f);
  }, [tasks, search, statusFilter, sortBy]);

  const statusCounts = (["ALL", "ACTIVE", "DRAFT", "COMPLETED", "ARCHIVED"] as StatusFilter[]).map(s => ({
    key: s,
    count: s === "ALL" ? tasks.length : tasks.filter(t => t.status === s).length,
  }));

  const totalBudget = tasks.reduce((sum, t) => {
    const cost = t.cost as { amount: number } | null;
    return sum + (cost?.amount || 0);
  }, 0);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <BuyerSidebar activePage="tasks" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <BuyerTopbar
          title="All Tasks"
          actions={
            <Button
              onClick={() => router.push("/dashboard/buyer/tasks/create")}
              className="h-9 px-4 text-sm font-semibold text-white rounded-lg shadow-sm"
              style={{ background: PINK }}
            >
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Task</span>
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">

          {/* Page header */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">All Tasks</h1>
            <p className="text-sm text-gray-400 mt-0.5">Track and manage all your influencer campaigns.</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-1">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-1">Active</p>
              <p className="text-2xl font-bold" style={{ color: "#16a34a" }}>
                {tasks.filter(t => t.status === "ACTIVE").length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-1">Completed</p>
              <p className="text-2xl font-bold" style={{ color: "#0ea5e9" }}>
                {tasks.filter(t => t.status === "COMPLETED").length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-1">Total Budget</p>
              <p className="text-lg font-bold" style={{ color: PINK }}>
                Rs. {totalBudget.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="pl-9 h-9 bg-white border-gray-200 rounded-lg text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div className="flex gap-1.5 flex-wrap">
              {statusCounts.map(({ key, count }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    statusFilter === key
                      ? "text-white border-transparent shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                  style={statusFilter === key ? { background: PINK } : {}}
                >
                  {key === "ALL" ? "All" : STATUS_META[key]?.label ?? key}
                  <span className={`ml-1.5 text-[10px] ${statusFilter === key ? "text-white/70" : "text-gray-400"}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-pink-300"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="az">A → Z</option>
              </select>
            </div>
          </div>

          {/* Task list */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-dashed border-gray-200">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gray-100">
                <ClipboardList className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-base font-semibold text-gray-700">
                {search || statusFilter !== "ALL" ? "No tasks match your filters" : "No tasks yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                {search || statusFilter !== "ALL"
                  ? "Try clearing your search or selecting a different status."
                  : "Create your first campaign task to start tracking influencer growth."}
              </p>
              {!search && statusFilter === "ALL" && (
                <button
                  onClick={() => router.push("/dashboard/buyer/tasks/create")}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm"
                  style={{ background: PINK }}
                >
                  <Plus className="h-4 w-4" /> Create first task
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Table header — desktop */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span>Task</span>
                <span>Status</span>
                <span>Budget</span>
                <span>Created</span>
                <span></span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {filtered.map(task => {
                  const cost = task.cost as { amount: number } | null;
                  const budget = cost?.amount || 0;
                  const meta = STATUS_META[task.status ?? "DRAFT"] ?? STATUS_META.DRAFT;
                  const Icon = meta.icon;

                  return (
                    <div
                      key={task.task_id}
                      className="flex md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors group"
                      onClick={() => router.push(`/dashboard/task/${task.task_id}`)}
                    >
                      {/* Task info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: meta.bg }}
                        >
                          <Icon className="h-4 w-4" style={{ color: meta.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
                          <p className="text-xs text-gray-400 truncate hidden sm:block">{task.description}</p>
                        </div>
                      </div>

                      {/* Status — hidden on mobile, inline chip on sm */}
                      <div className="hidden md:flex items-center">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {meta.label}
                        </span>
                      </div>

                      {/* Budget */}
                      <div className="hidden md:block">
                        <p className="text-sm font-semibold text-gray-700">Rs. {budget.toLocaleString()}</p>
                      </div>

                      {/* Created */}
                      <div className="hidden md:block">
                        <p className="text-xs text-gray-400">{formatDate(task.created_at)}</p>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </div>

                      {/* Mobile: status chip inline */}
                      <div className="md:hidden">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="flex items-center justify-between text-xs text-gray-400 pt-2 pb-4">
            <span>© {new Date().getFullYear()} BrandSync Platform. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <button className="hover:text-gray-600">Terms</button>
              <button className="hover:text-gray-600">Privacy</button>
              <button className="hover:text-gray-600">Support</button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
