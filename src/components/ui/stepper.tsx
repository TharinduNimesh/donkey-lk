"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    <div className={cn("w-full flex justify-center py-4", className)}>
      <div className="relative flex max-w-2xl w-full justify-between items-center px-4">
        
        {/* Connection progress track bar in the background */}
        <div className="absolute top-[18px] left-[40px] right-[40px] h-[3px] bg-gray-150 dark:bg-zinc-800 rounded-full z-0">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.4)]"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;

          return (
            <div key={index} className="relative z-10 flex flex-col items-center">
              {/* Step indicator node */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{
                  scale: isCurrent ? 1.08 : 1,
                  borderColor: isCurrent ? "#ec4899" : isCompleted ? "#8b5cf6" : "#e5e7eb",
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "h-9 w-9 rounded-full border-2 bg-white dark:bg-zinc-900 flex items-center justify-center font-bold text-xs transition-all duration-300 relative shadow-sm",
                  isCompleted
                    ? "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950"
                    : isCurrent
                    ? "border-pink-500 text-pink-600 bg-pink-50 dark:bg-pink-950 shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                    : "border-gray-200 text-gray-400 dark:border-zinc-800 dark:text-zinc-600"
                )}
              >
                {/* Glowing ring for current step */}
                {isCurrent && (
                  <span className="absolute -inset-1 rounded-full border border-pink-500/30 animate-ping opacity-60 pointer-events-none" />
                )}

                {isCompleted ? (
                  <svg
                    className="h-4 w-4 stroke-[3]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>

              {/* Step Title */}
              <span
                className={cn(
                  "absolute top-11 text-[10px] font-bold uppercase tracking-wider text-center transition-all duration-300 px-2 select-none whitespace-nowrap",
                  isCompleted
                    ? "text-purple-600 dark:text-purple-400"
                    : isCurrent
                    ? "text-pink-600 dark:text-pink-400 font-extrabold"
                    : "text-gray-400 dark:text-zinc-600"
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}