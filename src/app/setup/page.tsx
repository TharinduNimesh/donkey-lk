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
  // --- Referral code storage after sign-in ---
  useEffect(() => {
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

  const steps = [
    { title: "Welcome" },
    { title: "Personal Info" },
    { title: "Account Type" },
    { title: userType === "influencer" ? "Connect Socials" : "Final Step" },
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
    const role = searchParams.get("role");
    if (step !== null) {
      const stepNumber = parseInt(step);
      // If on user type form and role present, set userType and skip
      if (stepNumber === 2 && role && (role === "brand" || role === "influencer")) {
        setUserType(role);
        updateStep(3);
        return;
      }
      if (
        stepNumber >= 0 &&
        stepNumber < steps.length &&
        stepNumber !== currentStep
      ) {
        setCurrentStep(stepNumber);
      }
    }
  }, [searchParams]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      updateStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    const role = searchParams.get("role");
    // If on final/review step and role was set from welcome, skip user type form
    if (currentStep === 3 && role && (role === "brand" || role === "influencer")) {
      updateStep(1); // Go to personal info
      return;
    }
    if (currentStep > 0) {
      updateStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-pink-50/30 dark:to-pink-950/10 py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Stepper steps={steps} currentStep={currentStep} />
        <Card className="p-6 border border-pink-100/50 dark:border-pink-900/50 shadow-sm">
          {currentStep === 0 && <WelcomeScreen onNext={handleNext} onRoleSelect={(role) => { setUserType(role); updateStep(2); }} />}
          {currentStep === 1 && <PersonalInfoForm onNext={handleNext} />}
          {currentStep === 2 && (
            <UserTypeForm onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 3 && userType === "influencer" && (
            <SocialConnectForm onBack={handleBack} />
          )}
          {currentStep === 3 && userType !== "influencer" && (
            <FinalStep onBack={handleBack} />
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
