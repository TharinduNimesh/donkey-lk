import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Clock, Users, FileText, Image as ImageIcon, Video, FileAudio, Download, ExternalLink, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Database } from "@/types/database.types";
import { getStorageUrl } from "@/lib/utils/storage";

type TaskDetail = Database["public"]["Views"]["task_details_view"]["Row"];

interface TaskDetailsCardProps {
  task: TaskDetail;
}

// Helper function to determine file type based on extension
const getFileTypeInfo = (filePath: string) => {
  if (!filePath) return { type: 'unknown', icon: FileText, canPreview: false };
  
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return { type: 'image', icon: ImageIcon, canPreview: true };
    case 'mp4':
    case 'webm':
    case 'mov':
      return { type: 'video', icon: Video, canPreview: true };
    case 'mp3':
    case 'wav':
    case 'ogg':
      return { type: 'audio', icon: FileAudio, canPreview: true };
    case 'pdf':
      return { type: 'pdf', icon: FileText, canPreview: true };
    default:
      return { type: 'document', icon: FileText, canPreview: false };
  }
};

export function TaskDetailsCard({ task }: TaskDetailsCardProps) {
  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.round(((task?.total_promised_views || 0) / (task?.total_target_views || 1)) * 100),
    100
  );

  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!attachmentUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(attachmentUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const fileName = task?.source?.split('/').pop() || 'attachment';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: open in new tab
      window.open(attachmentUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const fetchAttachmentUrl = async () => {
      if (task?.source && task.source !== "DIRECT") {
        setIsLoading(true);
        try {
          const url = await getStorageUrl('task-content', task.source);
          setAttachmentUrl(url);
        } catch (error) {
          console.error('Error fetching attachment URL:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAttachmentUrl();
  }, [task?.source]);

  const fileInfo = task?.source && task.source !== "DIRECT" ? getFileTypeInfo(task.source) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-0"
    >
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm relative">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
        
        <CardHeader className="pb-3 pt-4 border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight truncate">
                {task?.title}
              </CardTitle>
              <CardDescription className="text-gray-650 dark:text-gray-405 text-xs line-clamp-1 md:line-clamp-none max-w-3xl">
                {task?.description}
              </CardDescription>
            </div>
            <div className="shrink-0 flex items-start md:items-center">
              <Badge className={`
                px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider pointer-events-none select-none shadow-3xs
                ${task?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : ''}
                ${task?.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30' : ''}
              `}>
                {task?.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Created Box */}
            <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/20 flex items-start space-x-2.5 shadow-3xs">
              <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 shrink-0">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Created On</h3>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-xs mt-0.5">
                  {format(new Date(task?.created_at || new Date()), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            {/* Target Influencers Box */}
            <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/20 flex items-start space-x-2.5 shadow-3xs">
              <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 shrink-0">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Target Influencers</h3>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-xs mt-0.5">
                  {task?.total_influencers || 0} slots
                </p>
              </div>
            </div>

            {/* Progress Box */}
            <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/20 flex flex-col justify-between shadow-3xs sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Progress</h3>
                <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20 px-2 py-0.5 rounded-full">
                  {progressPercentage}%
                </span>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-gray-200/60 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(236,72,153,0.3)]"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground leading-none">
                  {progressPercentage}% views promised
                </p>
              </div>
            </div>
          </div>
          
          {/* Task attachment section */}
          {task?.source && task.source !== "DIRECT" && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Campaign Material & Guidelines</h3>
              <div className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10 hover:border-pink-200 dark:hover:border-pink-900/30 transition-all duration-300 gap-3 shadow-3xs">
                {fileInfo && (
                  <>
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-950/20 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 shadow-3xs">
                        {React.createElement(fileInfo.icon, { className: "h-4 w-4" })}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
                          {task.source.split('/').pop() || 'Attachment'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {fileInfo.type.toUpperCase()} file
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 self-start md:self-auto mt-1 md:mt-0">
                      {attachmentUrl && (
                        <>
                          {fileInfo.canPreview && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-gray-200 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-800 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50/35 dark:hover:bg-pink-950/10 text-[10px] font-semibold shadow-3xs rounded-md transition-colors h-8 px-2.5" 
                              asChild
                            >
                              <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                View
                              </a>
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-pink-600 border-pink-600 text-white hover:bg-pink-700 hover:border-pink-700 text-[10px] font-semibold shadow-3xs rounded-md transition-colors h-8 px-2.5 disabled:opacity-55" 
                            onClick={handleDownload}
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <>
                                <div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                Download
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      {isLoading && (
                        <div className="text-xs text-muted-foreground animate-pulse">
                          Loading files...
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

