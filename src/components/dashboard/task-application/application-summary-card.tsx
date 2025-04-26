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
  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
        <CardTitle className="font-medium text-gray-900 dark:text-gray-100">Your Application Summary</CardTitle>
        <CardDescription>
          Review your selections before submitting your application
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {targets?.map((target, index) => (
              <motion.div
                key={target.platform}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={calculateTotalViews(target.platform) === 0 ? "opacity-50" : ""}
              >
                <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-300 h-full">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <PlatformIcon platform={target.platform} />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{target.platform}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatViewCount(calculateTotalViews(target.platform))}
                          </span>
                          <span className="mx-1">/</span>
                          <span>{formatViewCount(parseViewCount(target.views))} views</span>
                        </div>
                      </div>
                    </div>
                    
                    {earnings[target.platform] > 0 && (
                      <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Potential Earnings</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            Rs. {earnings[target.platform].toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {Object.values(earnings).some(e => e > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-0 bg-green-50 dark:bg-green-900/20 overflow-hidden relative">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-3">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-medium text-green-700 dark:text-green-300">Total Potential Earnings</span>
                    </div>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      Rs. {Object.values(earnings).reduce((sum, current) => sum + current, 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
