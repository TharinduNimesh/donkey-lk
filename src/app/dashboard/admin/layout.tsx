"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center space-x-4 sm:justify-start">
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
        </div>
      </nav>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
}