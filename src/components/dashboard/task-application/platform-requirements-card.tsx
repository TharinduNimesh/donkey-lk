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
  // Static FX rate from env: 1 USD = NEXT_PUBLIC_LKR_PER_USD LKR
  const LKR_PER_USD = Number(process.env.NEXT_PUBLIC_LKR_PER_USD ?? "295");
  const LKR_TO_USD = 1 / (LKR_PER_USD || 295);

  const formatUSD = (lkrAmount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(lkrAmount * LKR_TO_USD);

  const getPlatformHoverStyle = (platform: string) => {
    const norm = platform.toUpperCase();
    if (norm === 'YOUTUBE') {
      return 'hover:border-red-500/40 hover:shadow-[0_8px_30px_rgb(239,68,68,0.08)] dark:hover:border-red-500/30';
    }
    if (norm === 'FACEBOOK') {
      return 'hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgb(59,130,246,0.08)] dark:hover:border-blue-500/30';
    }
    if (norm === 'TIKTOK') {
      return 'hover:border-zinc-700/80 hover:shadow-[0_8px_30px_rgb(9,9,11,0.15)] dark:hover:border-zinc-800';
    }
    if (norm === 'INSTAGRAM') {
      return 'hover:border-pink-500/40 hover:shadow-[0_8px_30px_rgb(236,72,153,0.08)] dark:hover:border-pink-500/30';
    }
    return 'hover:border-pink-300/70 dark:hover:border-pink-800/60';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pt-3"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">Platform Requirements</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Select your promised reach for verified profiles</p>
          </div>
          <Link 
            href="/dashboard/influencer/platforms" 
            className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors flex items-center gap-1 group bg-pink-50 dark:bg-pink-950/20 px-2.5 py-1 rounded-md border border-pink-100 dark:border-pink-900/30"
          >
            Manage platforms
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {targets?.map((target, index) => {
            const platformProfiles = verifiedProfiles.filter(p => p.platform === target.platform);
            const isVerified = platformProfiles.length > 0;
            return (
              <motion.div
                key={target.platform}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -3 }}
                className="h-full"
              >
                <Card className={`border bg-white dark:bg-gray-900 transition-all duration-350 h-full overflow-hidden flex flex-col justify-between shadow-xs ${
                  isVerified 
                    ? `border-gray-200 dark:border-gray-800 ${getPlatformHoverStyle(target.platform)}` 
                    : 'border-gray-150/80 dark:border-gray-905 opacity-90'
                }`}>
                  <CardHeader className="py-2.5 px-4 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/30 dark:bg-gray-900/20">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-3 min-w-0">
                        {isVerified && platformProfiles.length > 0 ? (
                          <div className="relative shrink-0">
                            <div className="flex -space-x-2.5 overflow-hidden">
                              {platformProfiles.slice(0, 3).map((prof) => (
                                <div key={prof.id} className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-white text-[10px] font-bold overflow-hidden border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-850 shadow-3xs">
                                  {prof.profile_pic ? (
                                    <img src={prof.profile_pic} alt={prof.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-500 font-bold">{prof.name?.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="absolute -bottom-1 -right-1 rounded-full border border-white dark:border-gray-900 shadow-3xs overflow-hidden z-10">
                              <PlatformIcon platform={target.platform} size="xs" />
                            </div>
                          </div>
                        ) : (
                          <PlatformIcon platform={target.platform} size="sm" />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-xs leading-none uppercase tracking-wider">{target.platform}</h3>
                          {isVerified && (
                            <p className="text-[10px] text-pink-600 dark:text-pink-400 truncate font-bold mt-1.5 leading-none">
                              {platformProfiles.length === 1 
                                ? platformProfiles[0].name 
                                : platformProfiles.length === 2 
                                  ? `${platformProfiles[0].name}, ${platformProfiles[1].name}` 
                                  : `${platformProfiles[0].name} + ${platformProfiles.length - 1} more`
                              }
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isVerified ? (
                          <Badge className="pointer-events-none select-none bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 border border-emerald-105 dark:border-emerald-900/30 rounded-full font-semibold text-[10px] flex items-center gap-0.5 shadow-3xs">
                            <Check className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="pointer-events-none select-none bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 px-2 py-0.5 border border-amber-105 dark:border-amber-900/30 rounded-full font-semibold text-[10px] flex items-center gap-0.5 shadow-3xs">
                            Not Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="grid grid-cols-2 gap-3 bg-gray-50/50 dark:bg-gray-800/20 p-2.5 rounded-lg border border-gray-100/50 dark:border-gray-800/50">
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">Target Views</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          {formatViewCount(parseViewCount(target.views))}
                        </p>
                      </div>

                      {target.due_date && (
                        <div className="space-y-0.5">
                          <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">Due Date</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 flex items-center">
                            <Clock className="mr-1 h-3 w-3 text-pink-500" />
                            {format(new Date(target.due_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">Promised Reach</label>
                      <Select
                        value={selectedViews[target.platform] || "0"}
                        onValueChange={(value) => onViewsChange(target.platform, value)}
                        disabled={!isVerified}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 h-9 rounded-md hover:border-pink-300 dark:hover:border-pink-800 transition-colors focus:ring-pink-500/20 focus:border-pink-500 text-xs">
                          <SelectValue placeholder="Select promised views" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-lg">
                          <SelectItem value="0">Select promised views</SelectItem>
                          {getAvailableViewOptions(target.platform).map((option) => (
                            <SelectItem key={option.value} value={option.value} className="focus:bg-pink-50 dark:focus:bg-pink-950/20 focus:text-pink-600 dark:focus:text-pink-400 text-xs">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!isVerified && (
                        <div className="flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/10 p-2 rounded border border-amber-100/40 dark:border-amber-900/20">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <p className="text-[10px] leading-relaxed">
                            Verify {target.platform} to apply.
                          </p>
                        </div>
                      )}
                    </div>

                    {earnings[target.platform] > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-2.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/5 dark:to-teal-500/0 border border-emerald-500/20 dark:border-emerald-500/10 shadow-3xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                            Potential Earnings
                          </span>
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            {formatUSD(earnings[target.platform])}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

