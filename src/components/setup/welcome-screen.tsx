"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import { useRouter, useSearchParams } from "next/navigation";

interface WelcomeScreenProps {
  onNext: () => void;
  onRoleSelect?: (role: "brand" | "influencer") => void;
}

export function WelcomeScreen({ onNext, onRoleSelect }: WelcomeScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRoleClick = (role: "brand" | "influencer") => {
    if (onRoleSelect) onRoleSelect(role);
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", "1");
    params.set("role", role);
    router.push(`/setup?${params.toString()}`);
  };

  const handleGetStarted = () => {
    setIsLoading(true);
    // Simulate a small delay for animation
    setTimeout(() => {
      setIsLoading(false);
      onNext();
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 font-display">Welcome to BrandSync</h2>
        <p className="text-sm text-muted-foreground">
          The ultimate platform connecting brands with influencers
        </p>
      </div>

      <Card className="p-8 overflow-hidden relative border border-pink-200/30">
        {/* Background blob effects */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-100 dark:bg-pink-900/20 rounded-full blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="flex flex-col items-center space-y-8 relative z-10">
          <div className="w-32 h-32 relative">
            <Image
              src="/logo.png"
              alt="BrandSync Logo"
              layout="fill"
              objectFit="contain"
              className="drop-shadow-md"
            />
          </div>
          
          <div className="text-center space-y-4 max-w-md">
            <h3 className="text-xl font-medium">Let's set up your BrandSync profile</h3>
            <p className="text-sm text-muted-foreground">
              Complete this quick setup to customize your experience whether you're a brand looking 
              to boost your reach or an influencer ready to monetize your content.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 w-full max-w-lg pt-4">
  <div
    className="text-center p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200/30 dark:border-pink-800/30 cursor-pointer hover:shadow-lg transition"
    onClick={() => handleRoleClick("brand")}
    tabIndex={0}
    role="button"
    aria-label="Select Brand Role"
  >
    <div className="bg-pink-100 dark:bg-pink-800/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
      <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>
    <h4 className="font-medium">For Brands</h4>
    <p className="text-xs text-muted-foreground mt-1">
      Connect with influencers to grow your reach
    </p>
  </div>
  <div
    className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200/30 dark:border-purple-800/30 cursor-pointer hover:shadow-lg transition"
    onClick={() => handleRoleClick("influencer")}
    tabIndex={0}
    role="button"
    aria-label="Select Influencer Role"
  >
    <div className="bg-purple-100 dark:bg-purple-800/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
      </svg>
    </div>
    <h4 className="font-medium">For Influencers</h4>
    <p className="text-xs text-muted-foreground mt-1">
      Monetize your content with brand collaborations
    </p>
  </div>
</div>

          <motion.div 
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
              size="lg"
              onClick={handleGetStarted}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting things up...
                </div>
              ) : (
                "Get Started"
              )}
            </Button>
          </motion.div>
        </div>
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        <p>By continuing, you agree to our <a href="#" className="text-pink-500 hover:underline">Terms of Service</a> and <a href="#" className="text-pink-500 hover:underline">Privacy Policy</a></p>
      </div>
    </div>
  );
}