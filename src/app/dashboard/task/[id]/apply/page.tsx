"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { toast } from "sonner";
import { parseViewCount, formatViewCount } from "@/lib/utils/views";
import { isUserInfluencer, getUserVerifiedPlatforms } from "@/lib/utils/user";
import { calculateCostClient } from "@/lib/utils/cost";
import { uploadProofImage } from "@/lib/utils/storage";
import { getProofImageUrl, submitApplicationProofs, getApplicationProofs } from "@/lib/utils/proofs";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Check, DollarSign, ArrowUpRight, Clock } from "lucide-react";
import { formatDateToNow } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProofUpload } from "@/components/ui/proof-upload";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Database } from "@/types/database.types";
import { 
  TaskDetailsCard,
  ExistingApplicationCard,
  PlatformRequirementsCard,
  ApplicationSummaryCard,
  ProofSubmissionSection,
  PlatformIcon
} from "@/components/dashboard/task-application";
import Link from "next/link";

type TaskDetail = Database["public"]["Views"]["task_details_view"]["Row"];
type InfluencerProfile = Database["public"]["Tables"]["influencer_profile"]["Row"];
type TaskApplication = Database["public"]["Tables"]["task_applications"]["Row"] & {
  application_promises: Database["public"]["Tables"]["application_promises"]["Row"][];
};

export default function TaskApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Remove 'target' from localStorage if source=home in query
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const source = url.searchParams.get("source");
      if (source === "home") {
        localStorage.removeItem("target");
      }
    }
  }, []);

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [verifiedProfiles, setVerifiedProfiles] = useState<InfluencerProfile[]>([]);
  const [selectedViews, setSelectedViews] = useState<Record<string, string>>({});
  // Store remaining views per platform
  const [remainingViews, setRemainingViews] = useState<Record<string, number>>({});
  const [selectedProofs, setSelectedProofs] = useState<Record<string, Array<{
    type: Database["public"]["Enums"]["ProofType"];
    content: string;
  }>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState<Record<string, number>>({});
  const [existingApplication, setExistingApplication] = useState<TaskApplication | null>(null);
  const [existingProofs, setExistingProofs] = useState<Record<string, Array<{
    type: Database["public"]["Enums"]["ProofType"];
    content: string;
    status?: Database["public"]["Enums"]["ProofStatus"];
    reviewedAt?: string | null;
  }>>>({});
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [hasIncompleteTask, setHasIncompleteTask] = useState(false);

  const supabase = createClientComponentClient<Database>();

  // Generate view options up to the per-influencer cap (now 20k)
  const getAvailableViewOptions = (platform: string) => {
    // Limit max selectable views to 20,000 per influencer
    const max = remainingViews[platform] !== undefined
      ? Math.min(remainingViews[platform], 20000)
      : 0;
    if (!max || max < 1000) return [];
    // Generate breakpoints to offer useful increments up to 20k
    const breakpoints = [1000, 2000, 3000, 5000, 10000, 20000];
    const options = breakpoints
      .filter(bp => bp <= max)
      .map(bp => ({ value: String(bp), label: bp >= 1000 ? `${bp / 1000}K` : String(bp) }));
    // If max is not an exact breakpoint and less than the cap, add it as last option
    const cap = 20000;
    if (max < cap && !breakpoints.includes(max)) {
      options.push({ value: String(max), label: formatViewCount(max) });
    }
    return options;
  };

  useEffect(() => {
    const fetchRemainingViews = async (taskId: number, platforms: string[]) => {
      const result: Record<string, number> = {};
      for (const platform of platforms) {
        const { data, error } = await supabase.rpc('get_remaining_views', {
          p_task_id: taskId,
          p_platform: platform as Database["public"]["Enums"]["Platforms"]
        });
        let count = 0;
        if (data && !error) {
          count = parseInt(data as string, 10);
        }
        result[platform] = isNaN(count) ? 0 : count;
      }
      setRemainingViews(result);
    };

    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        // Check for incomplete applications
        const { data: incomplete, error: incompleteError } = await supabase.rpc('has_incomplete_applications');
        if (!incompleteError && incomplete === true) {
          setHasIncompleteTask(true);
        } else {
          setHasIncompleteTask(false);
        }

        // Verify user is an influencer
        const isInfluencer = await isUserInfluencer(user.id);
        if (!isInfluencer) {
          toast.error("Only influencers can apply to tasks");
          router.push('/dashboard');
          return;
        }

        // Fetch task details with application status
        const { data: taskData, error: taskError } = await supabase
          .from('task_details_view')
          .select(`
            *,
            applications:task_applications(
              id,
              created_at,
              is_cancelled,
              user_id,
              application_promises(
                platform,
                promised_reach,
                est_profit,
                created_at
              )
            )
          `)
          .eq('task_id', parseInt(id))
          .single();

        if (taskError) throw taskError;
        setTask(taskData);

        // Fetch remaining views for each platform
        const targets = taskData.targets as Array<{
          platform: Database['public']['Enums']['Platforms'];
          views: string;
        }>;
        if (taskData.task_id && targets?.length) {
          await fetchRemainingViews(taskData.task_id, targets.map(t => t.platform));
        }

        // Check for existing application
        const applications = taskData.applications as TaskApplication[];
        const userApplication = applications?.find(app => app.user_id === user.id && !app.is_cancelled);
        if (userApplication) {
          setExistingApplication(userApplication);
          // Initialize selected views from existing application
          const initialViews = userApplication.application_promises.reduce((acc, promise) => ({
            ...acc,
            [promise.platform]: promise.promised_reach
          }), {});
          setSelectedViews(initialViews);
          setEarnings(userApplication.application_promises.reduce((acc, promise) => ({
            ...acc,
            [promise.platform]: parseFloat(promise.est_profit)
          }), {}));

          // If there's an existing application, fetch its proofs
          const proofs = await getApplicationProofs(userApplication.id);
          if (proofs) {
            const proofsByPlatform = proofs.reduce((acc: Record<string, Array<{
              type: Database["public"]["Enums"]["ProofType"];
              content: string;
              status?: Database["public"]["Enums"]["ProofStatus"];
              reviewedAt?: string | null;
            }>>, proof) => ({
              ...acc,
              [proof.platform]: [
                ...(acc[proof.platform] || []),
                {
                  type: proof.proof_type,
                  content: proof.content,
                  status: proof.proof_status?.status,
                  reviewedAt: proof.proof_status?.reviewed_at
                }
              ]
            }), {});
            setExistingProofs(proofsByPlatform);
          }
        }

        // Fetch verified profiles
        const profiles = await getUserVerifiedPlatforms(user.id);
        setVerifiedProfiles(profiles);

        // Initialize selected views if no existing application
        if (!userApplication) {
          const targets = taskData.targets as Array<{
            platform: Database['public']['Enums']['Platforms'];
            views: string;
          }>;
          const initialViews = targets.reduce((acc, target) => ({
            ...acc,
            [target.platform]: "0"
          }), {});
          setSelectedViews(initialViews);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Error fetching task details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, supabase, router]);

  useEffect(() => {
    const calculateEarnings = () => {
      const newEarnings: Record<string, number> = {};
      const targets = task?.targets as Array<{
        platform: Database['public']['Enums']['Platforms'];
        views: string;
        due_date: string;
      }>;
      targets?.forEach((target) => {
        const selectedViewCount = selectedViews[target.platform] || "0";
        if (selectedViewCount !== "0") {
          const { estimatedProfit } = calculateCostClient(
            target.platform,
            selectedViewCount,
            target.due_date ? "flexible" : "flexible", // Using flexible as we're calculating from influencer side
            false // Don't include service fee for influencer earnings
          );
          newEarnings[target.platform] = estimatedProfit;
        }
      });
      setEarnings(newEarnings);
    };

    calculateEarnings();
  }, [selectedViews, task]);

  useEffect(() => {
    const loadImageUrls = async () => {
      const newUrls: Record<string, string> = {};
      for (const [platform, proofs] of Object.entries(existingProofs)) {
        for (const proof of proofs) {
          if (proof.type === 'IMAGE' && proof.content) {
            const url = await getProofImageUrl(proof.content);
            if (url) {  // Only add the URL if it's not null
              newUrls[proof.content] = url;
            }
          }
        }
      }
      setProofUrls(newUrls);
    };

    if (Object.keys(existingProofs).length > 0) {
      loadImageUrls();
    }
  }, [existingProofs]);

  const handleViewsChange = (platform: string, views: string) => {
    setSelectedViews(prev => ({
      ...prev,
      [platform]: views
    }));
  };

  const handleProofAdd = (platform: string, type: Database["public"]["Enums"]["ProofType"], content: string) => {
    setSelectedProofs(prev => ({
      ...prev,
      [platform]: [...(prev[platform] || []), { type, content }]
    }));
  };

  const handleProofRemove = (platform: string, index: number) => {
    setSelectedProofs(prev => ({
      ...prev,
      [platform]: prev[platform]?.filter((_, i) => i !== index) || []
    }));
  };

  const handleProofSubmit = async () => {
    if (!existingApplication?.id) {
      toast.error("No active application found");
      return;
    }

    setIsLoading(true);
    try {
      // Upload image proofs if any
      const proofPromises = Object.entries(selectedProofs).flatMap(([platform, proofs]) =>
        proofs.map(async proof => {
          if (proof.type === 'IMAGE') {
            // Convert base64 to blob while preserving MIME type
            const base64Response = await fetch(proof.content);
            const blob = await base64Response.blob();
            
            // Create file with proper MIME type
            const file = new File([blob], 'proof.jpg', { type: blob.type });
            const filePath = await uploadProofImage(file);
            
            return {
              platform: platform as Database["public"]["Enums"]["Platforms"],
              proofType: proof.type,
              content: filePath
            };
          }
          return {
            platform: platform as Database["public"]["Enums"]["Platforms"],
            proofType: proof.type,
            content: proof.content
          };
        })
      );

      const resolvedProofs = await Promise.all(proofPromises);

      try {
        await submitApplicationProofs(existingApplication.id, resolvedProofs);
        toast.success("Proofs submitted successfully!");
        
        // Reset selected proofs after successful submission
        setSelectedProofs({});
        
        // Refresh the page to show new proofs
        router.refresh();
      } catch (err: any) {
        // Handle unique constraint violation
        if (err.message?.includes('application_proofs_platform_type_app_unique')) {
          toast.error("You can only submit one proof of each type per platform");
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error('Error submitting proofs:', error);
      toast.error("Failed to submit proofs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalViews = (platform: string) => {
    return parseViewCount(selectedViews[platform] || "0");
  };

  const calculateTotalEarnings = (application: TaskApplication) => {
    return application.application_promises.reduce((total, promise) => 
      total + parseFloat(promise.est_profit), 0
    );
  };

  const handleSubmitApplication = async () => {
    if (isTaskFull) {
      toast.error('This task is already full and cannot accept more applications.');
      return;
    }
    // Validate selected views do not exceed remaining or 20k
    for (const platform of Object.keys(selectedViews)) {
      const selected = parseViewCount(selectedViews[platform]);
      const max = remainingViews[platform] !== undefined ? Math.min(remainingViews[platform], 20000) : 0;
      if (selected > max) {
        toast.error(`You cannot promise more than ${formatViewCount(max)} views for ${platform}`);
        return;
      }
    }
    setIsLoading(true);
    try {
      // Check if user has selected at least one platform
      const hasSelectedPlatform = Object.values(selectedViews).some(
        (views) => parseViewCount(views) > 0
      );

      if (!hasSelectedPlatform) {
        toast.error("Please select at least one platform and view count");
        return;
      }

      if (!task?.task_id) {
        toast.error("Task information is missing");
        return;
      }

      // Submit application through API endpoint
      const response = await fetch('/api/task-applications/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.task_id,
          selectedViews
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      toast.success("Application submitted successfully!");
      router.push('/dashboard/influencer'); // Redirect to influencer dashboard
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full animate-ping bg-pink-400/20" />
            <div className="relative animate-spin w-full h-full rounded-full border-4 border-pink-500 border-t-transparent" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Loading Task Details</h3>
            <p className="text-muted-foreground">Please wait while we fetch the task information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-xl bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Task Not Found</h2>
            <p className="text-muted-foreground">The requested task could not be found or may have been removed.</p>
          </div>
          <Button 
            onClick={() => router.back()}
            className="bg-pink-600 hover:bg-pink-700 text-white shadow-sm hover:shadow-md transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const targets = task.targets as Array<{
    platform: Database['public']['Enums']['Platforms'];
    views: string;
    due_date: string;
  }>;

  const isReadOnly = !!existingApplication;

  // Calculate progress percentage
  const progress = task && task.total_promised_views && task.total_target_views
    ? Math.min(Math.round((task.total_promised_views / task.total_target_views) * 100), 100)
    : 0;
  const isTaskFull = progress === 100;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {(!existingApplication && hasIncompleteTask) && (
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
        {isTaskFull && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 border border-red-300 text-red-800 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800 flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>This task is already full and cannot accept more applications.</span>
          </div>
        )}
        {/* Header with back button */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/influencer")}
            className="mr-4 p-2 h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Task Application
            </h1>
            <p className="text-sm text-muted-foreground">
              Apply to this task or manage your existing application
            </p>
          </div>
        </motion.div>

        {/* Task details card */}
        <TaskDetailsCard task={task} />

        {existingApplication ? (
          <ExistingApplicationCard application={existingApplication} />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <PlatformRequirementsCard 
                targets={targets} 
                verifiedProfiles={verifiedProfiles} 
                selectedViews={selectedViews} 
                earnings={earnings}
                onViewsChange={handleViewsChange} 
                getAvailableViewOptions={getAvailableViewOptions}
              />

              {existingApplication ? null : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-medium">Growth Opportunity Note:</span> While we initially limit the promised reach to 20,000 views per platform, this threshold increases as you build your track record. Successfully completing tasks unlocks opportunities to handle larger view counts, enabling you to maximize your earning potential on our platform.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <ApplicationSummaryCard 
                targets={targets}
                selectedViews={selectedViews}
                earnings={earnings}
                calculateTotalViews={calculateTotalViews}
              />
            </motion.div>
          </>
        )}

        {existingApplication && (
          <ProofSubmissionSection
            application={existingApplication}
            existingProofs={existingProofs}
            selectedProofs={selectedProofs}
            proofUrls={proofUrls}
            onProofAdd={handleProofAdd}
            onProofRemove={handleProofRemove}
            onProofSubmit={handleProofSubmit}
            isLoading={isLoading}
          />
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex justify-between mt-5"
        >
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/influencer")}
            className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            Back
          </Button>
          
          {!existingApplication && (
            <Button
              onClick={handleSubmitApplication}
              disabled={isLoading || !Object.values(selectedViews).some(views => parseViewCount(views) > 0) || hasIncompleteTask}
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                  Submitting...
                </>
              ) : 'Submit Application'}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}