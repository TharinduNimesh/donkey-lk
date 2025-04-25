import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Database } from "@/types/database.types";
import { getStorageUrl } from "@/lib/utils/storage";
import { FileText, Image as ImageIcon, Video, FileAudio, Download, ExternalLink, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskAttachmentsProps {
  task: Database["public"]["Views"]["task_details"]["Row"];
}

export function TaskAttachments({ task }: TaskAttachmentsProps) {
  const [fileUrl, setFileUrl] = useState<string>("");
  const getFileTypeInfo = (filename: string) => {
    if (!filename) return { icon: File, type: "Unknown", previewable: false };
    
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return { icon: ImageIcon, type: "Image", previewable: true };
    }
    
    // Document files
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
      return { icon: FileText, type: "Document", previewable: extension === 'pdf' };
    }
    
    // Video files
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension)) {
      return { icon: Video, type: "Video", previewable: true };
    }
    
    // Audio files
    if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
      return { icon: FileAudio, type: "Audio", previewable: true };
    }
    
    // Default
    return { icon: File, type: "File", previewable: false };
  };

  // Extract filename from path
  const getFileName = (path: string) => {
    if (!path) return '';
    return path.split('/').pop() || path;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {task.source && (
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-xl font-medium text-gray-900 dark:text-gray-100">Task Attachments</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <div className="space-y-4">
              {(() => {
                const fileName = getFileName(task.source);
                const { icon: FileIcon, type: fileType, previewable } = getFileTypeInfo(fileName);
                
                // Fetch the URL when the component mounts or task.source changes
                useEffect(() => {
                  const fetchUrl = async () => {
                    if (task.source) {
                      const url = await getStorageUrl('task-content', task.source);
                      if (url) setFileUrl(url);
                    }
                  };
                  fetchUrl();
                }, [task.source]);
                
                return (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {React.createElement(FileIcon, { className: "h-6 w-6 text-gray-600 dark:text-gray-400" })}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{fileName}</h4>
                        <p className="text-sm text-muted-foreground">{fileType}</p>
                      </div>
                      <div className="flex space-x-2">
                        {previewable && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>View</span>
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <a 
                            href={fileUrl} 
                            download={fileName}
                            className="flex items-center space-x-1"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
