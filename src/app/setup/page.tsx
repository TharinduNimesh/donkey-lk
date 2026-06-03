"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stepper } from "@/components/ui/stepper";
import { Card } from "@/components/ui/card";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  PersonalInfoForm,
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
  // Step 0: Choose Role (mandatory selection on Welcome screen)
  // Step 1: Personal Info
  // Step 2: Complete Setup (Connect Socials for influencer, review/complete for brand)
  const getSteps = () => {
    return [
      { title: "Choose Role" },
      { title: "Personal Info" },
      { title: userType === "influencer" ? "Connect Socials" : "Complete" },
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
      const maxStep = 2;
      if (stepNumber >= 0 && stepNumber <= maxStep && stepNumber !== currentStep) {
        setCurrentStep(stepNumber);
      }
    }
  }, [searchParams, currentStep]);

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

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-pink-50/30">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-pink-500 rounded-full"></div>
      </div>
    );
  }

  const renderStep = () => {
    // Step 0: Choose Role Screen
    if (currentStep === 0) {
      return <WelcomeScreen onNext={handleNext} />;
    }

    // Step 1: Personal Info
    if (currentStep === 1) {
      return <PersonalInfoForm onNext={handleNext} onBack={handleBack} />;
    }

    // Step 2: Complete Setup
    if (currentStep === 2) {
      if (userType === "brand") {
        return <FinalStep onBack={handleBack} />;
      }
      if (userType === "influencer") {
        return <SocialConnectForm onBack={handleBack} />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 py-20 px-4 relative overflow-hidden flex items-center justify-center font-sans">
      {/* Decorative Aurora background blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-pink-400/10 dark:bg-pink-900/5 blur-3xl opacity-75 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-400/15 dark:bg-purple-900/5 blur-3xl opacity-75 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-100/5 dark:bg-blue-900/5 blur-3xl opacity-50 pointer-events-none" />

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <Stepper steps={steps} currentStep={Math.min(currentStep, steps.length - 1)} />
        <Card className="p-8 border border-white/20 dark:border-zinc-900/30 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-md rounded-3xl overflow-hidden min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full h-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
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
