"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/supabase";
import { useCallback } from "react";

const adminRoutes = [
  {
    name: "Overview",
    path: "/dashboard/admin"
  },
  {
    name: "Accounting",
    path: "/dashboard/admin/accounting"
  },
  {
    name: "Task Payments",
    path: "/dashboard/admin/payments"
  },
  {
    name: "Application Proofs",
    path: "/dashboard/admin/proofs"
  },
  {
    name: "Ownership Verifications",
    path: "/dashboard/admin/verifications"
  },
  {
    name: "Withdrawal Requests",
    path: "/dashboard/admin/withdrawals"
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await signOut();
    router.replace("/auth");
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex space-x-4">
              {adminRoutes.map((route) => (
                <Link
                  key={route.path}
                  href={route.path}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === route.path
                      ? "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                      : "text-muted-foreground hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-900/30 dark:hover:text-pink-400"
                  )}
                >
                  {route.name}
                </Link>
              ))}
            </div>
            <div>
              <button
  onClick={handleLogout}
  className="text-sm font-medium text-muted-foreground hover:text-pink-600 transition-colors"
>
  Logout
</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
}