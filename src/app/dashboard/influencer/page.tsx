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

type TaskDetail = Database["public"]["Views"]["task_details"]["Row"];
type InfluencerProfile =
  Database["public"]["Tables"]["influencer_profile"]["Row"];
type TaskApplication =
  Database["public"]["Tables"]["task_applications"]["Row"] & {
    application_promises: Database["public"]["Tables"]["application_promises"]["Row"][];
  };
type AccountBalance = Database["public"]["Tables"]["account_balance"]["Row"];

export default function InfluencerDashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([]);
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null);
  const [appliedTasks, setAppliedTasks] = useState<
    (TaskDetail & { application?: TaskApplication })[]
  >([]);
  const [availableTasks, setAvailableTasks] = useState<
    (TaskDetail & { application?: TaskApplication })[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      // Fetch account balance
      const { data: balanceData } = await supabase
        .from("account_balance")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setAccountBalance(balanceData);

      // Fetch connected social media profiles
      const { data: profilesData } = await supabase
        .from("influencer_profile")
        .select("*")
        .eq("user_id", user.id);

      if (profilesData) {
        setProfiles(profilesData);
      }

      // Fetch available tasks with application status
      const { data: tasksData } = await supabase
        .from("task_details")
        .select(
          `
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
        `
        )
        .eq("status", "ACTIVE");

      if (tasksData) {
        // Split tasks into available and applied
        const available: typeof availableTasks = [];
        const applied: typeof appliedTasks = [];

        tasksData.forEach((task) => {
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
    };

    fetchData();
  }, [supabase, router]);

  const handleLogout = async () => {
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-pink-50/30 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600 font-['P22MackinacPro-Bold']">
            Influencer Dashboard
          </h1>
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            disabled={isLoading}
            className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                Logging out...
              </>
            ) : "Logout"}
          </Button>
        </div>

        {/* Account Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8 overflow-hidden border border-pink-100 dark:border-pink-900/20">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-pink-500/5 to-transparent"/>
            <CardHeader>
              <CardTitle className="font-['P22MackinacPro-Medium']">Account Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Current Balance</h3>
                  <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 font-['P22MackinacPro-Bold']">
                    Rs. {(accountBalance?.balance || 0).toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-['P22MackinacPro-Bold']">
                    Rs. {(accountBalance?.total_earning || 0).toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Last Withdrawal</h3>
                  <div className="text-lg font-['P22MackinacPro-Medium']">
                    {accountBalance?.last_withdrawal 
                      ? new Date(accountBalance.last_withdrawal).toLocaleDateString()
                      : 'No withdrawals yet'}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button 
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
                  disabled={(accountBalance?.balance || 0) <= 0}
                >
                  Request Withdrawal
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connected Social Media Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="mb-8 border border-pink-100 dark:border-pink-900/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-['P22MackinacPro-Medium']">Connected Social Media Accounts</CardTitle>
              <Button
                onClick={() => router.push("/verify/youtube")}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
              >
                Connect New Account
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile) => (
                  <motion.div
                    key={profile.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-4 border border-pink-100 dark:border-pink-900/20 hover:shadow-lg transition-all">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white overflow-hidden ${
                            !profile.profile_pic
                              ? getPlatformColor(profile.platform)
                              : ""
                          }`}
                        >
                          {profile.profile_pic ? (
                            <img
                              src={profile.profile_pic}
                              alt={profile.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            profile.platform.charAt(0)
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold font-['P22MackinacPro-Medium']">{profile.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {profile.followers} followers
                          </p>
                          <Badge
                            variant={profile.is_verified ? "success" : "secondary"}
                            className={profile.is_verified ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}
                          >
                            {profile.is_verified ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Applied Tasks */}
        {appliedTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="mb-8 border border-pink-100 dark:border-pink-900/20">
              <CardHeader>
                <CardTitle className="font-['P22MackinacPro-Medium']">Your Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {appliedTasks.map((task) => (
                    <motion.div
                      key={task.task_id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className="group hover:border-pink-400 dark:hover:border-pink-500 transition-all cursor-pointer bg-white dark:bg-gray-900"
                        onClick={() => router.push(`/dashboard/task/${task.task_id}/apply`)}
                      >
                        <CardContent className="p-6">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-lg font-['P22MackinacPro-Medium']">{task.title}</h3>
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              >
                                Applied
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {task.description}
                            </p>
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Your Commitments:</h4>
                              <div className="flex flex-wrap gap-2">
                                {task.application?.application_promises.map(
                                  (promise, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="flex items-center gap-2 border-pink-200 dark:border-pink-800"
                                    >
                                      <span>{promise.platform}:</span>
                                      <span className="font-medium">
                                        {promise.promised_reach} views
                                      </span>
                                      <span className="text-green-600">
                                        (Rs. {parseFloat(promise.est_profit).toFixed(2)})
                                      </span>
                                    </Badge>
                                  )
                                )}
                              </div>
                              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-green-700 dark:text-green-300">
                                    Total Potential Earnings
                                  </span>
                                  <span className="text-lg font-bold text-green-700 dark:text-green-300 font-['P22MackinacPro-Bold']">
                                    Rs.
                                    {task.application
                                      ? calculateTotalEarnings(task.application).toFixed(2)
                                      : "0.00"}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">
                                Applied on:{" "}
                                {new Date(task.application?.created_at || "").toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Available Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600 font-['P22MackinacPro-Bold']">
                Available Tasks
              </h2>
              <p className="text-muted-foreground mt-1">
                Discover new opportunities to grow and earn
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
              onClick={() => router.push("/dashboard/tasks/browse")}
            >
              Browse All Tasks
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableTasks.map((task) => (
              <motion.div
                key={task.task_id}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:border-pink-400 dark:hover:border-pink-500 cursor-pointer bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm h-[420px] flex flex-col"
                  onClick={() => router.push(`/dashboard/task/${task.task_id}/apply`)}
                >
                  {/* Decorative gradient elements */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -right-20 -top-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-300" />
                  
                  <CardContent className="p-6 relative z-10 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg font-['P22MackinacPro-Medium'] group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-2">
                            {task.title}
                          </h3>
                          <Badge 
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                          >
                            {task.status}
                          </Badge>
                        </div>
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white shadow-lg ml-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>

                      <div className="space-y-3 flex-1">
                        <p className="text-sm font-medium text-pink-600 dark:text-pink-400">Target Platforms</p>
                        <div className="flex flex-wrap gap-2">
                          {task.targets &&
                            (task.targets as any[]).map((target: any, index: number) => (
                              <Badge
                                key={index}
                                className="px-3 py-1 bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800"
                              >
                                <span className="mr-1">{target.platform}:</span>
                                <span className="font-semibold">{target.views.toLocaleString()} views</span>
                              </Badge>
                            ))}
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 mt-auto">
                        <div className="flex items-center space-x-2">
                          <span className="flex h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm text-muted-foreground">Active Campaign</span>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyToTask(task.task_id!);
                          }}
                          className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-shadow"
                        >
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
