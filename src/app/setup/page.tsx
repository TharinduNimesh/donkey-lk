"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stepper } from "@/components/ui/stepper";
import { Card } from "@/components/ui/card";
import {
  PersonalInfoForm,
  UserTypeForm,
  SocialConnectForm,
  FinalStep,
  WelcomeScreen,
} from "@/components/setup";
import { useSetupStore } from "@/lib/store";

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userType } = useSetupStore();

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
  }, [searchParams]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-pink-50/30 dark:to-pink-950/10 py-12 px-4">
      {/* Stepper centered with dedicated styling */}
      <div className="flex justify-center mb-12">
        <div className="w-full max-w-3xl mx-auto px-4">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      </div>
      
      {/* Card content */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 border border-pink-100/50 dark:border-pink-900/50 shadow-sm">
          {currentStep === 0 && <WelcomeScreen onNext={handleNext} />}
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
