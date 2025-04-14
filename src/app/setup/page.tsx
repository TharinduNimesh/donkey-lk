"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stepper } from "@/components/ui/stepper";
import { Card } from "@/components/ui/card";
import {
  PersonalInfoForm,
  UserTypeForm,
  SocialConnectForm,
  FinalStep
} from "@/components/setup";
import { useSetupStore } from "@/lib/store";

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userType } = useSetupStore();
  
  // Get step from URL or default to 0
  const urlStep = searchParams.get('step');
  const [currentStep, setCurrentStep] = useState(urlStep ? parseInt(urlStep) : 0);

  const steps = [
    { title: "Personal Info" },
    { title: "Account Type" },
    { title: userType === "influencer" ? "Connect Socials" : "Final Step" },
  ];

  // Update URL when step changes
  const updateStep = (step: number) => {
    setCurrentStep(step);
    const params = new URLSearchParams(searchParams);
    params.set('step', step.toString());
    router.push(`/setup?${params.toString()}`);
  };

  // Handle direct URL access and browser back/forward
  useEffect(() => {
    const step = searchParams.get('step');
    if (step !== null) {
      const stepNumber = parseInt(step);
      if (stepNumber >= 0 && stepNumber < steps.length && stepNumber !== currentStep) {
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
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Stepper steps={steps} currentStep={currentStep} />
        
        <Card className="p-6">
          {currentStep === 0 && (
            <PersonalInfoForm onNext={handleNext} />
          )}
          {currentStep === 1 && (
            <UserTypeForm onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 2 && userType === "influencer" && (
            <SocialConnectForm onBack={handleBack} />
          )}
          {currentStep === 2 && userType !== "influencer" && (
            <FinalStep onBack={handleBack} />
          )}
        </Card>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetupContent />
    </Suspense>
  );
}