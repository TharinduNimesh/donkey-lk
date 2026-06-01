"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stepper } from "@/components/ui/stepper";
import { Card } from "@/components/ui/card";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  PersonalInfoForm,
  UserTypeForm,
  SocialConnectForm,
  FinalStep,
  WelcomeScreen,
} from "@/components/setup";
import { useSetupStore } from "@/lib/store";

function SetupContent() {
  const [mounted, setMounted] = useState(false);
  
  // --- Referral code storage after sign-in ---
  useEffect(() => {
    setMounted(true);
    const storeReferralForUser = async () => {
      const referralCode = localStorage.getItem("referral_code");
      if (!referralCode) return;
      // Get the actual current user from Supabase auth
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.id) return;
      try {
        await supabase.from('user_referrals').insert({
          user_id: user.id,
          referral_code: referralCode
        });
        localStorage.removeItem("referral_code");
      } catch (e) {
        // Optionally handle/log referral insert error
      }
    };
    storeReferralForUser();
  }, []); // Only run once after mount

  const router = useRouter();
  const searchParams = useSearchParams();
  const { userType, setUserType } = useSetupStore();

  // Get step from URL or default to 0
  const urlStep = searchParams.get("step");
  const [currentStep, setCurrentStep] = useState(
    urlStep ? parseInt(urlStep) : 0
  );

  // Dynamic steps setup based on whether a role has been chosen
  const steps = userType
    ? [
        { title: "Welcome" },
        { title: "Personal Info" },
        { title: userType === "influencer" ? "Connect Socials" : "Complete" },
      ]
    : [
        { title: "Welcome" },
        { title: "Personal Info" },
        { title: "Account Type" },
        { title: "Complete" },
      ];

  // Update URL when step changes
  const updateStep = (step: number) => {
    setCurrentStep(step);
    const params = new URLSearchParams(searchParams);
    params.set("step", step.toString());
    router.push(`/setup?${params.toString()}`);
  };

  // Handle direct URL access and browser back/forward
  useEffect(() => {
    const step = searchParams.get("step");
    if (step !== null) {
      const stepNumber = parseInt(step);
      if (
        stepNumber >= 0 &&
        stepNumber < steps.length &&
        stepNumber !== currentStep
      ) {
        setCurrentStep(stepNumber);
      }
    }
  }, [searchParams, steps.length, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      updateStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      updateStep(currentStep - 1);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-pink-50/30">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-pink-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-pink-50/30 dark:to-pink-950/10 py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Stepper steps={steps} currentStep={currentStep} />
        <Card className="p-6 border border-pink-100/50 dark:border-pink-900/50 shadow-sm">
          {/* Welcome Screen */}
          {currentStep === 0 && (
            <WelcomeScreen onNext={handleNext} />
          )}
          
          {/* Personal Info Form */}
          {currentStep === 1 && (
            <PersonalInfoForm onNext={handleNext} onBack={handleBack} />
          )}
          
          {/* User Type Selection (only visible if userType is null) */}
          {currentStep === 2 && !userType && (
            <UserTypeForm onNext={handleNext} onBack={handleBack} />
          )}
          
          {/* Final Step for Brand Portal (Step 2 or 3 depending on flow) */}
          {((currentStep === 2 && userType === "brand") || (currentStep === 3 && userType === "brand")) && (
            <FinalStep onBack={handleBack} />
          )}
          
          {/* Socials Connection for Influencer Portal (Step 2 or 3 depending on flow) */}
          {((currentStep === 2 && userType === "influencer") || (currentStep === 3 && userType === "influencer")) && (
            <SocialConnectForm onBack={handleBack} />
          )}
        </Card>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-pink-500 rounded-full"></div>
        </div>
      }
    >
      <SetupContent />
    </Suspense>
  );
}
