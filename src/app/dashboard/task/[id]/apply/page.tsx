"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskApplicationCard } from "@/components/dashboard/task-application-card";
import { format } from "date-fns";
import { toast } from "sonner";
import { parseViewCount, formatViewCount } from "@/lib/utils/views";
import { isUserInfluencer, getUserVerifiedPlatforms } from "@/lib/utils/user";
import { calculateCostClient } from "@/lib/utils/cost";
import { formatDateToNow } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { uploadProofImage } from "@/lib/utils/storage";
import { getProofImageUrl, submitApplicationProofs, getApplicationProofs } from "@/lib/utils/proofs";
import { ProofUpload } from "@/components/ui/proof-upload";

type TaskDetail = Database['public']['Views']['task_details']['Row'];
type InfluencerProfile = Database['public']['Tables']['influencer_profile']['Row'];
type TaskApplication = Database['public']['Tables']['task_applications']['Row'] & {
  application_promises: Database['public']['Tables']['application_promises']['Row'][];
};

export default function TaskApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [verifiedProfiles, setVerifiedProfiles] = useState<InfluencerProfile[]>([]);
  const [selectedViews, setSelectedViews] = useState<Record<string, string>>({});
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

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth');
          return;
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
          .from('task_details')
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
          const { baseCost } = calculateCostClient(
            target.platform,
            selectedViewCount,
            target.due_date ? "flexible" : "flexible", // Using flexible as we're calculating from influencer side
            false // Don't include service fee for influencer earnings
          );
          newEarnings[target.platform] = baseCost;
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
    if (!task?.task_id) return;

    // Validate that at least one platform has views selected
    const hasSelectedViews = Object.values(selectedViews).some(views => parseViewCount(views) > 0);
    if (!hasSelectedViews) {
      toast.error("Please select the number of views you can deliver for at least one platform");
      return;
    }

    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to apply");
        router.push('/auth');
        return;
      }

      // Create task application
      const { data: application, error: applicationError } = await supabase
        .from('task_applications')
        .insert({
          task_id: task.task_id,
          user_id: user.id,
          is_cancelled: false
        })
        .select()
        .single();

      if (applicationError) throw applicationError;

      // Create application promises for each platform where views were selected
      const promises = Object.entries(selectedViews)
        .filter(([_, views]) => parseViewCount(views) > 0)
        .map(([platform, views]) => {
          const { baseCost } = calculateCostClient(
            platform as Database['public']['Enums']['Platforms'],
            views,
            'flexible', // Using flexible since we're calculating from influencer side
            false // Don't include service fee for influencer earnings
          );

          return {
            application_id: application.id,
            platform: platform as Database['public']['Enums']['Platforms'],
            promised_reach: views,
            est_profit: baseCost.toString() // Store estimated earnings
          };
        });

      const { error: promisesError } = await supabase
        .from('application_promises')
        .insert(promises);

      if (promisesError) throw promisesError;

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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!task) {
    return <div className="flex items-center justify-center min-h-screen">Task not found</div>;
  }

  const targets = task.targets as Array<{
    platform: Database['public']['Enums']['Platforms'];
    views: string;
    due_date: string;
  }>;

  // Disable view selection and submission if already applied
  const isReadOnly = !!existingApplication;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Apply for Task</h1>
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${task.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
            ${task.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
          `}>
            {task.status}
          </span>
        </div>
        <p className="text-muted-foreground mt-2">{task.description}</p>
      </div>

      {existingApplication ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">Your Existing Application</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Applied {formatDateToNow(existingApplication.created_at)}</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Active Application
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {existingApplication.application_promises.map((promise, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{promise.platform}</span>
                      <span className="text-lg">{promise.promised_reach} views</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                      <span>Estimated Earnings</span>
                      <span className="font-semibold">${parseFloat(promise.est_profit).toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-700 dark:text-green-300">Total Potential Earnings</span>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      ${calculateTotalEarnings(existingApplication)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Task Details</h3>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Platform Requirements</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {targets?.map((target) => (
                  <TaskApplicationCard
                    key={target.platform}
                    platform={target.platform}
                    targetViews={target.views}
                    dueDate={target.due_date}
                    verifiedProfiles={verifiedProfiles}
                    onViewsChange={(views) => handleViewsChange(target.platform, views)}
                    selectedViews={selectedViews[target.platform] || "0"}
                  />
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Application Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {targets?.map((target) => (
                    <div key={target.platform} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{target.platform}</span>
                        <span className="text-lg">
                          {formatViewCount(calculateTotalViews(target.platform))} / {formatViewCount(parseViewCount(target.views))} views
                        </span>
                      </div>
                      {earnings[target.platform] > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                          <span>Potential Earnings</span>
                          <span className="font-semibold">${earnings[target.platform]}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {Object.values(earnings).some(e => e > 0) && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-700 dark:text-green-300">Total Potential Earnings</span>
                        <span className="text-lg font-bold text-green-700 dark:text-green-300">
                          ${Object.values(earnings).reduce((sum, current) => sum + current, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {existingApplication && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Proofs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Only show platforms that have promises */}
              {existingApplication.application_promises.map((promise) => (
                <div key={promise.platform} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{promise.platform} Proofs</h3>
                    <div className="text-sm text-muted-foreground">
                      Promised: {formatViewCount(parseViewCount(promise.promised_reach))} views
                    </div>
                  </div>
                  
                  <ProofUpload
                    platform={promise.platform}
                    existingProofs={existingProofs[promise.platform] || []}
                    selectedProofs={selectedProofs[promise.platform] || []}
                    proofUrls={proofUrls}
                    onProofAdd={(type, content) => handleProofAdd(promise.platform, type, content)}
                    onProofRemove={(index) => handleProofRemove(promise.platform, index)}
                  />
                </div>
              ))}

              <div className="flex justify-end">
                <Button
                  onClick={handleProofSubmit}
                  disabled={isLoading || Object.keys(selectedProofs).length === 0}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90"
                >
                  {isLoading ? 'Submitting...' : 'Submit Proofs'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Back
        </Button>
        
        {!existingApplication && (
          <Button
            onClick={handleSubmitApplication}
            disabled={isLoading || !Object.values(selectedViews).some(views => parseViewCount(views) > 0)}
            className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90"
          >
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        )}
      </div>
    </div>
  );
}