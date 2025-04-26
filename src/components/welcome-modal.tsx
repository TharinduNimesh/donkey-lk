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
  DollarSign,
  Eye,
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
        }, 5000);
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
        <ModalContent className="p-0 overflow-hidden shadow-xl">
          {/* Header with pink gradient */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(40deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] animate-shine"></div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold tracking-tight mb-2 font-display"
            >
              Promote Your Content
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg opacity-90"
            >
              Just Rs 0.10 per view - Affordable & Effective
            </motion.p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 gap-6">
              {/* For Buyers */}
              <motion.div
                className="border border-pink-100 dark:border-pink-900 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center mb-5">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                    <Rocket className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="ml-4 font-semibold text-xl">Promote Your Content</h3>
                </div>
                <ul className="space-y-4 text-md">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-pink-500 mr-3 mt-0.5 shrink-0" />
                    <span>
                      <span className="font-semibold text-pink-600 text-lg">
                        Just Rs 0.10
                      </span>{" "}
                      per view - the most affordable promotion in Sri Lanka
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-pink-500 mr-3 mt-0.5 shrink-0" />
                    <span>
                      Reach real audiences that are interested in your content
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-pink-500 mr-3 mt-0.5 shrink-0" />
                    <span>Start small and scale up as you see results</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-pink-500 mr-3 mt-0.5 shrink-0" />
                    <span>Track performance with detailed real-time analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-pink-500 mr-3 mt-0.5 shrink-0" />
                    <span>No minimum budget - start with as little as Rs 100</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Value Proposition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 p-6 rounded-xl border border-pink-100/50 dark:border-pink-900/50"
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="h-14 w-14 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-7 w-7 text-pink-500" />
                  </div>
                  <p className="text-sm font-medium">Pay Per View</p>
                </div>
                <div>
                  <div className="h-14 w-14 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center mx-auto mb-3">
                    <Users className="h-7 w-7 text-pink-500" />
                  </div>
                  <p className="text-sm font-medium">Real Audience</p>
                </div>
                <div>
                  <div className="h-14 w-14 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="h-7 w-7 text-pink-500" />
                  </div>
                  <p className="text-sm font-medium">Affordable</p>
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
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-300 text-lg px-6 py-5"
              onClick={handleGetStarted}
            >
              Start Promoting for Rs 0.10/View
            </Button>
          </Link>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}
