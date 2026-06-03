"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useSetupStore } from "@/lib/store";
import { SocialVerification } from "@/components/ui/social-verification";
import { fetchUserContactDetails, setupUserProfile, type ContactDetail } from "@/lib/utils/user";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

type VerificationStep = "initial" | "checking" | "verified" | "administrative";

export default function TiktokVerificationPage() {
  const router = useRouter();
  const { connectPlatform, personalInfo } = useSetupStore();
  const [verificationStep, setVerificationStep] = useState<VerificationStep>("initial");
  const [accountUrl, setAccountUrl] = useState("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [contactDetails, setContactDetails] = useState<ContactDetail[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isSettingUpProfile, setIsSettingUpProfile] = useState(false);

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

  const handleManualVerification = async () => {
    try {
      setIsSettingUpProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication error. Please try logging in again.");
        return;
      }

      const toastId = toast.loading("Setting up your account...");

      const { error: setupError } = await setupUserProfile({
        userId: user.id,
        name: personalInfo?.name || '',
        role: ['INFLUENCER'],
        mobile: personalInfo?.mobile,
        onError: (error) => {
          if (error.message?.includes("already registered")) {
            toast.error("Mobile number already registered", {
              id: toastId,
              description: "This mobile number is already registered with another account. Please use a different number.",
              richColors: true
            });
          } else {
            toast.error("Failed to setup profile. Please try again.", {
              id: toastId,
              description: error.message,
              richColors: true
            });
          }
        }
      });

      if (setupError) {
        return;
      }

      toast.success("Profile setup completed!", { id: toastId });
      setVerificationStep("administrative");
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast.error("Failed to setup profile. Please try again.");
    } finally {
      setIsSettingUpProfile(false);
    }
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

  const handleSubmitUrl = (url: string) => {
    setAccountUrl(url);
    toast.info(
      "Manual verification request submitted",
      {
        description: "Our team will contact you within 24-48 hours to verify your account ownership.",
      }
    );
    
    setVerificationStep("checking");
    
    setTimeout(() => {
      setVerificationStep("verified");
      connectPlatform("tiktok");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 py-12 px-4 relative overflow-hidden flex items-center justify-center font-sans">
      {/* Decorative Aurora background blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-pink-400/10 dark:bg-pink-900/5 blur-3xl opacity-75 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-400/15 dark:bg-purple-900/5 blur-3xl opacity-75 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-100/5 dark:bg-blue-900/5 blur-3xl opacity-50 pointer-events-none" />

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-purple-600 font-display">
            Verify Your TikTok Account
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium max-w-md mx-auto">
            Connect your TikTok presence to BrandSync and unlock collaboration opportunities
          </p>
        </div>

        <Card className="p-8 border border-white/20 dark:border-zinc-900/30 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-md rounded-3xl overflow-hidden">
          <div className="space-y-5">
            {verificationStep === "initial" && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6 border border-gray-150 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 rounded-2xl h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-zinc-150">Quick Verification</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200/30">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Connect with TikTok to verify your account ownership instantly
                    </p>
                    <ul className="space-y-2 mt-2 text-xs">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600 dark:text-zinc-350">Instant verification</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600 dark:text-zinc-350">No manual steps required</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600 dark:text-zinc-350">Secure login with TikTok</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-black hover:bg-black/90 text-white font-bold text-xs uppercase tracking-wider h-10 relative overflow-hidden"
                      disabled
                    >
                      <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-[#25F4EE] to-transparent opacity-40"></div>
                      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#FE2C55] to-transparent opacity-40"></div>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 015.2-2.32V6.54a7.93 7.93 0 006.59 7.23l.63.13V9.4a6.84 6.84 0 01-4.76-2.71z"/>
                      </svg>
                      Continue with TikTok
                    </Button>
                  </div>
                </Card>

                <Card 
                  className="p-6 border border-purple-100 dark:border-purple-900/20 bg-purple-50/10 dark:bg-purple-950/5 rounded-2xl cursor-pointer hover:shadow-md transition-all duration-200 hover:border-purple-350/50 h-full flex flex-col justify-between"
                  onClick={handleManualVerification}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-purple-650 dark:text-purple-400">
                        Administrative Verification
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Quick verification through our admin team
                    </p>
                    <ul className="space-y-2 mt-2 text-xs">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600 dark:text-zinc-350">Personal assistance</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600 dark:text-zinc-350">24-48 hour response time</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600 dark:text-zinc-350">Step-by-step guidance</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-purple-50/40 text-purple-650 border border-purple-150 hover:bg-purple-50/80 hover:text-purple-700 dark:bg-purple-950/10 dark:text-purple-400 dark:border-purple-900/30 dark:hover:bg-purple-950/20 text-xs font-bold uppercase tracking-wider h-10 transition-all duration-200"
                      disabled={isSettingUpProfile}
                    >
                      {isSettingUpProfile ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                          Setting Up...
                        </>
                      ) : (
                        <>Start Verification</>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {verificationStep === "administrative" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {loadingContacts ? (
                  <div className="text-center p-6">
                    <div className="animate-spin w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-xs text-muted-foreground">Loading your contact details...</p>
                  </div>
                ) : (
                  <SocialVerification 
                    verifiedEmail={userEmail}
                    contactDetails={contactDetails}
                    onVerify={handleVerify}
                    onSubmitUrl={handleSubmitUrl}
                    platform="TIKTOK"
                  />
                )}
              </motion.div>
            )}

            {verificationStep === "checking" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center p-8 space-y-4"
              >
                <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                <h3 className="text-lg font-bold text-purple-650 dark:text-purple-400">Processing your request...</h3>
                <p className="text-xs text-muted-foreground">Setting up admin verification</p>
              </motion.div>
            )}

            {verificationStep === "verified" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center p-8 space-y-4"
              >
                <div className="w-16 h-16 bg-green-50 dark:bg-green-955/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-green-655 dark:text-green-400">Request Submitted!</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">Our team will contact you within 24-48 hours to verify your TikTok account.</p>
                <Button 
                  onClick={() => router.push("/dashboard")} 
                  className="mt-4 bg-purple-50/40 text-purple-650 border border-purple-150 hover:bg-purple-50/80 hover:text-purple-700 dark:bg-purple-950/10 dark:text-purple-400 dark:border-purple-900/30 dark:hover:bg-purple-950/20 text-xs font-bold uppercase tracking-wider h-11 px-6 transition-all duration-200"
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
              onClick={() => verificationStep === "administrative" ? setVerificationStep("initial") : router.back()}
              className="text-muted-foreground hover:text-foreground font-semibold text-xs uppercase tracking-wider"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}