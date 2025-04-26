"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles, DollarSign, Clock, Users } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { FancyText } from "./fancy-text";
import { formatViewCount, parseViewCount } from "@/lib/utils/views";
import { format } from "date-fns";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { useRouter } from "next/navigation";

type TaskDetail = Database["public"]["Views"]["task_details_view"]["Row"];

export function TasksSection() {
  const [tasks, setTasks] = React.useState<TaskDetail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  React.useEffect(() => {
    async function fetchTasks() {
      try {
        const { data, error } = await supabase
          .from('task_details_view')
          .select('*')
          .eq('status', 'ACTIVE') // Only fetch ACTIVE tasks
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching tasks:', error);
          return;
        }

        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [supabase]);

  const handleViewAllTasks = () => {
    router.push('/dashboard');
  };

  return (
    <div className="relative py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="relative overflow-hidden rounded-full px-4 py-1.5 bg-gradient-to-r from-pink-500/10 to-pink-600/10 backdrop-blur-sm border border-pink-500/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,0,255,0.05),transparent_70%)]"></div>
              <div className="flex items-center gap-1.5">
                <DollarSign
                  className="h-3.5 w-3.5 text-pink-500/80"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium tracking-wide text-pink-600/80 dark:text-pink-400/90">
                  MONETIZE YOUR INFLUENCE
                </span>
              </div>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Featured <span className="text-pink-500">Tasks</span> for{" "}
            <FancyText>Creators</FancyText>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse our latest opportunities and start earning by sharing authentic content with your audience.
            Join thousands of creators already monetizing their influence.
          </p>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading placeholders
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[380px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
            ))
          ) : tasks.length > 0 ? (
            tasks.map((task, index) => (
              <TaskCard key={task.task_id} task={task} index={index} />
            ))
          ) : (
            <div className="h-[380px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
          )}
        </div>

        {/* CTA Button */}
        <div className="mt-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-block"
          >
            <button 
              onClick={handleViewAllTasks}
              className="group relative inline-flex items-center justify-center px-8 py-3 font-medium transition-all duration-300 transform hover:-translate-y-0.5 rounded-full"
            >
              <span className="relative z-10 text-white">View All Tasks</span>
              <div className="absolute inset-0 bg-pink-600 rounded-full">
                <div className="absolute inset-0 flex justify-center [container-type:inline-size]">
                  <div className="w-[100cqw] aspect-square absolute blur-2xl -z-10 animate-spin-slower rounded-full bg-pink-500/20"></div>
                </div>
              </div>
              <span className="absolute -inset-0.5 -z-10 rounded-full bg-gradient-to-br from-[#ff80b5] to-[#9089fc] opacity-30 group-hover:opacity-50 transition duration-300"></span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: TaskDetail | any;
  index: number;
}

function TaskCard({ task, index }: TaskCardProps) {
  const router = useRouter();
  // Animation delay based on index
  const delay = 0.1 + index * 0.1;

  // Calculate progress percentage
  const progress =
    task.total_target_views && task.total_promised_views
      ? Math.min(
          Math.round(
            (task.total_promised_views / task.total_target_views) * 100
          ),
          100
        )
      : 0;

  // Format targets for display
  const formattedTargets = React.useMemo(() => {
    if (!task.targets) return [];
    
    // Handle targets whether they're from Supabase JSON or sample data
    const targetsArray = Array.isArray(task.targets) 
      ? task.targets 
      : typeof task.targets === 'object' 
        ? Object.values(task.targets) 
        : [];
    
    return targetsArray.map((target: any) => ({
      ...target,
      formattedViews: formatViewCount(parseViewCount(target.views)),
    }));
  }, [task.targets]);

  // Create concise target summary
  const targetSummary = React.useMemo(() => {
    if (!formattedTargets?.length) return "";
    if (formattedTargets.length <= 2) {
      return formattedTargets
        .map((t: any) => `${t.platform} ${t.formattedViews}`)
        .join(", ");
    }
    return `${formattedTargets[0].platform} ${
      formattedTargets[0].formattedViews
    }, ${formattedTargets[1].platform} ${
      formattedTargets[1].formattedViews
    } and ${formattedTargets.length - 2} more`;
  }, [formattedTargets]);

  // Get earliest deadline
  const earliestDeadline = React.useMemo(() => {
    if (!formattedTargets.length) return "";
    
    return formattedTargets.reduce((earliest: string, target: any) => {
      if (!target.due_date) return earliest;
      return earliest
        ? new Date(target.due_date) < new Date(earliest)
          ? target.due_date
          : earliest
        : target.due_date;
    }, "");
  }, [formattedTargets]);
  
  // Handle task click
  const handleTaskClick = () => {
    if (task.task_id) {
      router.push(`/dashboard/task/${task.task_id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="h-full"
    >
      <div 
        onClick={handleTaskClick}
        className="relative h-full rounded-2xl border border-border/40 dark:border-border/20 p-2 backdrop-blur-sm overflow-hidden group hover:border-pink-400/50 dark:hover:border-pink-500/50 transition-all duration-300 cursor-pointer"
      >
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          variant="default"
        />
        <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl p-6 [box-shadow:0_0_0_1px_rgba(0,0,0,0.03)] dark:[box-shadow:0_0_0_1px_rgba(255,255,255,0.03)] bg-white/50 dark:bg-gray-900/50">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <h3 className="font-semibold line-clamp-1">{task.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            </div>
            {/* Status badge removed as requested */}
          </div>

          {/* Card Content */}
          <div className="space-y-4 flex-1">
            <div>
              {/* Progress Bar */}
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{task.total_influencers || 0} Influencers</span>
              </span>
              <span className="font-medium text-pink-600 dark:text-pink-400">
                Rs. {Math.round((task.cost?.amount || 0) * 0.63).toLocaleString()}
              </span>
            </div>

            {targetSummary && (
              <span className="inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                {targetSummary}
              </span>
            )}
          </div>

          {/* Card Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="w-full flex items-center justify-between">
              {earliestDeadline && (
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Due {format(new Date(earliestDeadline), "MMM d, yyyy")}
                </span>
              )}
              <div className="ml-auto text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 text-sm font-medium flex items-center">
                Apply Now
                <ArrowUpRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
