import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({ cookies });

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to auth
  if (!user) {
    redirect("/auth");
  }

  return <>{children}</>;
}
