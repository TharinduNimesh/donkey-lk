"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useSetupStore } from "@/lib/store";
import { Check, Compass, Users } from "lucide-react";

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
    if (!userType) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onNext();
    }, 600);
  };

  return (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-3">
        <motion.h2 
          className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 font-display"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Welcome to BrandSync
        </motion.h2>
        <motion.p 
          className="text-sm text-gray-500 dark:text-zinc-400 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          The ultimate ecosystem connecting brands with content creators
        </motion.p>
      </div>

      <div className="flex flex-col items-center space-y-8 relative z-10">
        <motion.div 
          className="w-24 h-24 relative"
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/logo.png"
            alt="BrandSync Logo"
            layout="fill"
            objectFit="contain"
            className="drop-shadow-lg"
          />
        </motion.div>
        
        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-200">Set up your profile</h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
            Choose your profile type to begin. You must select a role to continue setup.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg pt-2">
          {/* Brand Card Selector */}
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`relative text-center p-6 rounded-2xl cursor-pointer border-2 select-none transition-all duration-300 flex flex-col justify-between h-full bg-white dark:bg-zinc-900/40 backdrop-blur-sm ${
              userType === "brand"
                ? "border-pink-500 shadow-[0_4px_12px_rgba(236,72,153,0.06)] bg-gradient-to-b from-pink-50/10 to-white dark:from-pink-950/10 dark:to-zinc-900"
                : "border-gray-100 dark:border-zinc-800/80 hover:border-pink-200/50 dark:hover:border-pink-900/20"
            }`}
            onClick={() => handleRoleClick("brand")}
          >
            <AnimatePresence>
              {userType === "brand" && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute top-3 right-3 bg-pink-500 text-white rounded-full p-0.5 shadow-md shadow-pink-200 dark:shadow-pink-950"
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
                userType === "brand"
                  ? "bg-pink-500 text-white shadow-md shadow-pink-100 dark:shadow-pink-950/20"
                  : "bg-pink-50 dark:bg-pink-950/10 text-pink-500"
              }`}>
                <Compass className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h4 className={`font-bold text-sm text-gray-800 dark:text-zinc-100 transition-colors ${
                userType === "brand" ? "text-pink-600 dark:text-pink-400" : ""
              }`}>For Brands</h4>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-2 leading-relaxed">
                Connect with top creators, scale promotions, and track conversions.
              </p>
            </div>
          </motion.div>

          {/* Influencer Card Selector */}
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`relative text-center p-6 rounded-2xl cursor-pointer border-2 select-none transition-all duration-300 flex flex-col justify-between h-full bg-white dark:bg-zinc-900/40 backdrop-blur-sm ${
              userType === "influencer"
                ? "border-purple-500 shadow-[0_4px_12px_rgba(139,92,246,0.06)] bg-gradient-to-b from-purple-50/10 to-white dark:from-purple-950/10 dark:to-zinc-900"
                : "border-gray-100 dark:border-zinc-800/80 hover:border-purple-200/50 dark:hover:border-purple-900/20"
            }`}
            onClick={() => handleRoleClick("influencer")}
          >
            <AnimatePresence>
              {userType === "influencer" && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute top-3 right-3 bg-purple-500 text-white rounded-full p-0.5 shadow-md shadow-purple-200 dark:shadow-purple-950"
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
                userType === "influencer"
                  ? "bg-purple-500 text-white shadow-md shadow-purple-100 dark:shadow-purple-950/20"
                  : "bg-purple-50 dark:bg-purple-950/10 text-purple-500"
              }`}>
                <Users className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h4 className={`font-bold text-sm text-gray-800 dark:text-zinc-100 transition-colors ${
                userType === "influencer" ? "text-purple-600 dark:text-purple-400" : ""
              }`}>For Influencers</h4>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-2 leading-relaxed">
                Unlock paid sponsorships, connect socials, and monetize content.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="w-full max-w-md pt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Button 
            className={`w-full text-white transition-all duration-300 font-bold text-xs uppercase tracking-wider h-11 shadow-sm hover:shadow-md ${
              userType === "brand"
                ? "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-pink-100 dark:shadow-pink-900/10"
                : userType === "influencer"
                ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-100 dark:shadow-purple-900/10"
                : "bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed border border-gray-300 dark:border-zinc-700 pointer-events-none"
            }`}
            size="lg"
            onClick={handleGetStarted}
            disabled={isLoading || !userType}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : userType === "brand" ? (
              "Continue as Brand"
            ) : userType === "influencer" ? (
              "Continue as Influencer"
            ) : (
              "Select a Role to Continue"
            )}
          </Button>
        </motion.div>
      </div>

      <div className="text-center text-[10px] text-gray-400 dark:text-zinc-550 font-medium">
        <p>By continuing, you agree to our <a href="#" className="hover:text-pink-500 hover:underline">Terms of Service</a> and <a href="#" className="hover:text-pink-500 hover:underline">Privacy Policy</a></p>
      </div>
    </div>
  );
}