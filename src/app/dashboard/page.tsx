import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";

export default async function DashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from("profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/setup");
  }

  // Redirect based on role
  if (profile.role.includes("ADMIN")) {
    return redirect("/dashboard/admin");
  }
  
  if (profile.role.includes("INFLUENCER")) {
    return redirect("/dashboard/influencer");
  }
  
  if (profile.role.includes("BUYER")) {
    return redirect("/dashboard/buyer");
  }

  // Default fallback content if no redirection occurs
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
}