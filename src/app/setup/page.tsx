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
  
  // --- Guard: if user already has a profile, redirect to dashboard ---
  useEffect(() => {
    setMounted(true);

    const checkExistingProfile = async () => {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Not logged in, let normal flow handle it

      const { data: profile } = await supabase
        .from('profile')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profile) {
        // User already has a profile — send them to the dashboard
        window.location.replace('/dashboard');
      }
    };

    checkExistingProfile();
  }, []);

  // --- Referral code storage after sign-in ---
  useEffect(() => {
    const storeReferralForUser = async () => {
      const referralCode = localStorage.getItem("referral_code");
      if (!referralCode) return;
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
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { userType, setUserType } = useSetupStore();

  // Always use a fixed 3-step flow:
  // Step 0: Welcome (user picks role here, optional)
  // Step 1: Personal Info
  // Step 2: Account Type (shown only if no role selected in Welcome)
  //         OR: Connect Socials / Complete (if role was selected in Welcome)
  const getSteps = () => {
    if (userType) {
      return [
        { title: "Welcome" },
        { title: "Personal Info" },
        { title: userType === "influencer" ? "Connect Socials" : "Complete" },
      ];
    }
    return [
      { title: "Welcome" },
      { title: "Personal Info" },
      { title: "Account Type" },
      { title: "Complete" },
    ];
  };

  const steps = getSteps();

  // Get step from URL or default to 0
  const urlStep = searchParams.get("step");
  const [currentStep, setCurrentStep] = useState(
    urlStep ? parseInt(urlStep) : 0
  );

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
      const maxStep = userType ? 2 : 3;
      if (stepNumber >= 0 && stepNumber <= maxStep && stepNumber !== currentStep) {
        setCurrentStep(stepNumber);
      }
    }
  }, [searchParams, currentStep, userType]);

  const handleNext = () => {
    const maxStep = steps.length - 1;
    if (currentStep < maxStep) {
      updateStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      updateStep(currentStep - 1);
    }
  };

  // Called when user selects role in UserTypeForm (step 2 of 4-step flow)
  // After selecting, we go to step 2 of the new 3-step flow
  const handleUserTypeSelect = (type: "brand" | "influencer") => {
    setUserType(type);
    // After selection, steps array becomes 3-item, and we navigate to step 2
    // which is now the final step
    setTimeout(() => {
      updateStep(2);
    }, 50);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-pink-50/30">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-pink-500 rounded-full"></div>
      </div>
    );
  }

  const renderStep = () => {
    // Step 0: Welcome screen (allows optional role selection)
    if (currentStep === 0) {
      return <WelcomeScreen onNext={handleNext} />;
    }

    // Step 1: Personal Info
    if (currentStep === 1) {
      return <PersonalInfoForm onNext={handleNext} onBack={handleBack} />;
    }

    // Step 2:
    // If no role selected yet → show Account Type selection
    if (currentStep === 2 && !userType) {
      return (
        <UserTypeForm
          onNext={handleNext}
          onBack={handleBack}
          onSelect={handleUserTypeSelect}
        />
      );
    }

    // If role is brand at step 2 → show Final Step
    if (currentStep === 2 && userType === "brand") {
      return <FinalStep onBack={handleBack} />;
    }

    // If role is influencer at step 2 → show Social Connect
    if (currentStep === 2 && userType === "influencer") {
      return <SocialConnectForm onBack={handleBack} />;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-pink-50/30 dark:to-pink-950/10 py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Stepper steps={steps} currentStep={Math.min(currentStep, steps.length - 1)} />
        <Card className="p-6 border border-pink-100/50 dark:border-pink-900/50 shadow-sm">
          {renderStep()}
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
