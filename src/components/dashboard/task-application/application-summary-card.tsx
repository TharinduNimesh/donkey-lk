import React from "react";
import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Database } from "@/types/database.types";
import { formatViewCount, parseViewCount } from "@/lib/utils/views";
import { PlatformIcon } from "./platform-icon";

interface ApplicationSummaryCardProps {
  targets: Array<{
    platform: Database['public']['Enums']['Platforms'];
    views: string;
  }>;
  selectedViews: Record<string, string>;
  earnings: Record<string, number>;
  calculateTotalViews: (platform: string) => number;
}

export function ApplicationSummaryCard({
  targets,
  selectedViews,
  earnings,
  calculateTotalViews
}: ApplicationSummaryCardProps) {
  // Currency: 1 USD = NEXT_PUBLIC_LKR_PER_USD LKR
  const LKR_PER_USD = Number(process.env.NEXT_PUBLIC_LKR_PER_USD ?? "295");
  const LKR_TO_USD = 1 / (LKR_PER_USD || 295);
  const formatUSD = (lkrAmount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(lkrAmount * LKR_TO_USD);

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <CardHeader className="py-3 px-4 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/20 dark:bg-gray-900/10">
        <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">Application Summary</CardTitle>
        <CardDescription className="text-[10px] text-muted-foreground">
          Review your estimated reach & payouts
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-3">
            {targets?.map((target, index) => {
              const viewsSelected = calculateTotalViews(target.platform);
              const hasSelection = viewsSelected > 0;
              return (
                <motion.div
                  key={target.platform}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  whileHover={hasSelection ? { y: -1 } : {}}
                  className={!hasSelection ? "opacity-50 grayscale bg-gray-50/10 dark:bg-transparent" : ""}
                >
                  <Card className={`border transition-all duration-300 h-full flex flex-col justify-between ${
                    hasSelection 
                      ? "border-pink-200 dark:border-pink-900/40 bg-pink-50/5 dark:bg-pink-950/5 shadow-3xs" 
                      : "border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-900 shadow-none"
                  }`}>
                    <CardContent className="py-2.5 px-3 flex flex-col justify-between flex-1 space-y-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <PlatformIcon platform={target.platform} size="sm" />
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{target.platform}</h3>
                          <div className="flex items-center text-[11px] text-muted-foreground mt-0.5 font-medium">
                            <span className={`font-bold ${hasSelection ? 'text-pink-600 dark:text-pink-400' : ''}`}>
                              {formatViewCount(viewsSelected)}
                            </span>
                            <span className="mx-0.5">/</span>
                            <span>{formatViewCount(parseViewCount(target.views))} views</span>
                          </div>
                        </div>
                      </div>
                      
                      {earnings[target.platform] > 0 && (
                        <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800/80 flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider leading-none">Est. Earnings</span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatUSD(earnings[target.platform])}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          
          {Object.values(earnings).some(e => e > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-500/5 dark:via-teal-500/0 border border-emerald-500/20 dark:border-emerald-500/10 shadow-3xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-3xs shrink-0">
                    <DollarSign className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Total Est. Earnings</span>
                  </div>
                </div>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                  {formatUSD(Object.values(earnings).reduce((sum, current) => sum + current, 0))}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

