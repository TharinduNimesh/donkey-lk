"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FinalStepProps {
  onBack: () => void;
}

export function FinalStep({ onBack }: FinalStepProps) {
  const router = useRouter();

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
                onClick={() => router.push("/tasks/create")}
              >
                Create Task
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
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-start">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}