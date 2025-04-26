import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/types/database.types";
import { parseViewCount } from "@/lib/utils/views";
import { calculateCostClient } from "@/lib/utils/cost";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const { taskId, selectedViews } = await req.json();
    
    if (!taskId || !selectedViews || Object.keys(selectedViews).length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get task details to verify it exists
    const { data: task, error: taskError } = await supabase
      .from('task_details')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Create the application
    const { data: application, error: applicationError } = await supabase
      .from('task_applications')
      .insert({
        task_id: taskId,
        user_id: user.id,
        is_cancelled: false
      })
      .select()
      .single();

    if (applicationError) {
      return NextResponse.json(
        { error: "Failed to create application" },
        { status: 500 }
      );
    }

    // Get task targets to use for deadline calculation
    const { data: targets, error: targetsError } = await supabase
      .from('task_targets')
      .select('*')
      .eq('task_id', taskId);

    if (targetsError) {
      // Rollback application creation
      await supabase
        .from('task_applications')
        .delete()
        .eq('id', application.id);
        
      return NextResponse.json(
        { error: "Failed to get task targets" },
        { status: 500 }
      );
    }

    // Create application promises for each platform where views were selected
    const promises = Object.entries(selectedViews)
      .filter(([_, views]) => parseViewCount(views as string) > 0)
      .map(([platform, views]) => {
        // Find the target for this platform to get the deadline
        const target = targets.find(t => t.platform === platform);
        const deadline = target?.due_date ? "flexible" : "flexible"; // Using flexible as we're calculating from influencer side
        
        // Calculate cost and profit
        const { baseCost, estimatedProfit } = calculateCostClient(
          platform as Database['public']['Enums']['Platforms'],
          views as string,
          deadline,
          false // Don't include service fee for influencer earnings
        );

        return {
          application_id: application.id,
          platform: platform as Database['public']['Enums']['Platforms'],
          promised_reach: views as string,
          est_profit: estimatedProfit.toString() // Store estimated profit (63% of base cost)
        };
      });

    if (promises.length === 0) {
      // Rollback application creation if no valid promises
      await supabase
        .from('task_applications')
        .delete()
        .eq('id', application.id);
        
      return NextResponse.json(
        { error: "No valid platform selections" },
        { status: 400 }
      );
    }

    const { error: promisesError } = await supabaseAdmin
      .from('application_promises')
      .insert(promises);

    if (promisesError) {
      // Rollback application creation
      await supabase
        .from('task_applications')
        .delete()
        .eq('id', application.id);
        
      return NextResponse.json(
        { error: "Failed to create application promises" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      applicationId: application.id 
    });
    
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
