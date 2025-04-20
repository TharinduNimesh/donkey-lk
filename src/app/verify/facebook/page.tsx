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

export default function FacebookVerificationPage() {
  const router = useRouter();
  const { connectPlatform, personalInfo } = useSetupStore();
  const [verificationStep, setVerificationStep] = useState<VerificationStep>("initial");
  const [pageUrl, setPageUrl] = useState("");
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
    setPageUrl(url);
    toast.info(
      "Manual verification request submitted",
      {
        description: "Our team will contact you within 24-48 hours to verify your page ownership.",
      }
    );
    
    setVerificationStep("checking");
    
    setTimeout(() => {
      setVerificationStep("verified");
      connectPlatform("facebook");
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-pink-50/30 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600">
            Verify Your Facebook Page
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Connect your Facebook presence to BrandSync and unlock collaboration opportunities
          </p>
        </div>

        <Card className="p-6 md:p-8 border border-pink-100 dark:border-pink-900/20 shadow-md bg-white dark:bg-gray-900 rounded-lg">
          <div className="space-y-6">
            {verificationStep === "initial" && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-5 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg h-full flex flex-col">
                  <div className="space-y-4 h-full">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Quick Verification</h3>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Connect with Facebook to verify your page ownership instantly
                    </p>
                    <ul className="space-y-2 mt-2 text-sm">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Instant verification</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>No manual steps required</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Secure login with Facebook</span>
                      </li>
                    </ul>
                    <div className="mt-auto pt-4">
                      <Button 
                        className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90"
                        disabled
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Continue with Facebook
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card 
                  className="p-5 border border-pink-200 dark:border-pink-900/30 bg-pink-50/50 dark:bg-pink-950/10 rounded-lg cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col"
                  onClick={handleManualVerification}
                >
                  <div className="space-y-4 h-full">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-pink-600 dark:text-pink-400">
                        Administrative Verification
                      </h3>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Quick verification through our admin team
                    </p>
                    <ul className="space-y-2 mt-2 text-sm">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Personal assistance</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>24-48 hour response time</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Step-by-step guidance</span>
                      </li>
                    </ul>
                    <div className="mt-auto pt-4">
                      <Button 
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white"
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
                    <div className="animate-spin w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-sm text-muted-foreground">Loading your contact details...</p>
                  </div>
                ) : (
                  <SocialVerification 
                    verifiedEmail={userEmail}
                    contactDetails={contactDetails}
                    onVerify={handleVerify}
                    onSubmitUrl={handleSubmitUrl}
                    platform="FACEBOOK"
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
                <div className="animate-spin w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
                <h3 className="text-xl font-medium text-pink-600">Processing your request...</h3>
                <p className="text-muted-foreground">Setting up admin verification</p>
              </motion.div>
            )}

            {verificationStep === "verified" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center p-8 space-y-4"
              >
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-green-600">Request Submitted!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">Our team will contact you within 24-48 hours to verify your Facebook page.</p>
                <Button 
                  onClick={() => router.push("/dashboard")} 
                  className="mt-2 bg-pink-600 hover:bg-pink-700"
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
              className="text-muted-foreground"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}