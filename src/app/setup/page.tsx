"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/stepper";
import { Card } from "@/components/ui/card";
import {
  PersonalInfoForm,
  UserTypeForm,
  SocialConnectForm,
  FinalStep
} from "@/components/setup";
import { useSetupStore } from "@/lib/store";

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const { userType } = useSetupStore();

  const steps = [
    { title: "Personal Info" },
    { title: "Account Type" },
    { title: userType === "influencer" ? "Connect Socials" : "Final Step" },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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