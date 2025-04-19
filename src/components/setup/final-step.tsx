"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useSetupStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { setupUserProfile } from "@/lib/utils/user";
import { Badge } from "@/components/ui/badge";

interface FinalStepProps {
  onBack: () => void;
}

export function FinalStep({ onBack }: FinalStepProps) {
  const router = useRouter();
  const { personalInfo, userType } = useSetupStore();
  const [isLoading, setIsLoading] = useState(false);

  if (!personalInfo || !userType) {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-semibold">Missing Information</h2>
        <p className="text-muted-foreground">
          Some required information is missing. Please go back and complete
          previous steps.
        </p>
        <Button onClick={onBack}>Back</Button>
      </div>
    );
  }

  const handleComplete = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Setting up your account...");

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication error. Please try logging in again.", {
          id: toastId
        });
        return;
      }

      // Determine destination based on user type
      const destination = userType === "influencer"
        ? "/dashboard/influencer"
        : "/dashboard/buyer";

      // Create profile
      const { error } = await setupUserProfile({
        userId: user.id,
        name: personalInfo.name,
        role: userType === "influencer" ? ['INFLUENCER'] : ['BUYER'],
        mobile: personalInfo.mobile,
        onError: (error) => {
          toast.error("Failed to setup profile. Please try again.", {
            id: toastId,
            description: error.message,
            richColors: true,
          });
        },
      });

      if (!error) {
        toast.success("Account setup completed successfully!", {
          id: toastId,
        });

        router.push(destination);
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cardVariants = {
    hover: {
      scale: 1.02,
      borderColor: "rgba(236, 72, 153, 0.3)",
      boxShadow: "0 4px 12px -2px rgba(236, 72, 153, 0.1)",
    },
  };

  return (
    <div className="space-y-6">
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600 font-display">
          Review & Complete
        </h2>
        <p className="text-sm text-muted-foreground">
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
        <Card className="overflow-hidden border border-pink-100/50 dark:border-pink-900/50 transition-all duration-200">
          <div className="p-6">
            <h3 className="text-lg font-medium">Profile Summary</h3>
            
            <div className="mt-4 space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Name</span>
                <p className="font-medium">{personalInfo.name}</p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Mobile</span>
                <p className="font-medium">{personalInfo.mobile}</p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Account Type</span>
                <div className="flex items-center mt-1">
                  <Badge 
                    className={
                      userType === "brand"
                        ? "bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:hover:bg-pink-900/60"
                        : "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60"
                    }
                  >
                    {userType === "brand" ? "Brand" : "Influencer"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-pink-50/50 dark:bg-pink-950/20 border-t border-pink-100/50 dark:border-pink-900/50 p-6">
            <div className="flex flex-col space-y-3">
              <h4 className="font-medium">Next Steps</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {userType === "brand" 
                      ? "Create your first campaign to connect with influencers" 
                      : "Browse available tasks and start earning"
                    }
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Complete your profile details for better visibility</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {userType === "brand" 
                      ? "Set up payment methods for smooth transactions" 
                      : "Add portfolio items to showcase your work"
                    }
                  </span>
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
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground"
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
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </Button>
        <Button 
          onClick={handleComplete} 
          disabled={isLoading}
          className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Setting up...
            </span>
          ) : "Complete Setup"}
        </Button>
      </motion.div>
    </div>
  );
}
