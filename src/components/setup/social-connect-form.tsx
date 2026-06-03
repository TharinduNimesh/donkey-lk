"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSetupStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { setupUserProfile } from "@/lib/utils/user";
import { cn } from "@/lib/utils";

interface SocialConnectFormProps {
  onBack: () => void;
}

export function SocialConnectForm({ onBack }: SocialConnectFormProps) {
  const router = useRouter();
  const { connectedPlatforms, personalInfo, userType } = useSetupStore();
  const [isSkipping, setIsSkipping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupPhase, setSetupPhase] = useState(0);

  const handleConnect = (platform: "youtube" | "facebook" | "tiktok") => {
    if (platform === "youtube") {
      router.push("/verify/youtube");
      return;
    }
    if (platform === "facebook") {
      router.push("/verify/facebook");
      return;
    }
    if (platform === "tiktok") {
      router.push("/verify/tiktok");
      return;
    }
  };

  const createProfile = async () => {
    if (!personalInfo || !userType) {
      toast.error("Missing required information. Please go back and fill in all fields.");
      return;
    }

    setIsLoading(true);
    setSetupPhase(0);

    const phaseInterval = setInterval(() => {
      setSetupPhase((prev) => {
        if (prev < 2) return prev + 1;
        return prev;
      });
    }, 900);

    const toastId = toast.loading("Setting up your account...");

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        clearInterval(phaseInterval);
        toast.error("Authentication error. Please try logging in again.", {
          id: toastId
        });
        return;
      }

      // Determine destination based on user type
      const destination = userType === "influencer"
        ? "/dashboard/influencer"
        : "/dashboard/buyer";

      const { error } = await setupUserProfile({
        userId: user.id,
        name: personalInfo.name,
        role: userType === "influencer" ? ['INFLUENCER'] : ['BUYER'],
        mobile: personalInfo.mobile,
        onError: (error) => {
          clearInterval(phaseInterval);
          toast.error("Failed to setup profile. Please try again.", {
            id: toastId,
            description: error.message,
            richColors: true
          });
        }
      });

      if (!error) {
        clearInterval(phaseInterval);
        setSetupPhase(2);
        toast.success("Account setup completed successfully!", {
          id: toastId
        });

        // Force navigation to the appropriate dashboard
        setTimeout(() => {
          window.location.href = destination;
        }, 500);
      } else {
        clearInterval(phaseInterval);
        setIsLoading(false);
        setIsSkipping(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      clearInterval(phaseInterval);
      toast.error("An unexpected error occurred. Please try again.", {
        id: toastId
      });
      setIsLoading(false);
      setIsSkipping(false);
    }
  };

  const handleSkip = () => {
    setIsSkipping(true);
    createProfile();
  };

  const handleComplete = () => {
    createProfile();
  };

  const platformsConnected = Object.values(connectedPlatforms).some(Boolean);

  if (isLoading || isSkipping) {
    const phases = [
      "Validating profile details",
      "Configuring database settings",
      "Finalizing dashboard setup"
    ];
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
        </div>
        <div className="w-full max-w-xs space-y-3 pt-2">
          {phases.map((phase, idx) => {
            const isDone = setupPhase > idx;
            const isActive = setupPhase === idx;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0.5, x: -5 }}
                animate={{ 
                  opacity: isActive || isDone ? 1 : 0.4,
                  x: 0,
                  scale: isActive ? 1.02 : 1
                }}
                className="flex items-center space-x-3 text-xs"
              >
                {isDone ? (
                  <div className="h-4.5 w-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm shadow-emerald-200 dark:shadow-emerald-950">✓</div>
                ) : isActive ? (
                  <div className="h-4.5 w-4.5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                ) : (
                  <div className="h-4.5 w-4.5 rounded-full border border-gray-200 dark:border-zinc-800"></div>
                )}
                <span className={cn(
                  "font-bold transition-all duration-300",
                  isDone 
                    ? "text-emerald-600 dark:text-emerald-400 line-through opacity-70" 
                    : isActive 
                    ? "text-purple-600 dark:text-purple-400" 
                    : "text-gray-450 dark:text-zinc-550 font-medium"
                )}>
                  {phase}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  const cardVariants = {
    hover: { 
      scale: 1.015,
      borderColor: "rgba(139, 92, 246, 0.3)",
      boxShadow: "0 4px 12px -2px rgba(139, 92, 246, 0.08)"
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-550 to-purple-650 font-display">
          Connect Your Platforms
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
          Connect your social media accounts to start monetizing your content
        </p>
      </motion.div>

      <div className="grid gap-4">
        {/* YouTube */}
        <motion.div
          whileHover="hover"
          variants={cardVariants}
          transition={{ duration: 0.2 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4.5 border border-purple-100/50 dark:border-purple-900/30 transition-all duration-200 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-900/20 w-11 h-11 rounded-full flex items-center justify-center shadow-2xs">
                  <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 text-red-600 dark:text-red-500">
                    <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                    <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-zinc-200">YouTube</h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-550 font-medium">Verify your channel status</p>
                </div>
              </div>
              <Button
                variant={connectedPlatforms.youtube ? "ghost" : "outline"}
                onClick={() => handleConnect("youtube")}
                disabled={connectedPlatforms.youtube}
                className={cn(
                  "h-9 text-xs font-bold uppercase tracking-wider px-4 transition-all duration-200",
                  connectedPlatforms.youtube 
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30"
                    : "bg-purple-50/40 text-purple-650 border border-purple-150 hover:bg-purple-50/80 hover:text-purple-700 dark:bg-purple-950/10 dark:text-purple-400 dark:border-purple-900/30 dark:hover:bg-purple-950/20"
                )}
              >
                {connectedPlatforms.youtube ? (
                  <div className="flex items-center space-x-1">
                    <svg className="w-3.5 h-3.5 mr-1 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Connected
                  </div>
                ) : "Connect"}
              </Button>
            </div>
          </Card>
        </motion.div>
        
        {/* Facebook */}
        <motion.div
          whileHover="hover"
          variants={cardVariants}
          transition={{ duration: 0.2 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4.5 border border-purple-100/50 dark:border-purple-900/30 transition-all duration-200 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-900/20 w-11 h-11 rounded-full flex items-center justify-center shadow-2xs">
                  <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 text-blue-600 dark:text-blue-400">
                    <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-zinc-200">Facebook</h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-550 font-medium">Verify your profile status</p>
                </div>
              </div>
              <Button
                variant={connectedPlatforms.facebook ? "ghost" : "outline"}
                onClick={() => handleConnect("facebook")}
                disabled={connectedPlatforms.facebook}
                className={cn(
                  "h-9 text-xs font-bold uppercase tracking-wider px-4 transition-all duration-200",
                  connectedPlatforms.facebook 
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30"
                    : "bg-purple-50/40 text-purple-650 border border-purple-150 hover:bg-purple-50/80 hover:text-purple-700 dark:bg-purple-950/10 dark:text-purple-400 dark:border-purple-900/30 dark:hover:bg-purple-950/20"
                )}
              >
                {connectedPlatforms.facebook ? (
                  <div className="flex items-center space-x-1">
                    <svg className="w-3.5 h-3.5 mr-1 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Connected
                  </div>
                ) : "Connect"}
              </Button>
            </div>
          </Card>
        </motion.div>
        
        {/* TikTok */}
        <motion.div
          whileHover="hover"
          variants={cardVariants}
          transition={{ delay: 0.05, duration: 0.2 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4.5 border border-purple-100/50 dark:border-purple-900/30 transition-all duration-200 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-gray-900 to-black dark:from-gray-900 dark:to-black w-11 h-11 rounded-full flex items-center justify-center shadow-2xs">
                  <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 text-white">
                    <path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-zinc-200">TikTok</h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-550 font-medium">Verify your TikTok account</p>
                </div>
              </div>
              <Button
                variant={connectedPlatforms.tiktok ? "ghost" : "outline"}
                onClick={() => handleConnect("tiktok")}
                disabled={connectedPlatforms.tiktok}
                className={cn(
                  "h-9 text-xs font-bold uppercase tracking-wider px-4 transition-all duration-200",
                  connectedPlatforms.tiktok 
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30"
                    : "bg-purple-50/40 text-purple-650 border border-purple-150 hover:bg-purple-50/80 hover:text-purple-700 dark:bg-purple-950/10 dark:text-purple-400 dark:border-purple-900/30 dark:hover:bg-purple-950/20"
                )}
              >
                {connectedPlatforms.tiktok ? (
                  <div className="flex items-center space-x-1">
                    <svg className="w-3.5 h-3.5 mr-1 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Connected
                  </div>
                ) : "Connect"}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {!platformsConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border border-yellow-200/40 dark:border-yellow-900/30 rounded-xl p-4 mt-4"
        >
          <div className="flex items-start space-x-3">
            <svg className="w-4.5 h-4.5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-normal">
              Note: You can skip connecting platforms for now, but you must link and verify at least one social media account before accepting advertiser tasks.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div 
        className="flex justify-between pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isLoading || isSkipping}
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
        {platformsConnected ? (
          <Button 
            onClick={handleComplete} 
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold text-xs uppercase tracking-wider h-10 px-6"
          >
            Complete Setup
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={handleSkip} 
            disabled={isLoading || isSkipping}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-950/20 font-bold text-xs uppercase tracking-wider h-10 px-6"
          >
            Skip for now
          </Button>
        )}
      </motion.div>
    </div>
  );
}