"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSetupStore } from "@/lib/store";
import { Check } from "lucide-react";

interface WelcomeScreenProps {
  onNext: () => void;
  onRoleSelect?: (role: "brand" | "influencer") => void;
}

export function WelcomeScreen({ onNext, onRoleSelect }: WelcomeScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { userType, setUserType } = useSetupStore();

  const handleRoleClick = (role: "brand" | "influencer") => {
    if (userType === role) {
      setUserType(null);
      if (onRoleSelect) onRoleSelect(null as any);
    } else {
      setUserType(role);
      if (onRoleSelect) onRoleSelect(role);
    }
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
          
          <div className="text-center space-y-3 max-w-md">
            <h3 className="text-xl font-medium">Let's set up your BrandSync profile</h3>
            <p className="text-sm text-muted-foreground">
              Choose your profile type to begin. You can change this later, or skip selecting a role now and choose during setup.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 w-full max-w-lg pt-2">
            {/* Brand Card Selector */}
            <div
              className={`relative text-center p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 select-none hover:shadow-md ${
                userType === "brand"
                  ? "bg-gradient-to-br from-pink-50/50 to-white dark:from-pink-950/20 dark:to-neutral-900 border-pink-500 shadow-md ring-2 ring-pink-500/10"
                  : "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-pink-200/50"
              }`}
              onClick={() => handleRoleClick("brand")}
              tabIndex={0}
              role="button"
              aria-label="Select Brand Role"
            >
              {userType === "brand" && (
                <div className="absolute top-2.5 right-2.5 bg-pink-500 text-white rounded-full p-0.5 shadow-sm">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${
                userType === "brand" ? "bg-pink-100 dark:bg-pink-850" : "bg-pink-50 dark:bg-neutral-800"
              }`}>
                <svg className={`w-6 h-6 transition-colors ${userType === "brand" ? "text-pink-600 dark:text-pink-400" : "text-pink-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className={`font-semibold text-sm ${userType === "brand" ? "text-pink-700 dark:text-pink-450" : ""}`}>For Brands</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                Connect with top creators to grow your business reach.
              </p>
            </div>

            {/* Influencer Card Selector */}
            <div
              className={`relative text-center p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 select-none hover:shadow-md ${
                userType === "influencer"
                  ? "bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-neutral-900 border-purple-500 shadow-md ring-2 ring-purple-500/10"
                  : "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-purple-200/50"
              }`}
              onClick={() => handleRoleClick("influencer")}
              tabIndex={0}
              role="button"
              aria-label="Select Influencer Role"
            >
              {userType === "influencer" && (
                <div className="absolute top-2.5 right-2.5 bg-purple-500 text-white rounded-full p-0.5 shadow-sm">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${
                userType === "influencer" ? "bg-purple-100 dark:bg-purple-850" : "bg-purple-50 dark:bg-neutral-800"
              }`}>
                <svg className={`w-6 h-6 transition-colors ${userType === "influencer" ? "text-purple-600 dark:text-purple-400" : "text-purple-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                </svg>
              </div>
              <h4 className={`font-semibold text-sm ${userType === "influencer" ? "text-purple-700 dark:text-purple-450" : ""}`}>For Influencers</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                Monetize your posts with paid brand campaigns.
              </p>
            </div>
          </div>

          <motion.div 
            className="w-full max-w-md pt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              className={`w-full text-white transition-all duration-300 font-semibold shadow-sm hover:shadow-md ${
                userType === "brand"
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
                  : userType === "influencer"
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  : "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900"
              }`}
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
              ) : userType === "brand" ? (
                "Continue as Brand"
              ) : userType === "influencer" ? (
                "Continue as Influencer"
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