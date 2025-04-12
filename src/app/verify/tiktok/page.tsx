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
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Verify Your TikTok Account</h1>
        <p className="text-muted-foreground">
          Choose a verification method to connect your TikTok account
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          {verificationStep === "initial" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed">
                <div className="space-y-2 opacity-75">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Quick Verification</h4>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connect with TikTok to verify your account ownership instantly
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
                      No manual steps required
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Secure login with TikTok
                    </li>
                  </ul>
                  <Button 
                    className="w-full mt-4 bg-black hover:bg-black/90"
                    disabled
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 015.2-2.32V6.54a7.93 7.93 0 006.59 7.23l.63.13V9.4a6.84 6.84 0 01-4.76-2.71z"/>
                    </svg>
                    Continue with TikTok
                  </Button>
                </div>
              </Card>

              <Card className="p-4 cursor-pointer hover:border-primary transition-colors" onClick={handleManualVerification}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Administrative Verification</h4>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quick verification through our admin team
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
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Step-by-step guidance
                    </li>
                  </ul>
                  <Button className="w-full mt-4" disabled={isSettingUpProfile}>
                    {isSettingUpProfile ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"/>
                        Setting Up...
                      </>
                    ) : (
                      "Start Verification"
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {verificationStep === "administrative" && (
            loadingContacts ? (
              <div className="text-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading contact details...</p>
              </div>
            ) : (
              <SocialVerification 
                verifiedEmail={userEmail}
                contactDetails={contactDetails}
                onVerify={handleVerify}
                onSubmitUrl={handleSubmitUrl}
                platform="TIKTOK"
              />
            )
          )}

          {verificationStep === "checking" && (
            <div className="text-center p-8 space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="font-medium">Processing your request...</p>
              <p className="text-sm text-muted-foreground">Setting up admin verification</p>
            </div>
          )}

          {verificationStep === "verified" && (
            <div className="text-center p-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">Request Submitted!</h3>
              <p className="text-muted-foreground">Our team will contact you within 24-48 hours to verify your TikTok account.</p>
              <Button onClick={() => router.push("/dashboard")} className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </Card>

      {verificationStep !== "verified" && (
        <div className="flex justify-between">
          <Button 
            variant="ghost" 
            onClick={() => verificationStep === "administrative" ? setVerificationStep("initial") : router.back()}
          >
            Back
          </Button>
        </div>
      )}
    </div>
  );
}