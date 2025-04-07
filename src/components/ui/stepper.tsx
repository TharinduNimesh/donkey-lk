"use client";

import { cn } from "@/lib/utils";

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;

          return (
            <div key={index} className="flex flex-1 items-center">
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full border-2 flex items-center justify-center",
                    isCompleted
                      ? "bg-purple-600 border-purple-600 text-white"
                      : isCurrent
                      ? "border-purple-600 text-purple-600"
                      : "border-gray-300 text-gray-300"
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "absolute top-10 text-xs text-center",
                    isCompleted || isCurrent
                      ? "text-purple-600"
                      : "text-gray-300"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 border-t-2",
                    isCompleted
                      ? "border-purple-600"
                      : "border-gray-300"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}