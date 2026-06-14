"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, X, CheckCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GiftBonusModalProps {
  userId: string;
  isClaimedInDb: boolean;
  onClaimSuccess: (updatedBalance: any) => void;
}

export function GiftBonusModal({ userId, isClaimedInDb, onClaimSuccess }: GiftBonusModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; color: string; left: string; angle: string; delay: string; duration: string }>>([]);

  const PINK = "#C8185A";

  useEffect(() => {
    if (!userId) return;

    // Check if they already claimed in this session or local storage, or if DB shows it is claimed
    const localClaimed = localStorage.getItem(`claimed_bonus_${userId}`);
    if (!isClaimedInDb && !localClaimed) {
      // Show the modal after a small delay on initial dashboard load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userId, isClaimedInDb]);

  // Generate particles for confetti effect
  const generateParticles = () => {
    const colors = ["#C8185A", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];
    const newParticles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: `${Math.random() * 100}%`,
      angle: `${Math.random() * 360}deg`,
      delay: `${Math.random() * 0.5}s`,
      duration: `${1.5 + Math.random() * 1.5}s`
    }));
    setParticles(newParticles);
  };

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      const res = await fetch("/api/influencer/claim-bonus", {
        method: "POST"
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to claim bonus");
      }

      setIsClaimed(true);
      setShowConfetti(true);
      generateParticles();
      
      // Save to local storage to prevent showing it again
      localStorage.setItem(`claimed_bonus_${userId}`, "true");

      toast.success("Welcome bonus claimed successfully!");
      
      // Update parent balance state
      if (data.balance) {
        onClaimSuccess(data.balance);
      }

      // Close modal after some seconds showing the success and confetti animation
      setTimeout(() => {
        setIsOpen(false);
      }, 4000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
      setIsClaiming(false);
    }
  };

  const handleClose = () => {
    // Save to local storage even if closed, to avoid annoying the user repeatedly in the same session,
    // but they can still claim it on next reload if they haven't actually claimed it yet.
    setIsOpen(false);
  };

  return (
    <>
      <style>{`
        @keyframes float-up-particle {
          0% {
            transform: translateY(100vh) rotate(0deg) scale(0);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(50vh) rotate(180deg) scale(1.2);
          }
          100% {
            transform: translateY(-10vh) rotate(720deg) scale(0.6);
            opacity: 0;
          }
        }
        .confetti-p {
          position: fixed;
          bottom: -20px;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          pointer-events: none;
          z-index: 9999;
          animation: float-up-particle linear forwards;
        }
      `}</style>

      {/* Confetti Container */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="confetti-p"
              style={{
                left: p.left,
                backgroundColor: p.color,
                transform: `rotate(${p.angle})`,
                animationDelay: p.delay,
                animationDuration: p.duration
              }}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={isClaimed ? undefined : handleClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl border border-gray-150 z-10"
            >
              {/* Close Button */}
              {!isClaimed && (
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Gift Content States */}
              <AnimatePresence mode="wait">
                {!isClaimed ? (
                  <motion.div
                    key="unclaimed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center"
                  >
                    {/* Bouncing Gift Icon */}
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, -3, 3, -3, 3, 0]
                      }}
                      transition={{ 
                        y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                        rotate: { repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.2 }
                      }}
                      className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-pink-50 mb-4"
                    >
                      <Gift className="h-10 w-10" style={{ color: PINK }} />
                      <Sparkles className="absolute -top-1.5 -right-1.5 h-5 w-5 text-amber-500 animate-pulse" />
                      <Sparkles className="absolute -bottom-1 -left-1 h-4 w-4 text-amber-400 animate-pulse delay-75" />
                    </motion.div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to BrandSync!</h3>
                    <p className="text-sm text-gray-500 mb-6 px-2">
                      Here is a special welcome gift to start your journey. Claim your free $1.00 USD sign-up bonus now!
                    </p>

                    {/* Reward Card */}
                    <div className="w-full bg-pink-50/50 rounded-xl border border-pink-100 p-4 mb-6 flex items-center justify-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                        <Wallet className="h-5 w-5" style={{ color: PINK }} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-pink-600 font-semibold uppercase tracking-wide">Signup Bonus</p>
                        <p className="text-xl font-bold text-gray-900">$1.00 USD <span className="text-xs text-gray-400 font-normal"></span></p>
                      </div>
                    </div>

                    <Button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="w-full h-10 font-bold text-white shadow-md hover:shadow-lg transition-all"
                      style={{ background: PINK }}
                    >
                      {isClaiming ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Claiming Bonus...
                        </>
                      ) : (
                        "Claim Bonus 🎁"
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="claimed"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4"
                    >
                      <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </motion.div>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">Congratulations!</h3>
                    <p className="text-sm text-emerald-600 font-semibold mb-2">+$1.00 USD Credited</p>
                    <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                      Your welcome gift has been added to your available balance. Have fun monetizing!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
