"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";
import { InfluencerTaskCard } from "@/components/dashboard/influencer-task-card";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const ITEMS_PER_PAGE = 6;

const BlobSVG = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 200 200"
    className="absolute bottom-0 left-0 w-48 h-48 -mb-12 -ml-12 opacity-15"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feComposite in="SourceGraphic" in2="coloredBlur" operator="over"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path
      fill={color}
      filter="url(#glow)"
      d="M52.8,-75.5C68.7,-67.4,81.9,-52.3,89.3,-34.4C96.7,-16.5,98.2,4.3,92.7,23.2C87.2,42.1,74.7,59,58.3,70.3C41.9,81.6,21,87.2,0.7,86.2C-19.5,85.2,-39,77.6,-56.1,66.1C-73.2,54.6,-87.9,39.2,-94.1,20.7C-100.4,2.2,-98.2,-19.4,-88.6,-36.3C-79,-53.2,-62,-65.4,-44.6,-72.7C-27.2,-80,-13.6,-82.4,2.9,-86.8C19.4,-91.2,38.8,-97.7,52.8,-75.5Z"
      transform="translate(100 100)"
    />
  </svg>
);

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
    <Button
      variant="outline"
      size="sm"
      onClick={onFirstPage}
      disabled={currentPage === 1}
      className="h-8 w-8 p-0 rounded-md border border-gray-200 dark:border-gray-800"
    >
      <ChevronsLeft className="h-4 w-4" />
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={onPrevPage}
      disabled={currentPage === 1}
      className="h-8 w-8 p-0 rounded-md border border-gray-200 dark:border-gray-800"
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <div className="text-sm font-medium px-4">
      Page {currentPage} of {totalPages}
    </div>
    <Button
      variant="outline"
      size="sm"
      onClick={onNextPage}
      disabled={currentPage === totalPages}
      className="h-8 w-8 p-0 rounded-md border border-gray-200 dark:border-gray-800"
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={onLastPage}
      disabled={currentPage === totalPages}
      className="h-8 w-8 p-0 rounded-md border border-gray-200 dark:border-gray-800"
    >
      <ChevronsRight className="h-4 w-4" />
    </Button>
  </div>
);

type TaskDetail = Database["public"]["Views"]["task_details_view"]["Row"];
type InfluencerProfile = Database["public"]["Tables"]["influencer_profile"]["Row"];
type TaskApplication = Database["public"]["Tables"]["task_applications"]["Row"] & {
  application_promises: Database["public"]["Tables"]["application_promises"]["Row"][];
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

export default function InfluencerDashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

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
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([]);
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null);
  const [appliedTasks, setAppliedTasks] = useState<
    (TaskDetail & { application?: TaskApplication })[]
  >([]);
  const [availableTasks, setAvailableTasks] = useState<
    (TaskDetail & { application?: TaskApplication })[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("created_at_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredTasks, setFilteredTasks] = useState<(TaskDetail & { application?: TaskApplication })[]>([]);
  const [hasIncompleteTask, setHasIncompleteTask] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth");
          return;
        }

        // Check for incomplete applications
        const { data: incomplete, error: incompleteError } = await supabase.rpc('has_incomplete_applications');
        if (!incompleteError && incomplete === true) {
          setHasIncompleteTask(true);
        } else {
          setHasIncompleteTask(false);
        }

        // Use Promise.all to fetch all data in parallel
        const [
          balanceResponse,
          verifiedProfilesResponse,
          pendingVerificationsResponse,
          tasksResponse
        ] = await Promise.all([
          // Fetch account balance
          supabase
            .from("account_balance")
            .select("*")
            .eq("user_id", user.id)
            .single(),
          
          // Fetch verified profiles
          supabase
            .from("influencer_profile")
            .select("*")
            .eq("user_id", user.id),
          
          // Fetch pending verifications
          supabase
            .from("influencer_profile_verification_requests")
            .select("*")
            .eq("user_id", user.id)
            .neq("platform", "YOUTUBE"),
          
          // Fetch available tasks with application status
          supabase
            .from("task_details_view")
            .select(`
              *,
              applications:task_applications(
                id,
                created_at,
                is_cancelled,
                application_promises(
                  platform,
                  promised_reach,
                  est_profit
                )
              )
            `)
            .eq("status", "ACTIVE")
        ]);

        setAccountBalance(balanceResponse.data);

        // Combine verified and pending profiles
        const allPlatforms: ConnectedPlatform[] = [
          ...(verifiedProfilesResponse.data?.map(profile => ({
            type: 'verified' as const,
            id: profile.id,
            platform: profile.platform,
            name: profile.name,
            followers: profile.followers,
            profile_pic: profile.profile_pic,
            is_verified: profile.is_verified,
            url: profile.url
          })) || []),
          ...(pendingVerificationsResponse.data?.map(request => ({
            type: 'pending' as const,
            id: request.id,
            platform: request.platform,
            is_verified: false,
            url: request.profile_url
          })) || [])
        ];

        setConnectedPlatforms(allPlatforms);

        if (tasksResponse.data) {
          // Split tasks into available and applied
          const available: typeof availableTasks = [];
          const applied: typeof appliedTasks = [];

          tasksResponse.data.forEach((task) => {
            const applications = task.applications as TaskApplication[];
            const userApplication = applications?.find(
              (app) => !app.is_cancelled
            );

            const taskWithApp = {
              ...task,
              application: userApplication,
            };

            if (userApplication) {
              applied.push(taskWithApp);
            } else {
              available.push(taskWithApp);
            }
          });

          setAvailableTasks(available);
          setAppliedTasks(applied);
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

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        task =>
          task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply platform filter
    if (platformFilter !== "ALL") {
      filtered = filtered.filter(task => {
        const targets = task.targets as Array<{ platform: Database['public']['Enums']['Platforms'] }> | null;
        return targets?.some(target => target.platform === platformFilter);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created_at_desc":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "created_at_asc":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "title_asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "");
        default:
          return 0;
      }
    });

    setFilteredTasks(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [availableTasks, searchQuery, platformFilter, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const handleLogout = async () => {
    console.log("Logging out...");
    setIsLoading(true);
    const { error } = await signOut();
    if (!error) {
      router.push("/auth");
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleApplyToTask = (taskId: number) => {
    router.push(`/dashboard/task/${taskId}/apply`);
  };

  const getPlatformColor = (
    platform: Database["public"]["Enums"]["Platforms"]
  ) => {
    const colors = {
      YOUTUBE: "bg-red-500",
      FACEBOOK: "bg-blue-600",
      INSTAGRAM: "bg-pink-500",
      TIKTOK: "bg-black",
    };
    return colors[platform] || "bg-gray-500";
  };

  const calculateTotalEarnings = (application: TaskApplication) => {
    return application.application_promises.reduce(
      (total, promise) => total + parseFloat(promise.est_profit),
      0
    );
  };

  const handleWithdrawal = () => {
    router.push("/withdraw");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-950">
        <div className="container mx-auto py-8 px-4">
          {/* Header skeleton */}
          <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse mb-8" />
          
          {/* Stats cards skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden border border-gray-100 dark:border-gray-800">
                <CardHeader>
                  <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-2" />
                  <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Connected platforms skeleton */}
          <div className="mb-12">
            <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-6" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border border-gray-100 dark:border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tasks section skeleton */}
          <div className="mb-12">
            <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-6" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[420px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="container mx-auto py-8 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Influencer Dashboard
          </h1>
          <div className="flex gap-4">
            <Link href="/dashboard/influencer/platforms">
              <Button 
                className="bg-pink-600 hover:bg-pink-700 text-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                Connect New Account
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              disabled={isLoading}
              className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12"
        >
          <Card className="border-0 bg-pink-50 dark:bg-pink-950/20 overflow-hidden relative">
            <BlobSVG color="#ec4899" />
            <CardHeader>
              <CardTitle className="text-pink-900 dark:text-pink-100">Available Balance</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex flex-col">
                <p className="text-4xl font-bold text-pink-700 dark:text-pink-300">
                  Rs. {(accountBalance?.balance || 0).toFixed(2)}
                </p>
                <p className="text-sm text-pink-600/80 dark:text-pink-300/80 mt-1">
                  Available for withdrawal
                </p>
                {(accountBalance?.balance || 0) < 1000 ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        className="mt-4 bg-pink-600 hover:bg-pink-700 text-white"
                      >
                        Withdraw Funds
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Minimum Withdrawal Amount</h4>
                        <p className="text-sm text-muted-foreground">
                          You need a minimum balance of Rs. 1,000 to make a withdrawal. Your current balance is Rs. {(accountBalance?.balance || 0).toFixed(2)}.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Button
                    onClick={handleWithdrawal}
                    className="mt-4 bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    Withdraw Funds
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-blue-50 dark:bg-blue-950/20 overflow-hidden relative">
            <BlobSVG color="#0ea5e9" />
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                Rs. {(accountBalance?.total_earning || 0).toFixed(2)}
              </p>
              <p className="text-sm text-blue-600/80 dark:text-blue-300/80 mt-1">Lifetime earnings</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-indigo-50 dark:bg-indigo-950/20 overflow-hidden relative">
            <BlobSVG color="#6366f1" />
            <CardHeader>
              <CardTitle className="text-indigo-900 dark:text-indigo-100">Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-4xl font-bold text-indigo-700 dark:text-indigo-300">
                {connectedPlatforms.length}
              </p>
              <p className="text-sm text-indigo-600/80 dark:text-indigo-300/80 mt-1">Active platforms</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connected Social Media Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Connected Platforms</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connectedPlatforms.map((platform) => (
              <motion.div
                key={`${platform.type}-${platform.id}`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border border-gray-200 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-800 transition-all bg-white dark:bg-gray-900">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white overflow-hidden ${
                          !platform.profile_pic
                            ? getPlatformColor(platform.platform)
                            : ""
                        }`}
                      >
                        {platform.profile_pic ? (
                          <img
                            src={platform.profile_pic}
                            alt={platform.name || 'Profile'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          platform.platform.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {platform.name || 'Unknown'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {platform.followers ? `${platform.followers} followers` : 'Pending verification'}
                        </p>
                        <Badge
                          variant={platform.is_verified ? "success" : "secondary"}
                          className={`pointer-events-none select-none ${
                            platform.is_verified
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {platform.type === 'pending' ? 'Verification Requested' : (platform.is_verified ? "Verified" : "Pending")}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Applied Tasks */}
        {appliedTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Active Applications</h2>
                <p className="text-muted-foreground mt-1">Tasks you've applied for</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {appliedTasks.map((task, index) => (
                <motion.div
                  key={task.task_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <InfluencerTaskCard task={task} application={task.application} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tasks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Available Tasks</h2>
              <p className="text-muted-foreground mt-1">Find opportunities that match your profile</p>
            </div>
          </div>
          {hasIncompleteTask && (
            <div className="mb-6">
              <Alert variant="destructive" className="bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-900 flex items-center">
                <AlertCircle className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                <div>
                  <AlertTitle className="text-pink-700 dark:text-pink-300">Complete Your Current Task</AlertTitle>
                  <AlertDescription>
                    You must complete your already applied task before applying for new tasks. As your profile grows, you can handle more tasks at once.
                  </AlertDescription>
                </div>
              </Alert>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentTasks.map((task, index) => (
              <motion.div
                key={task.task_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <InfluencerTaskCard task={task} />
              </motion.div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  {availableTasks.length === 0 
                    ? "No tasks available at the moment. Check back later!"
                    : "No tasks match your search criteria."
                  }
                </p>
              </div>
            )}
          </div>

          {filteredTasks.length > ITEMS_PER_PAGE && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onFirstPage={() => setCurrentPage(1)}
              onPrevPage={() => setCurrentPage(p => Math.max(1, p - 1))}
              onNextPage={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              onLastPage={() => setCurrentPage(totalPages)}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
