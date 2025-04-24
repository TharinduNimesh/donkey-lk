"use client";

import { Database } from "@/types/database.types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatViewCount, parseViewCount } from "@/lib/utils/views";

type TaskDetail = Database["public"]["Views"]["task_details_view"]["Row"];

interface TaskCardProps {
  task: TaskDetail;
}

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const targets = task.targets as Array<{
    platform: Database["public"]["Enums"]["Platforms"];
    views: string;
    due_date: string | null;
  }>;

  const cost = task.cost as {
    amount: number;
    payment_method: Database["public"]["Enums"]["PaymentMethod"];
    is_paid: boolean;
  };

  const handleCardClick = () => {
    router.push(`/dashboard/task/${task.task_id}`);
  };

  const earliestDeadline = targets?.reduce((earliest, target) => {
    if (!target.due_date) return earliest;
    return earliest
      ? new Date(target.due_date) < new Date(earliest)
        ? target.due_date
        : earliest
      : target.due_date;
  }, "");

  // Calculate progress percentage
  const progress =
    task.total_target_views && task.total_promised_views
      ? Math.min(
          Math.round(
            (task.total_promised_views / task.total_target_views) * 100
          ),
          100
        )
      : 0;

  // Format targets for display
  const formattedTargets = targets?.map((target) => ({
    ...target,
    formattedViews: formatViewCount(parseViewCount(target.views)),
  }));

  // Create concise target summary
  const targetSummary = (() => {
    if (!formattedTargets?.length) return "";
    if (formattedTargets.length <= 2) {
      return formattedTargets
        .map((t) => `${t.platform} ${t.formattedViews}`)
        .join(", ");
    }
    return `${formattedTargets[0].platform} ${
      formattedTargets[0].formattedViews
    }, ${formattedTargets[1].platform} ${
      formattedTargets[1].formattedViews
    } and ${formattedTargets.length - 2} more`;
  })();

  return (
    <Card
      onClick={handleCardClick}
      className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-pink-400/50 dark:hover:border-pink-500/50 bg-white dark:bg-gray-900 h-[380px] flex flex-col cursor-pointer"
    >
      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <h3 className="font-semibold line-clamp-1">{task.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          </div>
          <span
            className={`
            shrink-0 px-2.5 py-0.5 text-xs font-medium rounded-full
            ${
              task.status === "ACTIVE"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : ""
            }
            ${
              task.status === "DRAFT"
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : ""
            }
            ${
              task.status === "ARCHIVED"
                ? "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                : ""
            }
            ${
              task.status === "COMPLETED"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : ""
            }
          `}
          >
            {task.status
              ? task.status.charAt(0) + task.status.slice(1).toLowerCase()
              : "Unknown"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-4 flex-1">
        <div className="space-y-4">
          <div>
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
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
            <span className="font-medium text-pink-600 dark:text-pink-400">
              Rs. {(cost?.amount || 0).toLocaleString()}
            </span>
          </div>

          {targetSummary && (
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {targetSummary}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="w-full flex items-center justify-between">
          {earliestDeadline && (
            <span className="text-sm text-muted-foreground">
              Due {format(new Date(earliestDeadline), "MMM d, yyyy")}
            </span>
          )}
          <div className="ml-auto text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 text-sm font-medium flex items-center">
            View Task
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
