import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Database } from "@/types/database.types";
import { parseViewCount, formatViewCount } from "@/lib/utils/views";
import Image from "next/image";
import { CalendarClock, Target } from "lucide-react";

interface PlatformTargetsCardProps {
  targets: Array<{
    platform: Database['public']['Enums']['Platforms'];
    views: string;
    due_date: string | null;
  }>;
}

// Get platform-specific color
const getPlatformColor = (platform: string) => {
  switch (platform.toUpperCase()) {
    case 'INSTAGRAM': return '#E1306C';
    case 'FACEBOOK': return '#4267B2';
    case 'TIKTOK': return '#000000';
    case 'YOUTUBE': return '#FF0000';
    default: return '#6366f1';
  }
};

// Get platform logo path
const getPlatformLogo = (platform: string) => {
  const platformName = platform.toLowerCase();
  return `/platforms/${platformName}.png`;
};

export function PlatformTargetsCard({ targets }: PlatformTargetsCardProps) {
  return (
    <Card className="border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
        <CardTitle className="text-xl font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Target className="h-5 w-5 mr-2 text-pink-500" />
          Platform Targets
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {targets?.map((target, index) => {
            const platformColor = getPlatformColor(target.platform);
            const platformLogo = getPlatformLogo(target.platform);
            const viewCount = formatViewCount(parseViewCount(target.views));
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="group"
              >
                <div 
                  className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-300 h-full"
                  style={{ borderLeftWidth: '4px', borderLeftColor: platformColor }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                      <Image 
                        src={platformLogo} 
                        alt={target.platform} 
                        width={24} 
                        height={24} 
                        className="object-contain"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {target.platform.charAt(0) + target.platform.slice(1).toLowerCase()}
                      </h3>
                      <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">
                        {viewCount} views
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <CalendarClock className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span>
                      {target.due_date 
                        ? format(new Date(target.due_date), 'MMM d, yyyy') 
                        : 'No deadline set'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {(!targets || targets.length === 0) && (
          <div className="text-center p-6 text-muted-foreground">
            No platform targets defined
          </div>
        )}
      </CardContent>
    </Card>
  );
}
