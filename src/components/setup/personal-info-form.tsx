"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSetupStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().regex(/^[0-9+]{10,12}$/, "Invalid mobile number (10-12 digits)"),
});

interface PersonalInfoFormProps {
  onNext: () => void;
  onBack: () => void;
}

export function PersonalInfoForm({ onNext, onBack }: PersonalInfoFormProps) {
  const { setPersonalInfo, personalInfo, userType } = useSetupStore();

  const isBrand = userType === "brand";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: personalInfo?.name || "",
      mobile: personalInfo?.mobile || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setPersonalInfo(values);
    onNext();
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className={cn(
          "text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r font-display",
          isBrand ? "from-pink-500 to-pink-600" : "from-purple-500 to-purple-600"
        )}>
          Personal Information
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
          Please provide your details to continue setting up your account
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className={cn(
          "border rounded-2xl p-6 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xs",
          isBrand ? "border-pink-100 dark:border-pink-900/20" : "border-purple-100 dark:border-purple-900/20"
        )}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        hoverColor={isBrand ? "#E91E63" : "#8b5cf6"}
                        className={cn(
                          "focus-visible:ring-2",
                          isBrand ? "focus-visible:ring-pink-500/20" : "focus-visible:ring-purple-500/20"
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                      Mobile Number
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+94XXXXXXXXX" 
                        {...field} 
                        hoverColor={isBrand ? "#E91E63" : "#8b5cf6"}
                        className={cn(
                          "focus-visible:ring-2",
                          isBrand ? "focus-visible:ring-pink-500/20" : "focus-visible:ring-purple-500/20"
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className={cn(
                    "flex-1 h-10 text-xs font-bold uppercase tracking-wider transition-colors duration-200",
                    isBrand 
                      ? "border-pink-200 text-pink-700 hover:bg-pink-50 dark:border-pink-900/50 dark:text-pink-400 dark:hover:bg-pink-950/20" 
                      : "border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-950/20"
                  )}
                >
                  Back
                </Button>
                <button
                  className={cn(
                    "flex-1 group/btn relative flex h-10 items-center justify-center rounded-md font-bold text-xs uppercase tracking-wider text-white shadow-sm transition-all duration-300 hover:shadow-md",
                    isBrand 
                      ? "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-pink-100 dark:shadow-pink-900/10" 
                      : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-100 dark:shadow-purple-900/10"
                  )}
                  type="submit"
                >
                  Continue
                  <BottomGradient />
                </button>
              </div>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};
