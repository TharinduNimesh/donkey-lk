// TaskPreviewModal.tsx
"use client";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  useModal,
} from "@/components/ui/animated-modal";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database.types";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { formatViewCount, parseViewCount } from "@/lib/utils/views";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface TaskPreviewModalProps {
  task: Database["public"]["Views"]["task_details_view"]["Row"] | null;
}

export function TaskPreviewModal({ task }: TaskPreviewModalProps) {
  const { open, setOpen } = useModal();
  const router = useRouter();
  if (!task) return null;
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
    <Modal>
      <ModalBody className="md:max-w-[600px]">
        <ModalContent className="p-0 overflow-hidden shadow-xl">
          {/* Header with pink gradient */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-8 text-white relative overflow-hidden">
            <h2 className="text-2xl font-bold mb-1 font-display">{task.title}</h2>
            <p className="opacity-90 text-base mb-2 font-medium">{task.description}</p>
          </div>
          {/* Enhanced Content */}
          <div className="p-8 space-y-6">
            {/* Progress Bar */}
            <div>
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
            {/* Platform Targets Grid */}
            <div>
              <h4 className="font-semibold mb-3 text-pink-600">Platforms & Views</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formattedTargets?.map((t, i) => (
                  <div key={i} className="flex items-center gap-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg p-4 border border-pink-100 dark:border-pink-900">
                    <div className="shrink-0">
                      <Image
                        src={`/platforms/${t.platform.toLowerCase()}.png`}
                        alt={t.platform}
                        width={36}
                        height={36}
                        className="rounded-full border border-pink-200 bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-pink-700 dark:text-pink-300 text-base">{t.platform}</div>
                      <div className="text-sm text-gray-700 dark:text-gray-200">
                        {t.formattedViews} views
                        {t.due_date && (
                          <span className="ml-2 text-xs text-muted-foreground">| Due {format(new Date(t.due_date), "MMM d, yyyy")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Summary Row */}
            <div className="flex flex-wrap items-center gap-4 mt-4 border-t pt-4 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-medium">
                <Users className="h-5 w-5" />
                {task.total_influencers || 0} Influencers
              </div>
              <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-medium">
                <span className="font-bold">Rs. {(cost?.amount || 0).toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">Total Budget</span>
              </div>
              {earliestDeadline && (
                <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-medium">
                  <span className="text-xs">Due {format(new Date(earliestDeadline), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>
        </ModalContent>
        <ModalFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="hover:bg-pink-50 dark:hover:bg-pink-950"
          >
            Close
          </Button>
          <Button
            className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-300 text-lg px-6 py-5"
            onClick={() => router.push(`/auth?target=${task.task_id}`)}
          >
            Sign in to apply
          </Button>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}
