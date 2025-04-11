import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  
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

  // Only redirect from the root dashboard page
  const pathname = new URL((await cookies()).get('next-url')?.value || '').pathname;
  if (pathname === '/dashboard') {
    // Redirect to role-specific dashboard
    if (profile.role.includes("INFLUENCER")) {
      redirect("/dashboard/influencer");
    } else if (profile.role.includes("BUYER")) {
      redirect("/dashboard/buyer");
    }
  }

  return <>{children}</>;
}