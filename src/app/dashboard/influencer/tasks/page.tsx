"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { InfluencerTaskCard } from "@/components/dashboard/influencer-task-card";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Search,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfluencerSidebar, InfluencerTopbar } from "@/components/dashboard/influencer-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
};

export default function InfluencerTasksPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const [isLoading, setIsLoading] = useState(true);
  const [availableTasks, setAvailableTasks] = useState<(TaskDetail & { application?: TaskApplication })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredTasks, setFilteredTasks] = useState<(TaskDetail & { application?: TaskApplication })[]>([]);
  const [hasIncompleteTask, setHasIncompleteTask] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/auth"); return; }

        const { data: incomplete, error: incompleteError } = await supabase.rpc('has_incomplete_applications');
        setHasIncompleteTask(!incompleteError && incomplete === true);

        const { data: tasksData, error: tasksError } = await supabase.from("task_details_view").select(`
          *,
          applications:task_applications(
            id, created_at, is_cancelled,
            application_promises(platform, promised_reach, est_profit)
          )
        `).eq("status", "ACTIVE");

        if (tasksData) {
          const available: typeof availableTasks = [];
          tasksData.forEach((task) => {
            const applications = task.applications as TaskApplication[];
            const userApplication = applications?.find(app => !app.is_cancelled);
            if (!userApplication) available.push({ ...task, application: userApplication });
          });
          setAvailableTasks(available);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
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
    // Default sort by newest
    filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    setFilteredTasks(filtered);
    setCurrentPage(1);
  }, [availableTasks, searchQuery, platformFilter]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <InfluencerSidebar activePage="tasks" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <InfluencerTopbar title="Available Tasks" />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Available Tasks</h2>
                <p className="text-xs text-gray-500 mt-0.5">Find opportunities that match your profile.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="h-8 pl-8 text-xs bg-white" />
                </div>
                <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="h-8 text-xs border border-gray-200 rounded-md px-2 bg-white text-gray-600 outline-none">
                  <option value="ALL">All Platforms</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="FACEBOOK">Facebook</option>
                </select>
              </div>
            </div>
            
            <div className="p-5">
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-64 bg-gray-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {hasIncompleteTask && (
                    <div className="mb-5 bg-pink-50 border border-pink-100 rounded-lg p-3 flex gap-3 items-start">
                      <AlertCircle className="h-5 w-5 text-pink-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-pink-900">Complete Your Current Task</p>
                        <p className="text-xs text-pink-700 mt-0.5">You must finish active tasks before applying to new ones.</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {currentTasks.map((task) => (
                      <InfluencerTaskCard key={task.task_id} task={task} />
                    ))}
                    {filteredTasks.length === 0 && (
                      <div className="col-span-full text-center py-12 border border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500">
                          {availableTasks.length === 0 ? "No tasks available at the moment." : "No tasks match your search criteria."}
                        </p>
                      </div>
                    )}
                  </div>

                  {filteredTasks.length > ITEMS_PER_PAGE && (
                    <PaginationControls
                      currentPage={currentPage} totalPages={totalPages}
                      onFirstPage={() => setCurrentPage(1)}
                      onPrevPage={() => setCurrentPage(p => Math.max(1, p - 1))}
                      onNextPage={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      onLastPage={() => setCurrentPage(totalPages)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
