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
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 py-12 px-4 relative overflow-hidden flex items-center justify-center font-sans">
      {/* Decorative Aurora background blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-pink-400/10 dark:bg-pink-900/5 blur-3xl opacity-75 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-400/15 dark:bg-purple-900/5 blur-3xl opacity-75 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-100/5 dark:bg-blue-900/5 blur-3xl opacity-50 pointer-events-none" />

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-black dark:from-white dark:to-zinc-300 font-display">
            Verify Your YouTube Channel
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium max-w-md mx-auto">
            Connect your YouTube presence to BrandSync and unlock collaboration opportunities
          </p>
        </div>

        <Card className="p-8 border border-white/20 dark:border-zinc-900/30 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-md rounded-3xl overflow-hidden">
          <div className="space-y-5">
              {verificationStep === "initial" && !channelInfo && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                    Channel URL
                  </h3>
                  <div className="flex w-full gap-3 items-center">
                    <div className="flex-1">
                      <Input
                        placeholder="https://youtube.com/c/yourchannel"
                        value={channelUrl}
                        onChange={(e) => setChannelUrl(e.target.value)}
                        hoverColor="#000000"
                        className="w-full text-sm h-11 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 bg-white dark:bg-zinc-900"
                        type="text"
                      />
                    </div>
                    <Button
                      onClick={() => handleChannelLoad()}
                      disabled={loading || !channelUrl}
                      className="bg-black text-white hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider h-11 px-6 flex-shrink-0 transition-all duration-200"
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
                    className="border rounded-2xl p-5 space-y-4 border-gray-150 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={
                          channelInfo.thumbnail ||
                          "https://via.placeholder.com/150"
                        }
                        alt={channelInfo.title}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100 dark:ring-zinc-800"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-zinc-150">{channelInfo.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {channelInfo.subscribers} subscribers
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={startVerification}
                      className="w-full bg-black text-white hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider h-11 transition-all duration-200"
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
                  className="space-y-5"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                    Choose Verification Method
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card
                      className="p-6 border border-gray-150 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 rounded-2xl hover:shadow-md transition-all duration-200 cursor-pointer hover:border-black/40 dark:hover:border-zinc-700"
                    >
                      <div className="space-y-4 h-full flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-zinc-150">
                              Description Verification
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200/30">
                              Coming Soon
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-normal">
                            Quick verification by adding a unique code to your
                            channel's About section
                          </p>
                        </div>
                        <ul className="space-y-2 mt-2 text-xs">
                          <li className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-green-600 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-gray-600 dark:text-zinc-350">Instant verification</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-green-600 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-gray-600 dark:text-zinc-350">Add code to channel</span>
                          </li>
                        </ul>
                      </div>
                    </Card>

                    <Card
                      className="p-6 border border-gray-150 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 rounded-2xl hover:shadow-md transition-all duration-200 cursor-pointer hover:border-black/40 dark:hover:border-zinc-700"
                      onClick={handleManualVerification}
                    >
                      <div className="space-y-4 h-full flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-zinc-150">
                              Administrative Verification
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                              Alternative
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-normal">
                            Verification through our admin team
                          </p>
                        </div>
                        <ul className="space-y-2 mt-2 text-xs">
                          <li className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-600 dark:text-zinc-400 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-gray-600 dark:text-zinc-350">Personal assistance</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-600 dark:text-zinc-400 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-gray-600 dark:text-zinc-350">24-48 hour response time</span>
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
                  <div className="bg-gray-50/50 dark:bg-zinc-900/40 border border-gray-150 dark:border-zinc-850 p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-base text-gray-900 dark:text-zinc-150">
                      Follow these steps to verify your channel:
                    </h3>
                    <ol className="space-y-4 text-xs">
                      <li className="flex items-start gap-3">
                        <span className="bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                          1
                        </span>
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-800 dark:text-zinc-200">
                            Go to your YouTube channel's About section
                          </p>
                          <p className="text-muted-foreground leading-normal">
                            Click the "Customize Channel" button, then go to the
                            "Basic info" tab
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                          2
                        </span>
                        <div className="space-y-1 w-full">
                          <p className="font-semibold text-gray-800 dark:text-zinc-200">
                            Add this verification code to your channel description:
                          </p>
                          <div className="bg-white/80 dark:bg-zinc-900/85 p-3 rounded-xl border border-gray-150 dark:border-zinc-800/80 max-w-xs mt-1">
                            <code className="text-sm font-bold font-mono text-black dark:text-white">
                              #{verificationCode}
                            </code>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 border-gray-250 text-gray-800 hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-850 font-bold text-[10px] uppercase tracking-wider h-8 px-3"
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
                        <span className="bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                          3
                        </span>
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-800 dark:text-zinc-200">
                            Save your changes and click "Check Now"
                          </p>
                          <p className="text-muted-foreground leading-normal">
                            Make sure to publish your changes before verification
                          </p>
                        </div>
                      </li>
                    </ol>
                  </div>
                  <Button
                    onClick={checkVerification}
                    className="w-full bg-black text-white hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider h-11 transition-all duration-200"
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
                      <div className="animate-spin w-10 h-10 border-3 border-black dark:border-white border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-4 text-xs text-muted-foreground">
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
                    <div className="animate-spin w-16 h-16 border-4 border-black dark:border-white border-t-transparent rounded-full mx-auto"></div>
                    <h3 className="text-lg font-bold text-black dark:text-white">
                      Checking your channel...
                    </h3>
                    <p className="text-xs text-muted-foreground">
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
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto">
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
                    <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                      Verification Failed
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      We couldn't find the verification code in your channel description.
                    </p>
                    <div className="space-y-2 text-xs max-w-sm mx-auto text-left border border-gray-150 dark:border-zinc-800 p-4 bg-white/40 dark:bg-zinc-900/40 rounded-2xl mt-4">
                      <p className="font-semibold text-gray-700 dark:text-zinc-350">Make sure you:</p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>
                          Added the exact verification code to your channel description
                        </li>
                        <li>Saved your channel changes</li>
                        <li>
                          Published the changes (they may take a few minutes to appear)
                        </li>
                      </ul>
                    </div>
                    <Button
                      onClick={checkVerification}
                      className="mt-6 bg-black text-white hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider h-11 px-6 transition-all duration-200"
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
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-955/20 rounded-full flex items-center justify-center mx-auto">
                      <svg
                        className="w-8 h-8 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-green-655 dark:text-green-400">
                      Verification Successful!
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Your YouTube channel has been verified successfully.
                    </p>
                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="mt-4 bg-black text-white hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider h-11 px-6 transition-all duration-200"
                    >
                      Go to Dashboard
                    </Button>
                  </motion.div>
                )}
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
              className="text-muted-foreground hover:text-foreground font-semibold text-xs uppercase tracking-wider"
            >
              <svg
                className="w-4 h-4 mr-2"
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
        <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 py-12 px-4 relative overflow-hidden flex items-center justify-center font-sans">
          <div className="max-w-2xl w-full relative z-10">
            <Card className="p-8 border border-white/20 dark:border-zinc-900/30 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-md rounded-3xl overflow-hidden">
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full"></div>
                <span className="ml-3 text-black dark:text-white font-semibold text-sm">Loading...</span>
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
