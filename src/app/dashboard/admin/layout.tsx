"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/supabase";
import {
  LayoutDashboard,
  Coins,
  CreditCard,
  ClipboardCheck,
  ShieldCheck,
  ArrowDownToLine,
  LogOut,
  Menu,
  X,
  Bell,
  HelpCircle,
  ListTodo,
} from "lucide-react";

const PINK = "#C8185A";

const adminRoutes = [
  {
    name: "Overview",
    path: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Accounting",
    path: "/dashboard/admin/accounting",
    icon: Coins,
  },
  {
    name: "Task Payments",
    path: "/dashboard/admin/payments",
    icon: CreditCard,
  },
  {
    name: "Application Proofs",
    path: "/dashboard/admin/proofs",
    icon: ClipboardCheck,
  },
  {
    name: "Task Progress",
    path: "/dashboard/admin/task-progress",
    icon: ListTodo,
  },
  {
    name: "Ownership Verifications",
    path: "/dashboard/admin/verifications",
    icon: ShieldCheck,
  },
  {
    name: "Withdrawal Requests",
    path: "/dashboard/admin/withdrawals",
    icon: ArrowDownToLine,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.replace("/auth");
  }, [router]);

  const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="BrandSync" className="h-7 w-7 rounded-lg object-contain" />
          <span className="text-base font-bold tracking-tight" style={{ color: PINK }}>BrandSync</span>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav Link List */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto bg-white">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Admin Panel</p>
        
        {adminRoutes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.path;
          return (
            <Link
              key={route.path}
              href={route.path}
              onClick={onNavigate}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                isActive
                  ? "text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-900/50"
              )}
              style={isActive ? { background: `linear-gradient(135deg, ${PINK}, #e91e80)` } : {}}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{route.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Help / Info Card */}
      <div className="m-3 rounded-xl p-3 text-xs bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/20 dark:to-pink-950/5 border border-pink-100 dark:border-pink-900/20 flex-shrink-0">
        <div className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200 mb-1">
          <HelpCircle className="h-3.5 w-3.5" style={{ color: PINK }} />
          Admin Support
        </div>
        <p className="text-gray-500 dark:text-gray-400 leading-snug">Developer environment active. Contact standard desk for migrations.</p>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-gray-950 font-sans overflow-hidden">
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile slide-over drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarNav onNavigate={() => setOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-white border-r border-gray-100 flex-col flex-shrink-0">
        <SidebarNav />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 border border-gray-200 shadow-sm transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: PINK }} />
              Root Admin Console
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: PINK }} />
            </button>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page children container */}
        <main className="flex-1 overflow-y-auto bg-[#fafafa] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}