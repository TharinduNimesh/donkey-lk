"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSetupStore } from "@/lib/store";

interface ChannelInfo {
  title: string;
  subscribers: string;
  thumbnail: string;
}

type VerificationStep = "initial" | "description" | "checking" | "verified";

export default function YouTubeVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connectPlatform } = useSetupStore();
  
  // Initialize states from URL parameters
  const urlStep = searchParams.get('step') as VerificationStep | null;
  const urlChannel = searchParams.get('channel');
  const [channelUrl, setChannelUrl] = useState(urlChannel || "");
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVerificationOptions, setShowVerificationOptions] = useState(false);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(urlStep || "initial");
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "failed">("pending");

  // Generate verification code only when needed
  const generateVerificationCode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `DonkeyLKVerify${random}${timestamp}`;
  };

  // Update URL when step changes
  const updateUrlParams = (step: VerificationStep, channel?: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('step', step);
    if (channel) {
      params.set('channel', channel);
    }
    router.push(`/verify/youtube?${params.toString()}`);
  };

  // Handle direct URL access and browser back/forward
  useEffect(() => {
    const step = searchParams.get('step') as VerificationStep;
    const channel = searchParams.get('channel');
    
    if (step && step !== verificationStep) {
      setVerificationStep(step);
    }
    
    if (channel && channel !== channelUrl) {
      setChannelUrl(channel);
      // Load channel info if URL contains channel
      if (!channelInfo) {
        handleChannelLoad(channel);
      }
    }
  }, [searchParams]);

  const handleChannelLoad = async (url?: string) => {
    setLoading(true);
    try {
      // TODO: Implement actual YouTube API call
      const channelToLoad = url || channelUrl;
      setChannelInfo({
        title: "Demo Channel",
        subscribers: "10K",
        thumbnail: "https://via.placeholder.com/150"
      });
      setShowVerificationOptions(false);
      updateUrlParams("initial", channelToLoad);
    } catch (error) {
      toast.error("Failed to load channel information");
    } finally {
      setLoading(false);
    }
  };

  const startVerification = () => {
    setShowVerificationOptions(true);
  };

  const handleDescriptionVerification = () => {
    // Generate verification code only when user starts description verification
    setVerificationCode(generateVerificationCode());
    setVerificationStep("description");
    setShowVerificationOptions(false);
    updateUrlParams("description", channelUrl);
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
    if (!verificationCode) {
      toast.error("Verification code not found. Please try again.");
      return;
    }

    setVerificationStep("checking");
    updateUrlParams("checking", channelUrl);
    
    // Simulate verification check
    setTimeout(() => {
      setVerificationStep("verified");
      setVerificationStatus("success");
      updateUrlParams("verified", channelUrl);
      // Update the store when verification is successful
      connectPlatform("youtube");
    }, 2000);
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
          {/* Channel URL Input */}
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

          {/* Channel Info */}
          {channelInfo && verificationStep === "initial" && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={channelInfo.thumbnail}
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

          {/* Verification Options */}
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

          {/* Description Verification Steps */}
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

          {/* Verification Checking */}
          {verificationStep === "checking" && (
            <div className="text-center p-8 space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="font-medium">Checking your channel...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          )}

          {/* Verification Success */}
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