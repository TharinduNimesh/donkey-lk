"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Badge } from "@/components/ui/badge";

type TaskDetail = Database['public']['Views']['task_details']['Row'];
type InfluencerProfile = Database['public']['Tables']['influencer_profile']['Row'];
type TaskApplication = Database['public']['Tables']['task_applications']['Row'] & {
  application_promises: Database['public']['Tables']['application_promises']['Row'][];
};

export default function InfluencerDashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([]);
  const [appliedTasks, setAppliedTasks] = useState<(TaskDetail & { application?: TaskApplication })[]>([]);
  const [availableTasks, setAvailableTasks] = useState<(TaskDetail & { application?: TaskApplication })[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // Fetch connected social media profiles
      const { data: profilesData } = await supabase
        .from('influencer_profile')
        .select('*')
        .eq('user_id', user.id);

      if (profilesData) {
        setProfiles(profilesData);
      }

      // Fetch available tasks with application status
      const { data: tasksData } = await supabase
        .from('task_details')
        .select(`
          *,
          applications:task_applications(
            id,
            created_at,
            is_cancelled,
            application_promises(
              platform,
              promised_reach,
              est_profit
            )
          )
        `)
        .eq('status', 'ACTIVE');

      if (tasksData) {
        // Split tasks into available and applied
        const available: typeof availableTasks = [];
        const applied: typeof appliedTasks = [];

        tasksData.forEach(task => {
          const applications = task.applications as TaskApplication[];
          const userApplication = applications?.find(app => !app.is_cancelled);

          const taskWithApp = {
            ...task,
            application: userApplication
          };

          if (userApplication) {
            applied.push(taskWithApp);
          } else {
            available.push(taskWithApp);
          }
        });

        setAvailableTasks(available);
        setAppliedTasks(applied);
      }
    };

    fetchData();
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

  const handleApplyToTask = (taskId: number) => {
    router.push(`/dashboard/task/${taskId}/apply`);
  };

  const getPlatformColor = (platform: Database['public']['Enums']['Platforms']) => {
    const colors = {
      YOUTUBE: 'bg-red-500',
      FACEBOOK: 'bg-blue-600',
      INSTAGRAM: 'bg-pink-500',
      TIKTOK: 'bg-black'
    };
    return colors[platform] || 'bg-gray-500';
  };

  const calculateTotalEarnings = (application: TaskApplication) => {
    return application.application_promises.reduce((total, promise) => 
      total + parseFloat(promise.est_profit), 0
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Influencer Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
      
      {/* Connected Social Media Accounts */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Connected Social Media Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <Card key={profile.id} className="p-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getPlatformColor(profile.platform)}`}>
                    {profile.platform.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">{profile.followers} followers</p>
                    <Badge variant={profile.is_verified ? "success" : "secondary"}>
                      {profile.is_verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/verify/youtube')}
          >
            Connect New Account
          </Button>
        </CardContent>
      </Card>

      {/* Applied Tasks */}
      {appliedTasks.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {appliedTasks.map((task) => (
                <Card 
                  key={task.task_id} 
                  className="group hover:border-primary transition-colors"
                >
                  <CardContent className="p-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Applied
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{task.description}</p>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Your Commitments:</h4>
                        <div className="flex flex-wrap gap-2">
                          {task.application?.application_promises.map((promise, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-2">
                              <span>{promise.platform}:</span>
                              <span className="font-medium">{promise.promised_reach} views</span>
                              <span className="text-green-600">
                                (${parseFloat(promise.est_profit).toFixed(2)})
                              </span>
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-green-700 dark:text-green-300">Total Potential Earnings</span>
                            <span className="text-lg font-bold text-green-700 dark:text-green-300">
                              ${task.application ? calculateTotalEarnings(task.application).toFixed(2) : '0.00'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Applied on: {new Date(task.application?.created_at || '').toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Available Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableTasks.map((task) => (
              <Card 
                key={task.task_id} 
                className="group hover:border-primary transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/task/${task.task_id}/apply`)}
              >
                <CardContent className="p-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${task.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                      `}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{task.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {task.targets && (task.targets as any[]).map((target: any, index: number) => (
                        <Badge key={index} variant="outline">
                          {target.platform}: {target.views} views
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyToTask(task.task_id!);
                        }}
                        className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90"
                      >
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}