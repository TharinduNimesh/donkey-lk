"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSetupStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

interface FinalStepProps {
  onBack: () => void;
}

export function FinalStep({ onBack }: FinalStepProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { userType, personalInfo } = useSetupStore();

  const saveProfileAndNavigate = async (destination: string) => {
    if (!personalInfo || !userType) {
      toast.error("Missing required information. Please go back and fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {
      const toastId = toast.loading("Setting up your account...");

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication error. Please try logging in again.", {
          id: toastId
        });
        return;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profile')
        .insert({
          id: user.id,
          name: personalInfo.name,
          role: ['BUYER'], // Since this is the brand flow
        });

      if (profileError) {
        toast.error("Failed to create profile. Please try again.", {
          id: toastId,
          description: profileError.message,
          richColors: true
        });
        throw profileError;
      }

      // Create contact details for mobile
      const { error: contactError } = await supabase
        .from('contact_details')
        .insert({
          user_id: user.id,
          type: 'MOBILE',
          detail: personalInfo.mobile,
        });

      if (contactError) {
        toast.error("Failed to save contact details. Please try again.", {
          id: toastId,
          description: contactError.message,
          richColors: true
        });
        throw contactError;
      }

      toast.success("Account setup completed successfully!", {
        id: toastId
      });

      router.push(destination);
      router.refresh();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Ready to Start!</h2>
        <p className="text-sm text-muted-foreground">
          Your account is set up and ready to go
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Create Your First Task</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start by creating a task to connect with content creators
              </p>
              <Button 
                className="mt-4" 
                onClick={() => saveProfileAndNavigate("/tasks/create")}
                disabled={isLoading}
              >
                {isLoading ? "Setting up..." : "Create Task"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Explore Dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1">
                View your dashboard to manage your tasks and connections
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => saveProfileAndNavigate("/dashboard")}
                disabled={isLoading}
              >
                {isLoading ? "Setting up..." : "Go to Dashboard"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-start">
        <Button variant="ghost" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
      </div>
    </div>
  );
}