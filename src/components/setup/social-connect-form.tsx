"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSetupStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
    // TODO: Implement other platform connections
    connectPlatform(platform);
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

      // Create profile
      const { error: profileError } = await supabase
        .from('profile')
        .insert({
          id: user.id,
          name: personalInfo.name,
          role: ['INFLUENCER'], // Since this is the influencer flow
        });

      if (profileError) {
        toast.error("Failed to create profile. Please try again.", {
          id: toastId,
          description: profileError.message,
          richColors: true
        });
        throw profileError;
      }

      // Create contact details for mobile
      const { error: contactError } = await supabase
        .from('contact_details')
        .insert({
          user_id: user.id,
          type: 'MOBILE',
          detail: personalInfo.mobile,
        });

      if (contactError) {
        toast.error("Failed to save contact details. Please try again.", {
          id: toastId,
          description: contactError.message,
          richColors: true
        });
        throw contactError;
      }

      toast.success("Account setup completed successfully!", {
        id: toastId
      });

      router.push('/dashboard');
      router.refresh();
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Connect Your Platforms</h2>
        <p className="text-sm text-muted-foreground">
          Connect your social media accounts to start monetizing your content
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 dark:bg-red-900 w-12 h-12 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-red-600">
                  <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
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
            >
              {connectedPlatforms.youtube ? "Connected" : "Connect"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-600">
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
            >
              {connectedPlatforms.facebook ? "Connected" : "Connect"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-black w-12 h-12 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white">
                  <path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
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
            >
              {connectedPlatforms.tiktok ? "Connected" : "Connect"}
            </Button>
          </div>
        </Card>
      </div>

      {!platformsConnected && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 mt-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Note: If you skip connecting your social media accounts, you won't be able to accept tasks until you verify at least one platform.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isLoading || isSkipping}>
          Back
        </Button>
        {platformsConnected ? (
          <Button onClick={handleComplete} disabled={isLoading}>
            {isLoading ? "Setting up..." : "Complete Setup"}
          </Button>
        ) : (
          <Button variant="outline" onClick={handleSkip} disabled={isLoading || isSkipping}>
            {isSkipping ? "Setting up..." : "Skip for now"}
          </Button>
        )}
      </div>
    </div>
  );
}