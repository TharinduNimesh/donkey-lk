"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase";
import { TaskCard } from "@/components/dashboard/task-card";
import { Task } from "@/types/database.types";

// TODO: Replace with actual data from Supabase
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Promote New Music Video",
    description: "Need promotion for my latest music video 'Summer Vibes'. Looking for creators to feature the song in their content and help it reach a wider audience.",
    source: "https://youtube.com/watch?v=example",
    status: "active",
    created_at: new Date().toISOString(),
    user_id: "123",
    platforms: [
      {
        platform: "YOUTUBE",
        target_views: 100000,
        deadline: "2025-04-25",
        cost: 1000
      },
      {
        platform: "TIKTOK",
        target_views: 1000000,
        deadline: "2025-05-11",
        cost: 2000
      }
    ]
  },
  {
    id: "2",
    title: "Brand Awareness Campaign",
    description: "Looking for creators to showcase our new sustainable fashion line. Need authentic content that highlights our eco-friendly materials and ethical production.",
    source: "https://example.com/brand-assets",
    status: "draft",
    created_at: new Date().toISOString(),
    user_id: "123",
    platforms: [
      {
        platform: "INSTAGRAM",
        target_views: 50000,
        deadline: "2025-05-01",
        cost: 800
      }
    ]
  }
];

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [tasks] = useState<Task[]>(mockTasks);

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
  const activeTasksCount = tasks.filter(t => t.status === 'active').length;
  const totalBudget = tasks.reduce((sum, task) => 
    sum + task.platforms.reduce((pSum, p) => pSum + p.cost, 0)
  , 0);
  const platformCounts = tasks.reduce((counts, task) => {
    task.platforms.forEach(p => {
      counts[p.platform] = (counts[p.platform] || 0) + 1;
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
            <p className="text-sm text-muted-foreground">{activeTasksCount === 1 ? '1 campaign running' : `${activeTasksCount} campaigns running`}</p>
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
                  <span className="text-sm text-muted-foreground">{platform}</span>
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
          <Button variant="outline" onClick={() => router.push('/dashboard/buyer/tasks')}>
            View All
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}