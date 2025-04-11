"use client";

import { Task } from "@/types/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  // Calculate total cost across all platforms
  const totalCost = task.platforms.reduce((sum, platform) => sum + platform.cost, 0);
  
  // Find earliest deadline
  const earliestDeadline = task.platforms.reduce((earliest, platform) => {
    return earliest ? (new Date(platform.deadline) < new Date(earliest) ? platform.deadline : earliest) : platform.deadline;
  }, "");

  return (
    <Card className="group hover:border-primary transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">{task.title}</span>
          <span className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${task.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
            ${task.status === 'draft' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
            ${task.status === 'archived' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' : ''}
            ${task.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
          `}>
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Platforms:</span>
            <div className="flex gap-2">
              {task.platforms.map((p) => (
                <span 
                  key={p.platform}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {p.platform}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Budget:</span>
            <span className="font-medium">${totalCost.toLocaleString()}</span>
          </div>
          
          {earliestDeadline && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deadline:</span>
              <span className="font-medium">{format(new Date(earliestDeadline), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}