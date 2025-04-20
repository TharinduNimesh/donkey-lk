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
    <div className={cn("w-full overflow-hidden flex justify-center", className)}>
      <div className="relative flex max-w-3xl w-full justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;

          return (
            <div key={index} className="flex flex-1 items-center">
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                    isCompleted
                      ? "bg-gradient-to-r from-pink-500 to-pink-600 border-pink-500 text-white shadow-sm shadow-pink-200 dark:shadow-pink-900/20"
                      : isCurrent
                      ? "border-pink-500 text-pink-600 shadow-sm"
                      : "border-gray-300 text-gray-400 dark:border-gray-700 dark:text-gray-600"
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-4 w-4"
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
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "absolute top-10 text-xs font-medium whitespace-nowrap px-2 text-center transition-all duration-200 max-w-[80px] md:max-w-none truncate",
                    isCompleted
                      ? "text-pink-600 dark:text-pink-400"
                      : isCurrent
                      ? "text-pink-500 dark:text-pink-400"
                      : "text-gray-400 dark:text-gray-600"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 border-t-2 transition-all duration-200",
                    isCompleted
                      ? "border-pink-400"
                      : "border-gray-200 dark:border-gray-800"
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