"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase";
import { TaskCard } from "@/components/dashboard/task-card";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type TaskDetail = Database['public']['Views']['task_details']['Row'];

export default function BuyerDashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskDetail[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('task_details')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks(data as TaskDetail[]);
    };

    fetchTasks();
  }, [supabase, router]);

  const handleLogout = async () => {
    setIsLoading(true);
    const { error } = await signOut();
    if (!error) {
      router.push('/auth');
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleCreateTask = () => {
    router.push('/dashboard/buyer/tasks/create');
  };

  // Calculate dashboard statistics
  const activeTasksCount = tasks.filter(t => t.status === 'ACTIVE').length;
  const totalBudget = tasks.reduce((sum, task) => {
    const cost = task.cost as { amount: number } | null;
    return sum + (cost?.amount || 0);
  }, 0);
  
  const platformCounts = tasks.reduce((counts, task) => {
    const targets = task.targets as Array<{ platform: Database['public']['Enums']['Platforms'] }> | null;
    targets?.forEach(target => {
      counts[target.platform] = (counts[target.platform] || 0) + 1;
    });
    return counts;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Brand Dashboard</h1>
        <div className="flex gap-4">
          <Button 
            onClick={handleCreateTask}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
          >
            Create New Task
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeTasksCount}</p>
            <p className="text-sm text-muted-foreground">
              {activeTasksCount === 1 ? '1 campaign running' : `${activeTasksCount} campaigns running`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalBudget.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(platformCounts).map(([platform, count]) => (
                <div key={platform} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {platform.charAt(0) + platform.slice(1).toLowerCase()}
                  </span>
                  <span className="text-sm font-medium">{count} tasks</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Tasks</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.task_id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}