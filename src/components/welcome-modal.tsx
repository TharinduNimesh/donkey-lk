"use client";

import { useEffect } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  useModal,
} from "@/components/ui/animated-modal";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import Link from "next/link";
import {
  CheckCircle2,
  TrendingUp,
  Users,
  Rocket,
  Sparkles,
  DollarSign,
} from "lucide-react";

export function WelcomeModal() {
  const { open, setOpen } = useModal();
  const MODAL_INTERVAL_HOURS = 24;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const lastSeen = localStorage.getItem("brandSyncWelcomeLastSeen");
      let shouldShow = true;
      if (lastSeen) {
        const last = parseInt(lastSeen, 10);
        const now = Date.now();
        const hoursPassed = (now - last) / (1000 * 60 * 60);
        if (hoursPassed < MODAL_INTERVAL_HOURS) {
          shouldShow = false;
        }
      }
      if (shouldShow) {
        const timer = setTimeout(() => {
          setOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [setOpen]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("brandSyncWelcomeLastSeen", Date.now().toString());
    }
    setOpen(false);
  };

  const handleGetStarted = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("brandSyncWelcomeLastSeen", Date.now().toString());
    }
    setOpen(false);
  };

  return (
    <Modal>
      <ModalBody className="md:max-w-[600px]">
        <ModalContent className="p-0 overflow-hidden">
          {/* Header with pink gradient */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(40deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] animate-shine"></div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold tracking-tight mb-2 font-display"
            >
              Transform Your Social Presence
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg opacity-90"
            >
              Join BrandSync: Where Influence Meets Opportunity
            </motion.p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* For Brands */}
              <motion.div
                className="border border-pink-100 dark:border-pink-900 rounded-xl p-5 hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="ml-3 font-semibold text-lg">For Brands</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-2 mt-0.5 shrink-0" />
                    <span>
                      Get authentic views from real audiences at just{" "}
                      <span className="font-semibold text-pink-600">
                        Rs0.10
                      </span>{" "}
                      per view
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-2 mt-0.5 shrink-0" />
                    <span>
                      Connect with influencers who match your brand's vision
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-2 mt-0.5 shrink-0" />
                    <span>Track performance with real-time analytics</span>
                  </li>
                </ul>
              </motion.div>

              {/* For Influencers */}
              <motion.div
                className="border border-pink-100 dark:border-pink-900 rounded-xl p-5 hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="ml-3 font-semibold text-lg">
                    For Influencers
                  </h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-2 mt-0.5 shrink-0" />
                    <span>
                      Turn your following into earnings with premium brand
                      partnerships
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-2 mt-0.5 shrink-0" />
                    <span>Choose campaigns that align with your content</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-2 mt-0.5 shrink-0" />
                    <span>Get paid instantly for successful promotions</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Value Proposition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 p-6 rounded-xl border border-pink-100/50 dark:border-pink-900/50"
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-6 w-6 text-pink-500" />
                  </div>
                  <p className="text-sm font-medium">Rapid Growth</p>
                </div>
                <div>
                  <div className="h-12 w-12 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center mx-auto mb-2">
                    <Users className="h-6 w-6 text-pink-500" />
                  </div>
                  <p className="text-sm font-medium">Real Audience</p>
                </div>
                <div>
                  <div className="h-12 w-12 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="h-6 w-6 text-pink-500" />
                  </div>
                  <p className="text-sm font-medium">Better ROI</p>
                </div>
              </div>
            </motion.div>
          </div>
        </ModalContent>
        <ModalFooter className="gap-3">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="hover:bg-pink-50 dark:hover:bg-pink-950"
          >
            Maybe Later
          </Button>
          <Link href="/auth/signup">
            <Button
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
              onClick={handleGetStarted}
            >
              Get Started Now
            </Button>
          </Link>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}
