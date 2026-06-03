import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/types/database.types";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const { applicationId } = await req.json();
    
    if (!applicationId) {
      return NextResponse.json(
        { error: "Missing application ID" },
        { status: 400 }
      );
    }

    // Verify the application exists and belongs to the user
    const { data: application, error: applicationError } = await supabase
      .from('task_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (applicationError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this application" },
        { status: 403 }
      );
    }

    // Cancel the application
    const { error: updateError } = await supabase
      .from('task_applications')
      .update({
        is_cancelled: true
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error cancelling application:', updateError);
      return NextResponse.json(
        { error: "Failed to cancel application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true 
    });
    
  } catch (error) {
    console.error('Error in cancel application API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
