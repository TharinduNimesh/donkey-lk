"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSetupStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { getChannelInfo } from "./actions";
import {
  setupUserProfile,
  fetchUserContactDetails,
  type ContactDetail,
} from "@/lib/utils/user";
import {
  type ChannelInfo,
  verifyYouTubeChannel,
  generateVerificationCode,
  checkYouTubeVerification,
} from "@/lib/utils/youtube";
import { SocialVerification } from "@/components/ui/social-verification";
import { motion } from "framer-motion";

type VerificationStep =
  | "initial"
  | "description"
  | "checking"
  | "verified"
  | "administrative";

function YouTubeVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connectPlatform, personalInfo } = useSetupStore();

  const urlStep = searchParams.get("step") as VerificationStep | null;
  const urlChannel = searchParams.get("channel");
  const [channelUrl, setChannelUrl] = useState(urlChannel || "");
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVerificationOptions, setShowVerificationOptions] = useState(false);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(
    urlStep || "initial"
  );
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "failed"
  >("pending");
  const [userEmail, setUserEmail] = useState<string>("");
  const [contactDetails, setContactDetails] = useState<ContactDetail[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const updateUrlParams = (step: VerificationStep, channel?: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("step", step);
    if (channel) {
      params.set("channel", channel);
    }
    router.push(`/verify/youtube?${params.toString()}`);
  };

  useEffect(() => {
    const step = searchParams.get("step") as VerificationStep;
    const channel = searchParams.get("channel");

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

  useEffect(() => {
    async function loadContactDetails() {
      if (verificationStep === "administrative") {
        try {
          setLoadingContacts(true);
          const { email, contacts } = await fetchUserContactDetails();
          setUserEmail(email || "");
          setContactDetails(contacts);
        } catch (error) {
          toast.error("Failed to load contact details");
          console.error("Error loading contact details:", error);
        } finally {
          setLoadingContacts(false);
        }
      }
    }

    loadContactDetails();
  }, [verificationStep]);

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication error. Please try logging in again.");
        return;
      }

      const toastId = toast.loading("Setting up your account...");

      const { error: setupError } = await setupUserProfile({
        userId: user.id,
        name: personalInfo?.name || channelInfo?.title || "",
        role: ["INFLUENCER"],
        mobile: personalInfo?.mobile,
        onError: (error) => {
          if (error.message?.includes("already registered")) {
            toast.error("Mobile number already registered", {
              id: toastId,
              description:
                "This mobile number is already registered with another account. Please use a different number.",
              richColors: true,
            });
          } else {
            toast.error("Failed to setup profile. Please try again.", {
              id: toastId,
              description: error.message,
              richColors: true,
            });
          }
        },
      });

      if (setupError) return;

      try {
        const result = await verifyYouTubeChannel(
          channelUrl,
          user.id,
          channelInfo
        );

        if (result.message) {
          toast.info(result.message, { id: toastId });
        } else {
          toast.success("Channel registration initiated!", { id: toastId });
        }

        setShowVerificationOptions(true);
      } catch (error: any) {
        if (error.message?.includes("already been verified")) {
          toast.error("Channel already verified", {
            id: toastId,
            description: error.message,
            richColors: true,
          });
          return;
        }
        if (error.message?.includes("already registered")) {
          toast.error("Channel unavailable", {
            id: toastId,
            description: error.message,
            richColors: true,
          });
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Error starting verification:", error);
      toast.error(
        "Failed to initialize verification process. Please try again."
      );
    }
  };

  const handleDescriptionVerification = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication error. Please try logging in again.");
        return;
      }

      const { data: profiles } = await supabase
        .from("influencer_profile")
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", "YOUTUBE")
        .eq("url", channelUrl);

      if (!profiles || profiles.length === 0) {
        toast.error("Profile not found. Please try again.");
        return;
      }

      const profileId = profiles[0].id;

      const { code } = await generateVerificationCode(profileId);
      setVerificationCode(code);
      setVerificationStep("description");
      setShowVerificationOptions(false);
      updateUrlParams("description", channelUrl);
    } catch (error) {
      console.error("Error generating verification code:", error);
      toast.error("Failed to generate verification code. Please try again.");
    }
  };

  const handleManualVerification = () => {
    if (!channelInfo) {
      toast.error("Please load your channel information first");
      return;
    }
    setVerificationStep("administrative");
    setShowVerificationOptions(false);
  };

  const handleVerify = async (contactId: number) => {
    try {
      const { contacts } = await fetchUserContactDetails();
      setContactDetails(contacts);

      toast.info("Verification initiated", {
        description: "Our team will verify this contact method shortly.",
      });
    } catch (error) {
      toast.error("Failed to refresh contact details");
      console.error("Error refreshing contact details:", error);
    }
  };

  const handleSubmitUrl = async (url: string) => {
    if (!channelInfo) {
      toast.error("Channel information not found. Please try again.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication error. Please try logging in again.");
        return;
      }

      const toastId = toast.loading("Setting up your account...");

      const { error: setupError } = await setupUserProfile({
        userId: user.id,
        name: personalInfo?.name || channelInfo?.title || "",
        role: ["INFLUENCER"],
        mobile: personalInfo?.mobile,
        onError: (error) => {
          if (error.message?.includes("already registered")) {
            toast.error("Mobile number already registered", {
              id: toastId,
              description:
                "This mobile number is already registered with another account. Please use a different number.",
              richColors: true,
            });
          } else {
            toast.error("Failed to setup profile. Please try again.", {
              id: toastId,
              description: error.message,
              richColors: true,
            });
          }
        },
      });

      if (setupError) return;

      const { error: profileError } = await supabase
        .from("influencer_profile")
        .insert({
          user_id: user.id,
          platform: "YOUTUBE",
          name: channelInfo?.title || "",
          followers: channelInfo?.subscribers || "0",
          profile_pic: channelInfo?.thumbnail || "",
          url: channelUrl,
          is_verified: false,
        });

      if (profileError) {
        if (profileError.code === "23505") {
          toast.info("Profile already exists", {
            id: toastId,
            description:
              "Your YouTube profile is already set up. Proceeding with verification.",
            richColors: true,
          });
        } else {
          throw profileError;
        }
      } else {
        toast.success("Profile created successfully!", { id: toastId });
      }

      setVerificationStep("checking");

      setTimeout(() => {
        setVerificationStep("verified");
        setVerificationStatus("success");
        connectPlatform("youtube");
      }, 2000);
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error("Failed to submit verification. Please try again.");
    }
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      console.error("Error during verification:", error);
      setVerificationStatus("failed");
      toast.error("Verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-pink-50/30 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600">
            Verify Your YouTube Channel
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Connect your YouTube presence to BrandSync and unlock collaboration
            opportunities
          </p>
        </div>

        <Card className="p-6 md:p-8 border border-pink-100 dark:border-pink-900/20 shadow-md bg-white dark:bg-gray-900 rounded-lg">
          <div className="space-y-6">
            <div className="space-y-4">
              {verificationStep === "initial" && !channelInfo && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-pink-600 dark:text-pink-400">
                    Channel URL
                  </h3>
                  <div className="flex gap-4">
                    <Input
                      placeholder="https://youtube.com/c/yourchannel"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      className="w-full"
                    />
                    <Button
                      onClick={() => handleChannelLoad()}
                      disabled={loading || !channelUrl}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      {loading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Loading...
                        </>
                      ) : (
                        "Load Channel"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {channelInfo &&
                verificationStep === "initial" &&
                !showVerificationOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border rounded-lg p-4 space-y-4 border-pink-100 dark:border-pink-900/20"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={
                          channelInfo.thumbnail ||
                          "https://via.placeholder.com/150"
                        }
                        alt={channelInfo.title}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold">{channelInfo.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {channelInfo.subscribers} subscribers
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={startVerification}
                      className="w-full bg-pink-600 hover:bg-pink-700"
                    >
                      Start Verification
                    </Button>
                  </motion.div>
                )}

              {showVerificationOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <h3 className="font-semibold text-lg text-pink-600 dark:text-pink-400">
                    Choose Verification Method
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card
                      className="p-5 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="space-y-4 h-full">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            Description Verification
                          </h4>
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            Coming Soon
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Quick verification by adding a unique code to your
                          channel's About section
                        </p>
                        <ul className="space-y-2 mt-2 text-sm">
                          <li className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span>Instant verification</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span>Add verification code to channel</span>
                          </li>
                        </ul>
                      </div>
                    </Card>

                    <Card
                      className="p-5 border border-pink-200 dark:border-pink-900/30 bg-pink-50/50 dark:bg-pink-950/10 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={handleManualVerification}
                    >
                      <div className="space-y-4 h-full">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-pink-600 dark:text-pink-400">
                            Administrative Verification
                          </h4>
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                            Alternative
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Verification through our admin team
                        </p>
                        <ul className="space-y-2 mt-2 text-sm">
                          <li className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-pink-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span>Personal assistance</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-pink-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span>24-48 hour response time</span>
                          </li>
                        </ul>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              )}

              {verificationStep === "description" && verificationCode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg">
                      Follow these steps to verify your channel:
                    </h3>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <span className="bg-blue-100 dark:bg-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                          1
                        </span>
                        <div className="space-y-1">
                          <p className="font-medium">
                            Go to your YouTube channel's About section
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Click the "Customize Channel" button, then go to the
                            "Basic info" tab
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-blue-100 dark:bg-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                          2
                        </span>
                        <div className="space-y-1">
                          <p className="font-medium">
                            Add this verification code to your channel
                            description:
                          </p>
                          <div className="bg-white dark:bg-background p-3 rounded border">
                            <code className="text-sm font-mono">
                              #{verificationCode}
                            </code>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `#${verificationCode}`
                              );
                              toast.success(
                                "Verification code copied to clipboard"
                              );
                            }}
                          >
                            Copy Code
                          </Button>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-blue-100 dark:bg-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                          3
                        </span>
                        <div className="space-y-1">
                          <p className="font-medium">
                            Save your changes and click "Check Now"
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Make sure to publish your changes before
                            verification
                          </p>
                        </div>
                      </li>
                    </ol>
                  </div>
                  <Button
                    onClick={checkVerification}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    Check Now
                  </Button>
                </motion.div>
              )}

              {verificationStep === "administrative" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {loadingContacts ? (
                    <div className="text-center p-6">
                      <div className="animate-spin w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-4 text-sm text-muted-foreground">
                        Loading your contact details...
                      </p>
                    </div>
                  ) : (
                    <SocialVerification
                      verifiedEmail={userEmail}
                      contactDetails={contactDetails}
                      onVerify={handleVerify}
                      onSubmitUrl={handleSubmitUrl}
                      platform="YOUTUBE"
                    />
                  )}
                </motion.div>
              )}

              {verificationStep === "checking" &&
                verificationStatus === "pending" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center p-8 space-y-4"
                  >
                    <div className="animate-spin w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
                    <h3 className="text-xl font-medium text-pink-600">
                      Checking your channel...
                    </h3>
                    <p className="text-muted-foreground">
                      This may take a few moments
                    </p>
                  </motion.div>
                )}

              {verificationStep === "checking" &&
                verificationStatus === "failed" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center p-8 space-y-4"
                  >
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                      <svg
                        className="w-8 h-8 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">
                      Verification Failed
                    </h3>
                    <p className="text-muted-foreground">
                      We couldn't find the verification code in your channel
                      description.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm">Make sure you:</p>
                      <ul className="text-sm text-left list-disc pl-8 space-y-1">
                        <li>
                          Added the exact verification code to your channel
                          description
                        </li>
                        <li>Saved your channel changes</li>
                        <li>
                          Published the changes (they may take a few minutes to
                          appear)
                        </li>
                      </ul>
                    </div>
                    <Button
                      onClick={checkVerification}
                      className="mt-4 bg-pink-600 hover:bg-pink-700"
                    >
                      Try Again
                    </Button>
                  </motion.div>
                )}

              {verificationStep === "verified" &&
                verificationStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center p-8 space-y-4"
                  >
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                      <svg
                        className="w-10 h-10 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                      Verification Successful!
                    </h3>
                    <p className="text-muted-foreground">
                      Your YouTube channel has been verified successfully.
                    </p>
                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="mt-4 bg-pink-600 hover:bg-pink-700"
                    >
                      Go to Dashboard
                    </Button>
                  </motion.div>
                )}
            </div>
          </div>
        </Card>

        {verificationStep !== "verified" && (
          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                if (verificationStep === "administrative") {
                  setVerificationStep("initial");
                  setShowVerificationOptions(true);
                } else {
                  router.back();
                }
              }}
              className="text-muted-foreground"
            >
              <svg
                className="w-5 h-5 mr-2"
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
          </div>
        )}
      </div>
    </div>
  );
}

export default function YouTubeVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-gradient-to-b from-pink-50/30 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="container max-w-4xl mx-auto py-8 px-4">
            <Card className="p-6 md:p-8 border border-pink-100 dark:border-pink-900/20 shadow-md bg-white dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-pink-600">Loading...</span>
              </div>
            </Card>
          </div>
        </div>
      }
    >
      <YouTubeVerificationContent />
    </Suspense>
  );
}
