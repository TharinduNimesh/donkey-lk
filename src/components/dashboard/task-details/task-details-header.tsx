import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Image as ImageIcon, Video, FileAudio, Download, ExternalLink, File, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { getStorageUrl } from "@/lib/utils/storage";

// Using the same type as in the buyer dashboard
type TaskDetail = {
  task_id: number | null;
  title: string | null;
  description: string | null;
  status: Database['public']['Enums']['TaskStatus'] | null;
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

// Blob SVG background element for visual appeal
const BlobSVG = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 200 200"
    className="absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 opacity-15 z-0"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feComposite in="SourceGraphic" in2="coloredBlur" operator="over"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path
      fill={color}
      filter="url(#glow)"
      d="M52.8,-75.5C68.7,-67.4,81.9,-52.3,89.3,-34.4C96.7,-16.5,98.2,4.3,92.7,23.2C87.2,42.1,74.7,59,58.3,70.3C41.9,81.6,21,87.2,0.7,86.2C-19.5,85.2,-39,77.6,-56.1,66.1C-73.2,54.6,-87.9,39.2,-94.1,20.7C-100.4,2.2,-98.2,-19.4,-88.6,-36.3C-79,-53.2,-62,-65.4,-44.6,-72.7C-27.2,-80,-13.6,-82.4,2.9,-86.8C19.4,-91.2,38.8,-97.7,52.8,-75.5Z"
      transform="translate(100 100)"
    />
  </svg>
);

export function TaskDetailsHeader({ task }: TaskDetailsHeaderProps) {
  const router = useRouter();
  const [fileUrl, setFileUrl] = useState<string>("");
  
  // Get the color based on status
  const getStatusColor = () => {
    switch (task.status) {
      case 'ACTIVE': return "#10b981"; // green
      case 'DRAFT': return "#f59e0b"; // yellow
      case 'ARCHIVED': return "#6b7280"; // gray
      case 'COMPLETED': return "#3b82f6"; // blue
      default: return "#ec4899"; // pink (default)
    }
  };
  
  // File type detection for attachments
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
  
  // Fetch attachment URL when component mounts or task.source changes
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
    <div className="relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <BlobSVG color={getStatusColor()} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/dashboard/buyer')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{task.title}</h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">{task.description}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${task.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
              ${task.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
              ${task.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' : ''}
              ${task.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
            `}>
              {task.status ? task.status.charAt(0) + task.status.slice(1).toLowerCase() : 'Unknown'}
            </Badge>
            
            {task.created_at && (
              <p className="text-xs text-muted-foreground">
                Created on {format(new Date(task.created_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-4">
          {/* Task metadata tags */}
          {task.total_influencers !== null && (
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300 border border-pink-100 dark:border-pink-800/30">
              {task.total_influencers} Influencers
            </span>
          )}
          
          {task.total_promised_views !== null && (
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
              {task.total_promised_views.toLocaleString()} Promised Views
            </span>
          )}
          
          {task.total_target_views !== null && (
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/30">
              {task.total_target_views.toLocaleString()} Target Views
            </span>
          )}
        </div>
        
        {/* Task Attachment Section */}
        {task.source && (
          <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center mb-3">
              <Paperclip className="h-4 w-4 mr-2 text-gray-500" />
              Task Attachment
            </h3>
            
            {(() => {
              const fileName = getFileName(task.source);
              const { icon: FileIcon, type: fileType, previewable } = getFileTypeInfo(fileName);
              
              return (
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {React.createElement(FileIcon, { className: "h-5 w-5 text-gray-600 dark:text-gray-400" })}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{fileName}</h4>
                      <p className="text-xs text-muted-foreground">{fileType}</p>
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
                            <ExternalLink className="h-3.5 w-3.5" />
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
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </a>
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
  );
}
