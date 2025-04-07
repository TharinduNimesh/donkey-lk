"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSetupStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { getChannelInfo } from "./actions";
import { setupUserProfile } from "@/lib/utils/user";
import { type ChannelInfo, verifyYouTubeChannel, generateVerificationCode, checkYouTubeVerification } from "@/lib/utils/youtube";

type VerificationStep = "initial" | "description" | "checking" | "verified";

export default function YouTubeVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connectPlatform, personalInfo } = useSetupStore();
  
  const urlStep = searchParams.get('step') as VerificationStep | null;
  const urlChannel = searchParams.get('channel');
  const [channelUrl, setChannelUrl] = useState(urlChannel || "");
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVerificationOptions, setShowVerificationOptions] = useState(false);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(urlStep || "initial");
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "failed">("pending");

  const updateUrlParams = (step: VerificationStep, channel?: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('step', step);
    if (channel) {
      params.set('channel', channel);
    }
    router.push(`/verify/youtube?${params.toString()}`);
  };

  useEffect(() => {
    const step = searchParams.get('step') as VerificationStep;
    const channel = searchParams.get('channel');
    
    if (step && step !== verificationStep) {
      setVerificationStep(step);
    }
    
    if (channel && channel !== channelUrl) {
      setChannelUrl(channel);
      if (!channelInfo) {
        handleChannelLoad();
      }
    }
  }, [searchParams]);

  const handleChannelLoad = async () => {
    setLoading(true);
    try {
      const { data, error } = await getChannelInfo(channelUrl);
      
      if (error) {
        toast.error(error);
        return;
      }

      if (data) {
        setChannelInfo(data);
        setShowVerificationOptions(false);
        updateUrlParams("initial", channelUrl);
      }
    } catch (error) {
      toast.error("Failed to load channel information");
    } finally {
      setLoading(false);
    }
  };

  const startVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication error. Please try logging in again.");
        return;
      }

      const toastId = toast.loading("Setting up your account...");

      const { error: setupError } = await setupUserProfile({
        userId: user.id,
        name: personalInfo?.name || channelInfo?.title || '',
        role: ['INFLUENCER'],
        mobile: personalInfo?.mobile,
        onError: (error) => {
          toast.error("Failed to setup profile. Please try again.", {
            id: toastId,
            description: error.message,
            richColors: true
          });
        }
      });

      if (setupError) {
        return;
      }

      const result = await verifyYouTubeChannel(channelUrl, user.id, channelInfo);
      
      toast.success("Profile created successfully!", { id: toastId });
      setShowVerificationOptions(true);
    } catch (error) {
      console.error('Error starting verification:', error);
      toast.error("Failed to initialize verification process. Please try again.");
    }
  };

  const handleDescriptionVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication error. Please try logging in again.");
        return;
      }

      // Get the influencer profile ID first
      const { data: profiles } = await supabase
        .from('influencer_profile')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', 'YOUTUBE')
        .eq('url', channelUrl);

      if (!profiles || profiles.length === 0) {
        toast.error("Profile not found. Please try again.");
        return;
      }

      // Use the first profile ID for verification
      const profileId = profiles[0].id;

      // Request verification code
      const { code } = await generateVerificationCode(profileId);
      setVerificationCode(code);
      setVerificationStep("description");
      setShowVerificationOptions(false);
      updateUrlParams("description", channelUrl);
    } catch (error) {
      console.error('Error generating verification code:', error);
      toast.error("Failed to generate verification code. Please try again.");
    }
  };

  const handleManualVerification = () => {
    toast.info(
      "Manual verification request submitted",
      {
        description: "Our team will contact you within 24-48 hours to verify your channel ownership.",
      }
    );
  };

  const checkVerification = async () => {
    if (!channelInfo) {
      toast.error("Channel info not found. Please try again.");
      return;
    }

    setVerificationStep("checking");
    setVerificationStatus("pending");
    updateUrlParams("checking", channelUrl);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication error. Please try logging in again.");
        return;
      }

      await checkYouTubeVerification(user.id, channelUrl);

      setVerificationStep("verified");
      setVerificationStatus("success");
      updateUrlParams("verified", channelUrl);
      
      connectPlatform("youtube");
      
      toast.success("YouTube channel verified successfully!");
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationStatus("failed");
      toast.error("Verification failed. Please try again.");
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Verify Your YouTube Channel</h1>
        <p className="text-muted-foreground">
          Enter your YouTube channel URL to begin the verification process
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Channel URL</h3>
            <div className="flex gap-4">
              <Input
                placeholder="https://youtube.com/c/yourchannel"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
              />
              <Button onClick={() => handleChannelLoad()} disabled={loading || !channelUrl}>
                {loading ? "Loading..." : "Load Channel"}
              </Button>
            </div>
          </div>

          {channelInfo && verificationStep === "initial" && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={channelInfo.thumbnail || "https://via.placeholder.com/150"}
                  alt={channelInfo.title}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{channelInfo.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {channelInfo.subscribers} subscribers
                  </p>
                </div>
              </div>
              <Button onClick={startVerification} className="w-full">
                Start Verification
              </Button>
            </div>
          )}

          {showVerificationOptions && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Choose Verification Method</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4 cursor-pointer hover:border-primary transition-colors" onClick={handleDescriptionVerification}>
                  <div className="space-y-2">
                    <h4 className="font-medium">Description Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      Quick verification by adding a unique code to your channel's About section
                    </p>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Instant verification
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Add verification code to channel description
                      </li>
                    </ul>
                  </div>
                </Card>

                <Card className="p-4 cursor-pointer hover:border-primary transition-colors" onClick={handleManualVerification}>
                  <div className="space-y-2">
                    <h4 className="font-medium">Administrative Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      Verification through our administrative team for special cases
                    </p>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Personal assistance
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        24-48 hour response time
                      </li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {verificationStep === "description" && verificationCode && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg">Follow these steps to verify your channel:</h3>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-100 dark:bg-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                    <div className="space-y-1">
                      <p className="font-medium">Go to your YouTube channel's About section</p>
                      <p className="text-sm text-muted-foreground">Click the "Customize Channel" button, then go to the "Basic info" tab</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-100 dark:bg-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                    <div className="space-y-1">
                      <p className="font-medium">Add this verification code to your channel description:</p>
                      <div className="bg-white dark:bg-background p-3 rounded border">
                        <code className="text-sm font-mono">#{verificationCode}</code>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                        navigator.clipboard.writeText(`#${verificationCode}`);
                        toast.success("Verification code copied to clipboard");
                      }}>
                        Copy Code
                      </Button>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-100 dark:bg-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                    <div className="space-y-1">
                      <p className="font-medium">Save your changes and click "Check Now"</p>
                      <p className="text-sm text-muted-foreground">Make sure to publish your changes before verification</p>
                    </div>
                  </li>
                </ol>
              </div>
              <Button onClick={checkVerification} className="w-full">
                Check Now
              </Button>
            </div>
          )}

          {verificationStep === "checking" && verificationStatus === "pending" && (
            <div className="text-center p-8 space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="font-medium">Checking your channel...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          )}

          {verificationStep === "checking" && verificationStatus === "failed" && (
            <div className="text-center p-8 space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">Verification Failed</h3>
              <p className="text-muted-foreground">We couldn't find the verification code in your channel description.</p>
              <div className="space-y-2">
                <p className="text-sm">Make sure you:</p>
                <ul className="text-sm text-left list-disc pl-8 space-y-1">
                  <li>Added the exact verification code to your channel description</li>
                  <li>Saved your channel changes</li>
                  <li>Published the changes (they may take a few minutes to appear)</li>
                </ul>
              </div>
              <Button onClick={checkVerification} className="mt-4">
                Try Again
              </Button>
            </div>
          )}

          {verificationStep === "verified" && verificationStatus === "success" && (
            <div className="text-center p-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">Verification Successful!</h3>
              <p className="text-muted-foreground">Your YouTube channel has been verified successfully.</p>
              <Button onClick={() => router.push("/dashboard")} className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </Card>

      {verificationStep !== "verified" && (
        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      )}
    </div>
  );
}