import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Database } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Video,
  FileAudio,
  Download,
  ExternalLink,
  File,
  Paperclip,
  Clock,
  CheckCircle,
  Archive,
  AlertCircle,
  Calendar,
  Eye,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { getStorageUrl } from "@/lib/utils/storage";

// Using the same type as in the buyer dashboard
type TaskDetail = {
  task_id: number | null;
  title: string | null;
  description: string | null;
  status: Database["public"]["Enums"]["TaskStatus"] | null;
  created_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  cost: any;
  source: string | null;
  total_influencers: number | null;
  total_promised_views: number | null;
  total_proof_views?: number | null;
  total_target_views: number | null;
  targets: any;
};

interface TaskDetailsHeaderProps {
  task: TaskDetail;
}

// File type detection for attachments
const getFileTypeInfo = (filename: string) => {
  if (!filename) return { icon: File, type: "Unknown", previewable: false };

  const extension = filename.split(".").pop()?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
    return { icon: ImageIcon, type: "Image", previewable: true };
  }
  if (["pdf", "doc", "docx", "txt", "rtf", "odt"].includes(extension)) {
    return { icon: FileText, type: "Document", previewable: extension === "pdf" };
  }
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(extension)) {
    return { icon: Video, type: "Video", previewable: true };
  }
  if (["mp3", "wav", "ogg", "aac"].includes(extension)) {
    return { icon: FileAudio, type: "Audio", previewable: true };
  }
  return { icon: File, type: "File", previewable: false };
};

const getFileName = (path: string) => {
  if (!path) return "";
  return path.split("/").pop() || path;
};

const getStatusConfig = (status: string | null) => {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Active",
        icon: CheckCircle,
        bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
        textColor: "text-emerald-700 dark:text-emerald-400",
        borderColor: "border-emerald-200 dark:border-emerald-500/20",
        dotColor: "bg-emerald-500",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        icon: CheckCircle,
        bgColor: "bg-blue-50 dark:bg-blue-500/10",
        textColor: "text-blue-700 dark:text-blue-400",
        borderColor: "border-blue-200 dark:border-blue-500/20",
        dotColor: "bg-blue-500",
      };
    case "ARCHIVED":
      return {
        label: "Archived",
        icon: Archive,
        bgColor: "bg-gray-50 dark:bg-gray-500/10",
        textColor: "text-gray-700 dark:text-gray-400",
        borderColor: "border-gray-200 dark:border-gray-500/20",
        dotColor: "bg-gray-500",
      };
    case "DRAFT":
      return {
        label: "Draft",
        icon: Clock,
        bgColor: "bg-amber-50 dark:bg-amber-500/10",
        textColor: "text-amber-700 dark:text-amber-400",
        borderColor: "border-amber-200 dark:border-amber-500/20",
        dotColor: "bg-amber-500",
      };
    default:
      return {
        label: status ? status.charAt(0) + status.slice(1).toLowerCase() : "Unknown",
        icon: AlertCircle,
        bgColor: "bg-amber-50 dark:bg-amber-500/10",
        textColor: "text-amber-700 dark:text-amber-400",
        borderColor: "border-amber-200 dark:border-amber-500/20",
        dotColor: "bg-amber-500",
      };
  }
};

export function TaskDetailsHeader({ task }: TaskDetailsHeaderProps) {
  const router = useRouter();
  const [fileUrl, setFileUrl] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fileUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const fileName = task.source?.split("/").pop() || "attachment";
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      window.open(fileUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const fetchUrl = async () => {
      if (task.source) {
        const url = await getStorageUrl("task-content", task.source);
        if (url) setFileUrl(url);
      }
    };
    fetchUrl();
  }, [task.source]);

  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;

  const totalViews = task.total_target_views || 0;
  const promisedViews = task.total_promised_views || 0;
  const proofViews = task.total_proof_views || 0;
  const totalInfluencers = task.total_influencers || 0;
  const viewsProgress =
    totalViews > 0 ? Math.min(100, (promisedViews / totalViews) * 100) : 0;

  const statCards = [
    {
      label: "Target Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: "from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-950/5",
      iconColor: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-100 dark:bg-violet-900/30",
    },
    {
      label: "Promised Views",
      value: promisedViews.toLocaleString(),
      icon: TrendingUp,
      color: "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-950/5",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Proof Views",
      value: proofViews.toLocaleString(),
      icon: BarChart3,
      color: "from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-950/5",
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Influencers",
      value: totalInfluencers.toString(),
      icon: Users,
      color: "from-pink-50 to-pink-100/50 dark:from-pink-950/20 dark:to-pink-950/5",
      iconColor: "text-pink-600 dark:text-pink-400",
      iconBg: "bg-pink-100 dark:bg-pink-900/30",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/buyer")}
        className="flex items-center gap-2 text-gray-500 hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Dashboard</span>
      </button>

      {/* Header Card */}
      <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 relative overflow-hidden shadow-sm">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-pink-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div className="space-y-2 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {task.title}
              </h1>
              {task.description && (
                <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bgColor} ${statusConfig.borderColor} border whitespace-nowrap self-start`}
            >
              <div
                className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}
              />
              <StatusIcon className={`w-4 h-4 ${statusConfig.textColor}`} />
              <span className={`text-sm font-medium ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Created{" "}
                {task.created_at
                  ? format(new Date(task.created_at), "MMM d, yyyy")
                  : "N/A"}
              </span>
            </div>
            {task.source && task.source !== "DIRECT" && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <span className="text-xs font-medium">
                  Source: {task.source.split("/").pop()}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Views Progress</span>
              <span className="text-foreground font-medium">
                {viewsProgress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${viewsProgress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Task Attachment */}
          {task.source && task.source !== "DIRECT" && (
            <div className="mt-6 pt-5 border-t border-border">
              <h3 className="text-sm font-medium text-foreground flex items-center mb-3">
                <Paperclip className="h-4 w-4 mr-2 text-gray-500" />
                Task Attachment
              </h3>
              {(() => {
                const fileName = getFileName(task.source);
                const {
                  icon: FileIcon,
                  type: fileType,
                  previewable,
                } = getFileTypeInfo(fileName);

                return (
                  <div className="p-4 border border-border rounded-xl bg-muted/30 hover:border-pink-300 dark:hover:border-pink-700 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-muted rounded-lg">
                        {React.createElement(FileIcon, {
                          className: "h-5 w-5 text-gray-400",
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {fileName}
                        </h4>
                        <p className="text-xs text-muted-foreground">{fileType}</p>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        {previewable && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-border bg-muted/50 text-foreground hover:bg-muted hover:text-foreground"
                          >
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>View</span>
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border bg-muted/50 text-foreground hover:bg-muted hover:text-foreground disabled:opacity-55"
                          onClick={handleDownload}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" />
                              <span>Download</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const StatIcon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} rounded-xl border border-border p-4 hover:shadow-sm transition-all duration-200`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <StatIcon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
