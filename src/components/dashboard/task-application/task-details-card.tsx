import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Clock, Users, FileText, Image as ImageIcon, Video, FileAudio, Download, ExternalLink } from "lucide-react";
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

  useEffect(() => {
    const fetchAttachmentUrl = async () => {
      if (task?.source) {
        setIsLoading(true);
        try {
          const url = await getStorageUrl('task-content', task.source);
          console.log(url);
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

  const fileInfo = task?.source ? getFileTypeInfo(task.source) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {task?.title}
            </CardTitle>
            <Badge className={`
              px-3 py-1 rounded-full text-sm pointer-events-none select-none
              ${task?.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
              ${task?.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
            `}>
              {task?.status}
            </Badge>
          </div>
          <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
            {task?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Task metrics */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p className="font-medium flex items-center">
                <Clock className="mr-1.5 h-4 w-4 text-gray-500" />
                {format(new Date(task?.created_at || new Date()), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium text-muted-foreground">Target Influencers</h3>
              <p className="font-medium flex items-center">
                <Users className="mr-1.5 h-4 w-4 text-gray-500" />
                {task?.total_influencers || 0} influencers
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium text-muted-foreground">Campaign Status</h3>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progressPercentage}% of target views promised
              </p>
            </div>
          </div>
          
          {/* Task attachment section */}
          {task?.source && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Task Attachment</h3>
              <div className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                {fileInfo && (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      {React.createElement(fileInfo.icon, { className: "h-5 w-5 text-gray-500 dark:text-gray-400" })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {task.source.split('/').pop() || 'Attachment'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {fileInfo.type.charAt(0).toUpperCase() + fileInfo.type.slice(1)} file
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {attachmentUrl && (
                        <>
                          {fileInfo.canPreview ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex items-center" 
                              asChild
                            >
                              <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                View
                              </a>
                            </Button>
                          ) : null}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex items-center" 
                            asChild
                          >
                            <a href={attachmentUrl} download>
                              <Download className="mr-1.5 h-3.5 w-3.5" />
                              Download
                            </a>
                          </Button>
                        </>
                      )}
                      {isLoading && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                          Loading...
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
