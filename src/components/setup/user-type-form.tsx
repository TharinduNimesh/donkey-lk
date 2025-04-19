"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSetupStore } from "@/lib/store";

interface UserTypeFormProps {
  onNext: () => void;
  onBack: () => void;
}

export function UserTypeForm({ onNext, onBack }: UserTypeFormProps) {
  const { setUserType } = useSetupStore();

  const handleSelect = (type: "brand" | "influencer") => {
    setUserType(type);
    onNext();
  };

  const cardVariants = {
    hover: {
      scale: 1.03,
      borderColor: "rgba(236, 72, 153, 0.5)",
      boxShadow: "0 10px 15px -3px rgba(236, 72, 153, 0.1), 0 4px 6px -4px rgba(236, 72, 153, 0.1)",
    },
  };

  return (
    <div className="space-y-6">
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600 font-display">
          Choose Your Role
        </h2>
        <p className="text-sm text-muted-foreground">
          Select how you want to use BrandSync
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          whileHover="hover"
          variants={cardVariants}
          transition={{ delay: 0.1, duration: 0.3 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card
            className="p-6 cursor-pointer border border-pink-100/50 dark:border-pink-900/50 h-full transition-all duration-200"
            onClick={() => handleSelect("brand")}
          >
            <div className="space-y-4 flex flex-col h-full">
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 w-14 h-14 rounded-full flex items-center justify-center shadow-sm">
                <svg
                  className="w-7 h-7 text-pink-600 dark:text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-lg">I'm a Brand</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Looking to connect with content creators for promotions and
                  increase your reach across social media platforms.
                </p>
              </div>
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleSelect("brand")}
                  className="w-full border-pink-200 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900 dark:hover:bg-pink-950 dark:hover:text-pink-300"
                >
                  Select as Brand
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          whileHover="hover"
          variants={cardVariants}
          transition={{ delay: 0.2, duration: 0.3 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card
            className="p-6 cursor-pointer border border-pink-100/50 dark:border-pink-900/50 h-full transition-all duration-200"
            onClick={() => handleSelect("influencer")}
          >
            <div className="space-y-4 flex flex-col h-full">
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 w-14 h-14 rounded-full flex items-center justify-center shadow-sm">
                <svg
                  className="w-7 h-7 text-pink-600 dark:text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"
                  />
                </svg>
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-lg">I'm an Influencer</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Looking to monetize your content through brand collaborations
                  and grow your social media presence.
                </p>
              </div>
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleSelect("influencer")}
                  className="w-full border-pink-200 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900 dark:hover:bg-pink-950 dark:hover:text-pink-300"
                >
                  Select as Influencer
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div 
        className="flex justify-start pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <svg
            className="mr-2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </Button>
      </motion.div>
    </div>
  );
}
