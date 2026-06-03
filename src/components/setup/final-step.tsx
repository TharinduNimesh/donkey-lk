"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useSetupStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { setupUserProfile } from "@/lib/utils/user";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

interface FinalStepProps {
  onBack: () => void;
}

export function FinalStep({ onBack }: FinalStepProps) {
  const router = useRouter();
  const { personalInfo, userType } = useSetupStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const [apiCompleted, setApiCompleted] = useState(false);
  const [loaderCompleted, setLoaderCompleted] = useState(false);

  const phases = [
    { text: "Validating profile details" },
    { text: "Configuring database settings" },
    { text: "Finalizing dashboard setup" }
  ];

  useEffect(() => {
    if (apiCompleted && loaderCompleted) {
      setIsNavigating(true);
      
      const destination = userType === "influencer"
        ? "/dashboard/influencer"
        : "/dashboard/buyer";

      router.refresh();
      router.push(destination);
    }
  }, [apiCompleted, loaderCompleted, userType, router]);

  const handleComplete = async () => {
    setShowLoader(true);
    setIsLoading(true);
    setApiCompleted(false);
    setLoaderCompleted(false);

    const toastId = toast.loading("Setting up your account...");

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if we have all required data
      if (!user) {
        toast.error("Authentication error. Please sign in again.", {
          id: toastId
        });
        setShowLoader(false);
        setIsLoading(false);
        router.push('/auth');
        return;
      }

      if (!personalInfo?.name || !personalInfo?.mobile || !userType) {
        toast.error("Required information is missing. Please complete all fields.", {
          id: toastId
        });
        setShowLoader(false);
        setIsLoading(false);
        return;
      }

      // Create profile
      const { error } = await setupUserProfile({
        userId: user.id,
        name: personalInfo.name,
        role: userType === "influencer" ? ['INFLUENCER'] : ['BUYER'],
        mobile: personalInfo.mobile,
        onError: (error) => {
          toast.error("Failed to setup profile. Please try again.", {
            id: toastId,
            description: error?.message || "Unknown error occurred",
            richColors: true,
          });
        },
      });

      if (error) {
        setShowLoader(false);
        setIsLoading(false);
        return;
      }
      
      // Success - show toast
      toast.success("Account setup completed successfully!", {
        id: toastId,
      });

      setApiCompleted(true);
      
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("An unexpected error occurred. Please try again.", {
        id: toastId,
      });
      setShowLoader(false);
      setIsLoading(false);
    }
  };

  // If missing info but not yet submitted, just automatically go back instead of showing error
  if (!isNavigating && (!personalInfo || !userType)) {
    // Navigate back silently
    setTimeout(() => onBack(), 0);
    
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-pink-500 rounded-full mb-4"></div>
        <p className="text-muted-foreground">Loading your information...</p>
      </div>
    );
  }

  const cardVariants = {
    hover: {
      scale: 1.01,
      borderColor: "rgba(236, 72, 153, 0.3)",
      boxShadow: "0 4px 12px -2px rgba(236, 72, 153, 0.1)",
    },
  };

  return (
    <div className="space-y-6">
      <MultiStepLoader 
        loadingStates={phases} 
        loading={showLoader} 
        duration={900} 
        loop={false} 
        theme="pink" 
        onComplete={() => setLoaderCompleted(true)}
      />
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600 font-display">
          Review & Complete
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
          Review your information before completing your setup
        </p>
      </motion.div>

      <motion.div
        whileHover="hover"
        variants={cardVariants}
        transition={{ delay: 0.1, duration: 0.3 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border border-pink-100/50 dark:border-pink-900/50 transition-all duration-200 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xs">
          <div className="p-6">
            <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider">Profile Summary</h3>
            
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 py-2 border-b border-gray-50 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Name</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 text-right">{personalInfo?.name}</span>
              </div>
              
              <div className="grid grid-cols-2 py-2 border-b border-gray-50 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Mobile</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 text-right">{personalInfo?.mobile}</span>
              </div>
              
              <div className="grid grid-cols-2 py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Account Type</span>
                <div className="flex justify-end items-center">
                  <Badge 
                    className={
                      userType === "brand"
                        ? "bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900/45 dark:text-pink-300 dark:hover:bg-pink-900/60 font-bold uppercase text-[9px] tracking-wider"
                        : "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/45 dark:text-purple-300 dark:hover:bg-purple-900/60 font-bold uppercase text-[9px] tracking-wider"
                    }
                  >
                    {userType === "brand" ? "Brand" : "Influencer"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-pink-50/20 dark:bg-pink-950/10 border-t border-pink-100/50 dark:border-pink-900/50 p-6">
            <div className="flex flex-col space-y-3">
              <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-300 uppercase tracking-wider">Next Steps</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start text-gray-550 dark:text-zinc-400">
                  <svg className="w-4 h-4 text-pink-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {userType === "brand" 
                      ? "Create your first campaign to connect with influencers" 
                      : "Browse available tasks and start earning"
                    }
                  </span>
                </li>
                <li className="flex items-start text-gray-550 dark:text-zinc-400">
                  <svg className="w-4 h-4 text-pink-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Complete your profile details for better visibility</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div 
        className="flex justify-between pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isLoading || isNavigating}
          className="text-muted-foreground hover:text-foreground font-semibold text-xs uppercase tracking-wider"
        >
          <svg
            className="mr-2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </Button>
        <Button 
          onClick={handleComplete} 
          disabled={isLoading || isNavigating}
          className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold text-xs uppercase tracking-wider h-10 px-6"
        >
          Complete Setup
        </Button>
      </motion.div>
    </div>
  );
}
