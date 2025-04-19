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

interface SocialConnectFormProps {
  onBack: () => void;
}

export function SocialConnectForm({ onBack }: SocialConnectFormProps) {
  const router = useRouter();
  const { connectedPlatforms, connectPlatform, personalInfo, userType } = useSetupStore();
  const [isSkipping, setIsSkipping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

      const { error } = await setupUserProfile({
        userId: user.id,
        name: personalInfo.name,
        role: ['INFLUENCER'],
        mobile: personalInfo.mobile,
        onError: (error) => {
          toast.error("Failed to setup profile. Please try again.", {
            id: toastId,
            description: error.message,
            richColors: true
          });
        }
      });

      if (!error) {
        toast.success("Account setup completed successfully!", {
          id: toastId
        });

        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
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

  const cardVariants = {
    hover: { 
      scale: 1.02,
      borderColor: "rgba(236, 72, 153, 0.3)",
      boxShadow: "0 4px 12px -2px rgba(236, 72, 153, 0.1)"
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
        <h2 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600 font-display">
          Connect Your Platforms
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect your social media accounts to start monetizing your content
        </p>
      </motion.div>

      <div className="grid gap-4">
        <motion.div
          whileHover="hover"
          variants={cardVariants}
          transition={{ duration: 0.2 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 border border-pink-100/50 dark:border-pink-900/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/40 w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-red-600 dark:text-red-500">
                    <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                    <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">YouTube</h3>
                  <p className="text-sm text-muted-foreground">Connect your YouTube channel</p>
                </div>
              </div>
              <Button
                variant={connectedPlatforms.youtube ? "ghost" : "default"}
                onClick={() => handleConnect("youtube")}
                disabled={connectedPlatforms.youtube}
                className={connectedPlatforms.youtube ? 
                  "bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                  : "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"}
              >
                {connectedPlatforms.youtube ? (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Connected
                  </div>
                ) : "Connect"}
              </Button>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          whileHover="hover"
          variants={cardVariants}
          transition={{ duration: 0.2 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          
        >
          <Card className="p-6 border border-pink-100/50 dark:border-pink-900/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-600 dark:text-blue-400">
                    <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Facebook</h3>
                  <p className="text-sm text-muted-foreground">Connect your Facebook account</p>
                </div>
              </div>
              <Button
                variant={connectedPlatforms.facebook ? "ghost" : "default"}
                onClick={() => handleConnect("facebook")}
                disabled={connectedPlatforms.facebook}
                className={connectedPlatforms.facebook ? 
                  "bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                  : "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"}
              >
                {connectedPlatforms.facebook ? (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Connected
                  </div>
                ) : "Connect"}
              </Button>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          whileHover="hover"
          variants={cardVariants}
          transition={{ delay: 0.3, duration: 0.3 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 border border-pink-100/50 dark:border-pink-900/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-gray-900 to-black dark:from-gray-900 dark:to-black w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white">
                    <path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">TikTok</h3>
                  <p className="text-sm text-muted-foreground">Connect your TikTok account</p>
                </div>
              </div>
              <Button
                variant={connectedPlatforms.tiktok ? "ghost" : "default"}
                onClick={() => handleConnect("tiktok")}
                disabled={connectedPlatforms.tiktok}
                className={connectedPlatforms.tiktok ? 
                  "bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                  : "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"}
              >
                {connectedPlatforms.tiktok ? (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
          transition={{ delay: 0.4, duration: 0.3 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-yellow-200/50 dark:border-yellow-900/50 rounded-lg p-4 mt-4"
        >
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Note: If you skip connecting your social media accounts, you won't be able to accept tasks until you verify at least one platform. You can always connect them later from your dashboard.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div 
        className="flex justify-between pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isLoading || isSkipping}
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
        {platformsConnected ? (
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
        ) : (
          <Button 
            variant="outline" 
            onClick={handleSkip} 
            disabled={isLoading || isSkipping}
            className="border-pink-200 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900 dark:hover:bg-pink-950 dark:hover:text-pink-300"
          >
            {isSkipping ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Setting up...
              </span>
            ) : "Skip for now"}
          </Button>
        )}
      </motion.div>
    </div>
  );
}