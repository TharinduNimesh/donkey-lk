"use client";

import { Database } from "@/types/database.types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatViewCount, parseViewCount } from "@/lib/utils/views";

type TaskDetail = Database['public']['Views']['task_details_view']['Row'];
type TaskApplication = {
  application_promises: Array<{
    platform: Database['public']['Enums']['Platforms'];
    promised_reach: string;
    est_profit: string;
  }>;
};

interface InfluencerTaskCardProps {
  task: TaskDetail;
  application?: TaskApplication;
}

export function InfluencerTaskCard({ task, application }: InfluencerTaskCardProps) {
  const router = useRouter();
  // Currency: 1 USD = NEXT_PUBLIC_LKR_PER_USD LKR
  const LKR_PER_USD = Number(process.env.NEXT_PUBLIC_LKR_PER_USD ?? "295");
  const LKR_TO_USD = 1 / (LKR_PER_USD || 295);
  const formatUSD = (lkrAmount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(lkrAmount * LKR_TO_USD);
  const targets = task.targets as Array<{
    platform: Database['public']['Enums']['Platforms'];
    views: string;
    due_date: string | null;
  }>;

  const handleCardClick = () => {
    router.push(`/dashboard/task/${task.task_id}/apply`);
  };

  const earliestDeadline = targets?.reduce((earliest, target) => {
    if (!target.due_date) return earliest;
    return earliest ? (new Date(target.due_date) < new Date(earliest) ? target.due_date : earliest) : target.due_date;
  }, "");

  // Calculate progress percentage
  const progress = task.total_target_views && task.total_promised_views 
    ? Math.min(Math.round((task.total_promised_views / task.total_target_views) * 100), 100)
    : 0;

  // Format targets for display
  const formattedTargets = targets?.map(target => ({
    ...target,
    formattedViews: formatViewCount(parseViewCount(target.views))
  }));

  // Create concise target summary
  const targetSummary = (() => {
    if (!formattedTargets?.length) return "";
    if (formattedTargets.length <= 2) {
      return formattedTargets.map(t => `${t.platform} ${t.formattedViews}`).join(", ");
    }
    return `${formattedTargets[0].platform} ${formattedTargets[0].formattedViews}, ${formattedTargets[1].platform} ${formattedTargets[1].formattedViews} and ${formattedTargets.length - 2} more`;
  })();

  // Calculate total potential earnings
  const calculateTotalEarnings = () => {
    if (!application?.application_promises) return 0;
    return application.application_promises.reduce(
      (total, promise) => total + parseFloat(promise.est_profit),
      0
    );
  };

  return (
    <Card 
      onClick={handleCardClick}
      className={`group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-pink-400/50 dark:hover:border-pink-500/50 bg-white dark:bg-gray-900 h-[400px] flex flex-col cursor-pointer ${progress === 100 ? 'task-full-card' : ''}`}
    >
      {progress === 100 && (
        <svg
          className="absolute inset-0 w-full h-full z-0 opacity-40 pointer-events-none"
          viewBox="0 0 400 400"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <rect width="100%" height="100%" fill="#fde4ec" />
          <text x="200" y="210" textAnchor="middle" fontSize="48" fill="#ec4899" fontWeight="bold" opacity="0.20">
            FULL
          </text>
          <defs>
            <pattern id="stripes" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
              <rect x="0" y="0" width="10" height="20" fill="#fbcfe8" fillOpacity="0.15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stripes)" />
        </svg>
      )}
      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <h3 className="font-semibold line-clamp-1">{task.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          </div>
          <Badge className={`
            shrink-0 pointer-events-none select-none
            ${application ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
            ${!application && progress === 100 ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 border-pink-300 dark:border-pink-500' : ''}
            ${!application && task.status === 'ACTIVE' && progress !== 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
          `}>
            {application ? 'Applied' : progress === 100 ? 'Full' : 'New'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4 flex-1">
        <div className="space-y-4">
          <div>
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Campaign Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{task.total_influencers || 0} Influencers</span>
            </span>
            {application ? (
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatUSD(calculateTotalEarnings())}
              </span>
            ) : (
              progress !== 100 && (
                <span className="font-medium text-pink-600 dark:text-pink-400">
                  Earn from this task
                </span>
              )
            )}
          </div>

          {targetSummary && (
            <Badge variant="outline" className="inline-flex items-center border-gray-200 dark:border-gray-800">
              {targetSummary}
            </Badge>
          )}

          {application && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {application.application_promises.map((promise, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className="pointer-events-none select-none bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
                  >
                    {promise.platform}: {formatViewCount(parseFloat(promise.promised_reach))} views
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="w-full flex items-center justify-between">
          {earliestDeadline && (
            <span className="text-sm text-muted-foreground">
              Due {format(new Date(earliestDeadline), 'MMM d, yyyy')}
            </span>
          )}
          <div 
            className="ml-auto text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 text-sm font-medium flex items-center"
          >
            {application
              ? 'View Application'
              : progress === 100
                ? 'Task Full'
                : 'Apply Now'}
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}