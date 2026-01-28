"use client";

import { useEffect, useState } from "react";
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
  DollarSign,
  Eye,
  Sparkles,
} from "lucide-react";

const STORAGE_KEY = "brandSyncWelcomeLastSeen";
const MODAL_INTERVAL_HOURS = 24;

export function WelcomeModal() {
  const { open, setOpen } = useModal();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || hasChecked) return;

    const checkAndShowModal = () => {
      const lastSeenStr = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      let shouldShow = true;

      if (lastSeenStr) {
        const lastSeen = parseInt(lastSeenStr, 10);
        if (!isNaN(lastSeen)) {
          const hoursPassed = (now - lastSeen) / (1000 * 60 * 60);
          shouldShow = hoursPassed >= MODAL_INTERVAL_HOURS;
        }
      }

      setHasChecked(true);

      if (shouldShow) {
        const timer = setTimeout(() => {
          setOpen(true);
          // Store timestamp immediately when showing
          localStorage.setItem(STORAGE_KEY, now.toString());
        }, 2000);
        return () => clearTimeout(timer);
      }
    };

    checkAndShowModal();
  }, [setOpen, hasChecked]);

  const handleDismiss = () => {
    setOpen(false);
  };

  const handleGetStarted = () => {
    setOpen(false);
  };

  return (
    <Modal>
      <ModalBody className="md:max-w-[920px] max-h-[95vh]">
        <ModalContent className="p-0 overflow-y-auto overflow-x-hidden shadow-xl">
          {/* Header with pink gradient */}
          <div className="bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 px-5 py-8 md:px-8 md:py-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(40deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] animate-shine"></div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center relative z-10"
            >
              <div className="flex items-center justify-center mb-3 md:mb-4">
                <Sparkles className="h-7 w-7 md:h-8 md:w-8 mr-2 md:mr-3" />
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight font-display">
                  Welcome to BrandSync
                </h2>
              </div>
              <p className="text-sm md:text-lg opacity-95 max-w-2xl mx-auto leading-relaxed">
                Whether you're looking to promote your brand or earn money as an influencer,
                we've got you covered!
              </p>
            </motion.div>
          </div>

          {/* Two Column Layout */}
          <div className="p-5 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
              {/* For Brands/Buyers */}
              <motion.div
                className="border-2 border-pink-200 dark:border-pink-800 rounded-2xl p-5 md:p-7 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-pink-50/50 to-white dark:from-pink-950/20 dark:to-neutral-900"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center mb-5 md:mb-6">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shrink-0">
                    <Rocket className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <h3 className="font-bold text-lg md:text-xl font-display leading-tight">For Brands</h3>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Grow Your Content</p>
                  </div>
                </div>

                {/* Pricing Highlight */}
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-5 md:p-6 mb-5 md:mb-6 text-white">
                  <div className="flex items-baseline justify-center mb-1">
                    <span className="text-4xl md:text-5xl font-bold">100K</span>
                    <span className="text-xl md:text-2xl ml-2">views</span>
                  </div>
                  <div className="text-center mt-2 md:mt-3">
                    <span className="text-sm opacity-90">for just</span>
                    <div className="flex items-baseline justify-center mt-1 md:mt-2 mb-2 md:mb-3">
                      <span className="text-3xl md:text-4xl font-bold">Rs 4,500</span>
                    </div>
                    <div className="text-xs opacity-90 bg-white/20 rounded-full px-3 md:px-4 py-1 md:py-1.5 inline-block">
                      Less than Rs 0.05 per view
                    </div>
                  </div>
                </div>

                <ul className="space-y-2.5 md:space-y-3.5 text-xs md:text-sm">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-pink-500 mr-2 md:mr-3 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">Most affordable promotion rates in Sri Lanka</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-pink-500 mr-2 md:mr-3 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">Real engagement from authentic audiences</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-pink-500 mr-2 md:mr-3 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">Track performance with real-time analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-pink-500 mr-2 md:mr-3 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">Start with any budget - no minimums</span>
                  </li>
                </ul>
              </motion.div>

              {/* For Influencers */}
              <motion.div
                className="border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-5 md:p-7 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-neutral-900"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center mb-5 md:mb-6">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shrink-0">
                    <DollarSign className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <h3 className="font-bold text-lg md:text-xl font-display leading-tight">For Influencers</h3>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Monetize Your Content</p>
                  </div>
                </div>

                {/* Earnings Highlight */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-5 md:p-6 mb-5 md:mb-6 text-white">
                  <div className="flex items-baseline justify-center mb-1">
                    <span className="text-4xl md:text-5xl font-bold">$10</span>
                  </div>
                  <div className="text-center mt-2 md:mt-3">
                    <span className="text-sm opacity-90">per</span>
                    <div className="flex items-baseline justify-center mt-1 md:mt-2 mb-2 md:mb-3">
                      <span className="text-3xl md:text-4xl font-bold">100K views</span>
                    </div>
                    <div className="text-xs opacity-90 bg-white/20 rounded-full px-3 md:px-4 py-1 md:py-1.5 inline-block">
                      Earn while promoting brands you love
                    </div>
                  </div>
                </div>

                <ul className="space-y-2.5 md:space-y-3.5 text-xs md:text-sm">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-purple-500 mr-2 md:mr-3 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">Get paid for completing brand tasks</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-purple-500 mr-2 md:mr-3 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">Choose brands that match your niche</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-purple-500 mr-2 md:mr-3 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">Fast and secure payment processing</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-purple-500 mr-2 md:mr-3 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">Build your portfolio and reputation</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Bottom Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 md:mt-8 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 p-5 md:p-8 rounded-xl border border-pink-100/50 dark:border-pink-900/50"
            >
              <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
                <div>
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <Eye className="h-5 w-5 md:h-6 md:w-6 text-pink-500" />
                  </div>
                  <p className="text-xs md:text-sm font-semibold leading-tight mb-1">Pay Per View</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">Transparent Pricing</p>
                </div>
                <div>
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-pink-500" />
                  </div>
                  <p className="text-xs md:text-sm font-semibold leading-tight mb-1">Real Audiences</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">Genuine Engagement</p>
                </div>
                <div>
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-pink-500" />
                  </div>
                  <p className="text-xs md:text-sm font-semibold leading-tight mb-1">Grow Together</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">Win-Win Platform</p>
                </div>
              </div>
            </motion.div>
          </div>
        </ModalContent>
        <ModalFooter className="gap-3 md:gap-4 pt-3 md:pt-4 sticky bottom-0 z-10 bg-gray-100 dark:bg-neutral-900">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="hover:bg-pink-50 dark:hover:bg-pink-950 border-pink-200 dark:border-pink-800 px-4 py-3 md:px-6 md:py-5 text-sm md:text-base"
          >
            Maybe Later
          </Button>
          <Link href="/auth/signup">
            <Button
              className="bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 md:px-8 md:py-5 text-sm md:text-base"
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
