import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { AlertCircle, Check, Clock, DollarSign, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/types/database.types";
import { formatViewCount, parseViewCount } from "@/lib/utils/views";
import { PlatformIcon } from "./platform-icon";
import Link from "next/link";

type InfluencerProfile = Database["public"]["Tables"]["influencer_profile"]["Row"];

interface PlatformRequirementsCardProps {
  targets: Array<{
    platform: Database['public']['Enums']['Platforms'];
    views: string;
    due_date: string | null;
  }>;
  verifiedProfiles: InfluencerProfile[];
  selectedViews: Record<string, string>;
  earnings: Record<string, number>;
  onViewsChange: (platform: string, views: string) => void;
  getAvailableViewOptions: (targetViews: string) => Array<{ value: string; label: string }>;
}

export function PlatformRequirementsCard({
  targets,
  verifiedProfiles,
  selectedViews,
  earnings,
  onViewsChange,
  getAvailableViewOptions
}: PlatformRequirementsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Platform Requirements</h2>
          <Link href="/dashboard/influencer/platforms" className="text-sm text-pink-600 dark:text-pink-400 hover:underline flex items-center">
            Manage your platforms
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {targets?.map((target, index) => (
            <motion.div
              key={target.platform}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-300 h-full overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <PlatformIcon platform={target.platform} />
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{target.platform}</h3>
                    </div>
                    {verifiedProfiles.some(p => p.platform === target.platform) ? (
                      <Badge className="pointer-events-none select-none bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5">
                        <Check className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="pointer-events-none select-none border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400 px-2 py-0.5">
                        Not Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Target Views</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatViewCount(parseViewCount(target.views))}
                      </p>
                    </div>

                    {target.due_date && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                          <Clock className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                          {format(new Date(target.due_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Promised Reach</label>
                    <Select
                      value={selectedViews[target.platform] || "0"}
                      onValueChange={(value) => onViewsChange(target.platform, value)}
                      disabled={!verifiedProfiles.some(p => p.platform === target.platform)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select promised views" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Select promised views</SelectItem>
                        {getAvailableViewOptions(target.views).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!verifiedProfiles.some(p => p.platform === target.platform) && (
                      <div className="flex items-center mt-2 text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                        <p className="text-xs">
                          Please verify your {target.platform} account to apply
                        </p>
                      </div>
                    )}
                  </div>

                  {earnings[target.platform] > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700 dark:text-green-300 flex items-center">
                          <DollarSign className="h-3.5 w-3.5 mr-1" />
                          Potential Earnings
                        </span>
                        <span className="font-medium text-green-700 dark:text-green-300">
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
      </div>
    </motion.div>
  );
}
