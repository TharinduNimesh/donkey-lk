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
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TaskDetail = Database["public"]["Views"]["task_details_view"]["Row"];
type InfluencerProfile = Database["public"]["Tables"]["influencer_profile"]["Row"];
type TaskApplication = Database["public"]["Tables"]["task_applications"]["Row"] & {
  application_promises: Database["public"]["Tables"]["application_promises"]["Row"][];
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

  const viewOptions = [
    { value: '1000', label: '1K' },
    { value: '5000', label: '5K' },
    { value: '10000', label: '10K' },
    { value: '20000', label: '20K' },
    { value: '25000', label: '25K' },
    { value: '50000', label: '50K' },
  ];

  const getAvailableViewOptions = (targetViews: string) => {
    const targetViewCount = parseViewCount(targetViews);
    return viewOptions.filter(option => parseInt(option.value) <= targetViewCount);
  };

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
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-pink-50/30 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto">
            <div className="animate-spin w-full h-full rounded-full border-4 border-pink-500 border-t-transparent" />
          </div>
          <p className="text-muted-foreground">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-pink-50/30 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-pink-600">Task Not Found</h2>
          <p className="text-muted-foreground">The requested task could not be found.</p>
          <Button 
            onClick={() => router.back()}
            className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90"
          >
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

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 font-['Roboto']">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {task?.title}
            </h1>
            <Badge className={`
              px-3 py-1 rounded-full text-sm pointer-events-none select-none
              ${task?.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
              ${task?.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
            `}>
              {task?.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{task?.description}</p>
        </div>

        {existingApplication ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-6 border border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="font-medium">Your Application</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Applied {formatDateToNow(existingApplication.created_at)}</span>
                    <Badge variant="outline" className="pointer-events-none select-none bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      Active Application
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4">
                    {existingApplication.application_promises.map((promise, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white
                                  ${promise.platform === 'YOUTUBE' ? 'bg-red-500' :
                                    promise.platform === 'FACEBOOK' ? 'bg-blue-600' :
                                    promise.platform === 'TIKTOK' ? 'bg-black' :
                                    'bg-pink-500'}`}
                                >
                                  {promise.platform === 'YOUTUBE' && (
                                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                                      <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                                      <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                  )}
                                  {promise.platform === 'FACEBOOK' && (
                                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                                      <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                  )}
                                  {promise.platform === 'TIKTOK' && (
                                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                                      <path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                                    </svg>
                                  )}
                                </div>
                                <span className="font-medium">{promise.platform}</span>
                              </div>
                              <span className="text-lg">{formatViewCount(parseViewCount(promise.promised_reach))} views</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                              <span>Estimated Earnings</span>
                              <span className="font-medium">Rs. {parseFloat(promise.est_profit).toFixed(2)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}

                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-700 dark:text-green-300">Total Potential Earnings</span>
                        <span className="text-lg font-medium text-green-700 dark:text-green-300">
                          Rs. {calculateTotalEarnings(existingApplication).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">Platform Requirements</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {targets?.map((target, index) => (
                    <motion.div
                      key={target.platform}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white
                                ${target.platform === 'YOUTUBE' ? 'bg-red-500' :
                                  target.platform === 'FACEBOOK' ? 'bg-blue-600' :
                                  target.platform === 'TIKTOK' ? 'bg-black' :
                                  'bg-pink-500'}`}
                              >
                                {target.platform === 'YOUTUBE' && (
                                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                                    <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                                    <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                  </svg>
                                )}
                                {target.platform === 'FACEBOOK' && (
                                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                                    <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                  </svg>
                                )}
                                {target.platform === 'TIKTOK' && (
                                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                                    <path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                                  </svg>
                                )}
                              </div>
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">{target.platform}</h3>
                            </div>
                            {verifiedProfiles.some(p => p.platform === target.platform) ? (
                              <Badge className="pointer-events-none select-none bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="pointer-events-none select-none border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400">
                                Not Verified
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Target Views</span>
                              <span className="font-medium text-foreground">{formatViewCount(parseViewCount(target.views))}</span>
                            </div>

                            {target.due_date && (
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Due Date</span>
                                <span className="font-medium text-foreground">
                                  {format(new Date(target.due_date), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            )}

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">Promised Reach</label>
                              <Select
                                value={selectedViews[target.platform] || "0"}
                                onValueChange={(value) => handleViewsChange(target.platform, value)}
                                disabled={!verifiedProfiles.some(p => p.platform === target.platform)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select promised views" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">Select promised views</SelectItem>
                                  {getAvailableViewOptions(target.views).map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {!verifiedProfiles.some(p => p.platform === target.platform) && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                  Please verify your {target.platform} account to apply
                                </p>
                              )}
                            </div>

                            {earnings[target.platform] > 0 && (
                              <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-green-700 dark:text-green-300">Potential Earnings</span>
                                  <span className="font-medium text-green-700 dark:text-green-300">
                                    Rs. {earnings[target.platform].toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              <Card className="border border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>Your Application Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {targets?.map((target) => (
                      <motion.div
                        key={target.platform}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="border border-gray-200 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-800 transition-all">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{target.platform}</span>
                              <span className="text-lg">
                                {formatViewCount(calculateTotalViews(target.platform))} / {formatViewCount(parseViewCount(target.views))} views
                              </span>
                            </div>
                            {earnings[target.platform] > 0 && (
                              <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                                <span>Potential Earnings</span>
                                <span className="font-medium">Rs. {earnings[target.platform].toFixed(2)}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    {Object.values(earnings).some(e => e > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-green-700 dark:text-green-300">Total Potential Earnings</span>
                            <span className="text-lg font-medium text-green-700 dark:text-green-300">
                              Rs. {Object.values(earnings).reduce((sum, current) => sum + current, 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {existingApplication && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="mb-6 border border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="font-medium">Submit Proofs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {existingApplication.application_promises.map((promise, index) => (
                    <motion.div
                      key={promise.platform}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{promise.platform} Proofs</h3>
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
                    </motion.div>
                  ))}

                  <div className="flex justify-end">
                    <Button
                      onClick={handleProofSubmit}
                      disabled={isLoading || Object.keys(selectedProofs).length === 0}
                      className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                          Submitting...
                        </>
                      ) : 'Submit Proofs'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex justify-between"
        >
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            Back
          </Button>
          
          {!existingApplication && (
            <Button
              onClick={handleSubmitApplication}
              disabled={isLoading || !Object.values(selectedViews).some(views => parseViewCount(views) > 0)}
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