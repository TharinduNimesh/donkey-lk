"use client";

import { Database } from "@/types/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

type TaskDetail = Database['public']['Views']['task_details']['Row'];

interface TaskCardProps {
  task: TaskDetail;
}

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const targets = task.targets as Array<{
    platform: Database['public']['Enums']['Platforms'];
    views: string;
    due_date: string | null;
  }>;
  
  const cost = task.cost as {
    amount: number;
    payment_method: Database['public']['Enums']['PaymentMethod'];
    is_paid: boolean;
  };

  // Get earliest deadline from task targets
  const earliestDeadline = targets?.reduce((earliest, target) => {
    if (!target.due_date) return earliest;
    return earliest ? (new Date(target.due_date) < new Date(earliest) ? target.due_date : earliest) : target.due_date;
  }, "");

  return (
    <Card 
      className="group hover:border-primary transition-colors cursor-pointer"
      onClick={() => router.push(`/dashboard/task/${task.task_id}`)}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">{task.title}</span>
          <span className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${task.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
            ${task.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
            ${task.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' : ''}
            ${task.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
          `}>
            {task.status ? task.status.charAt(0) + task.status.slice(1).toLowerCase() : 'Unknown'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Platforms:</span>
            <div className="flex gap-2">
              {targets?.map((target, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {target.platform.charAt(0) + target.platform.slice(1).toLowerCase()}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Budget:</span>
            <span className="font-medium">
              Rs. {cost?.amount.toLocaleString() ?? 'Calculating...'}
            </span>
          </div>
          
          {earliestDeadline && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Earliest Deadline:</span>
              <span className="font-medium">{format(new Date(earliestDeadline), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}