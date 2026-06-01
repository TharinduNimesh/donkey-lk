import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Database } from "@/types/database.types";
import { parseViewCount, formatViewCount } from "@/lib/utils/views";
import Image from "next/image";
import { CalendarClock, Target, Eye } from "lucide-react";

interface PlatformTargetsCardProps {
  targets: Array<{
    platform: Database["public"]["Enums"]["Platforms"];
    views: string;
    due_date: string | null;
  }>;
}

// Get platform-specific colors for the dark theme
const platformStyles: Record<
  string,
  { bg: string; border: string; text: string; iconBg: string }
> = {
  YOUTUBE: {
    bg: "from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-950/5",
    border: "border-red-100 dark:border-red-500/20",
    text: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-500/10",
  },
  TIKTOK: {
    bg: "from-cyan-50 to-cyan-100/50 dark:from-cyan-950/20 dark:to-cyan-950/5",
    border: "border-cyan-100 dark:border-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-100 dark:bg-cyan-500/10",
  },
  INSTAGRAM: {
    bg: "from-pink-50 to-pink-100/50 dark:from-pink-950/20 dark:to-pink-950/5",
    border: "border-pink-100 dark:border-pink-500/20",
    text: "text-pink-600 dark:text-pink-400",
    iconBg: "bg-pink-100 dark:bg-pink-500/10",
  },
  FACEBOOK: {
    bg: "from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-950/5",
    border: "border-blue-100 dark:border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-500/10",
  },
  TWITTER: {
    bg: "from-sky-50 to-sky-100/50 dark:from-sky-950/20 dark:to-sky-950/5",
    border: "border-sky-100 dark:border-sky-500/20",
    text: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-100 dark:bg-sky-500/10",
  },
};

// Get platform logo path
const getPlatformLogo = (platform: string) => {
  const platformName = platform.toLowerCase();
  return `/platforms/${platformName}.png`;
};

export function PlatformTargetsCard({ targets }: PlatformTargetsCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/10">
          <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Platform Targets
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {targets?.map((target, index) => {
          const style =
            platformStyles[target.platform] || platformStyles.YOUTUBE;
          const platformLogo = getPlatformLogo(target.platform);
          const viewCount = formatViewCount(parseViewCount(target.views));

          return (
            <motion.div
              key={`${target.platform}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group"
            >
              <div
                className={`bg-gradient-to-br ${style.bg} rounded-xl border ${style.border} p-5 hover:border-opacity-60 transition-all duration-300`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`relative w-10 h-10 ${style.iconBg} rounded-full flex items-center justify-center overflow-hidden`}
                  >
                    <Image
                      src={platformLogo}
                      alt={target.platform}
                      width={24}
                      height={24}
                      className="object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${style.text}`}>
                      {target.platform.charAt(0) +
                        target.platform.slice(1).toLowerCase()}
                    </h3>
                    <p className="text-xs text-gray-500">Social Platform</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Target Views</span>
                    </div>
                    <span className="text-foreground font-bold text-lg">
                      {viewCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Deadline</span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {target.due_date
                        ? format(new Date(target.due_date), "MMM d, yyyy")
                        : "No deadline set"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {(!targets || targets.length === 0) && (
        <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-xl border border-border">
          <Target className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p>No platform targets defined</p>
        </div>
      )}
    </div>
  );
}
