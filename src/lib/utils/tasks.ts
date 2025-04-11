import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { uploadTaskContent } from "./storage";

export type CreateTaskInput = {
  title: string;
  description: string;
  contentFile: File;
  platforms: {
    platform: Database["public"]["Enums"]["Platforms"];
    views: number;
    due_date: string;
  }[];
};

export async function createTask(input: CreateTaskInput, isDraft = true) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Upload content file and get URL
    const sourceUrl = await uploadTaskContent(input.contentFile);

    // Begin transaction by creating the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: input.title,
        description: input.description,
        source: sourceUrl,
        user_id: user.id,
        status: isDraft ? 'DRAFT' : 'ACTIVE'
      })
      .select()
      .single();

    if (taskError || !task) {
      throw new Error(taskError?.message || 'Failed to create task');
    }

    // Insert task targets
    const targetsToInsert = input.platforms.map(platform => ({
      task_id: task.id,
      platform: platform.platform,
      views: platform.views.toString(),
      due_date: platform.due_date
    }));

    const { error: targetsError } = await supabase
      .from('task_targets')
      .insert(targetsToInsert);

    if (targetsError) {
      throw new Error('Failed to create task targets');
    }

    // If not a draft, trigger cost calculation
    if (!isDraft) {
      const response = await fetch('/api/tasks/calculate-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId: task.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate task cost');
      }
    }

    return { task };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}