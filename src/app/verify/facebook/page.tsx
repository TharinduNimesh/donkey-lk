"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useSetupStore } from "@/lib/store";

type VerificationStep = "initial" | "checking" | "verified";

export default function FacebookVerificationPage() {
  const router = useRouter();
  const { connectPlatform } = useSetupStore();
  const [verificationStep, setVerificationStep] = useState<VerificationStep>("initial");

  const handleManualVerification = () => {
    toast.info(
      "Manual verification request submitted",
      {
        description: "Our team will contact you within 24-48 hours to verify your page ownership.",
      }
    );
    
    // Simulate verification process starting
    setVerificationStep("checking");
    
    // For demo purposes, show success after 2 seconds
    setTimeout(() => {
      setVerificationStep("verified");
      connectPlatform("facebook");
    }, 2000);
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Verify Your Facebook Page</h1>
        <p className="text-muted-foreground">
          Choose a verification method to connect your Facebook page
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
                    Connect with Facebook to verify your page ownership instantly
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
                      Secure login with Facebook
                    </li>
                  </ul>
                  <Button 
                    className="w-full mt-4 bg-[#1877F2] hover:bg-[#1877F2]/90"
                    disabled
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
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
                  <Button className="w-full mt-4">
                    Start Verification
                  </Button>
                </div>
              </Card>
            </div>
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
              <p className="text-muted-foreground">Our team will contact you within 24-48 hours to verify your Facebook page.</p>
              <Button onClick={() => router.push("/dashboard")} className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </Card>

      {verificationStep !== "verified" && (
        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      )}
    </div>
  );
}