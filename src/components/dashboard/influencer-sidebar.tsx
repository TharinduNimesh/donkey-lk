"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  Megaphone,
  LogOut,
  HelpCircle,
  X,
  Menu,
  Bell,
  CheckCircle,
  Settings,
  Share2,
  Link2
} from "lucide-react";
import { signOut } from "@/lib/supabase";

const PINK = "#C8185A";

type SidebarProps = {
  activePage?: "dashboard" | "tasks" | "platforms" | "settings" | "links";
  onNavigate?: () => void;
};

const SidebarNav = ({ activePage, onNavigate }: SidebarProps) => {
  const router = useRouter();

  const go = (path: string) => {
    router.push(path);
    onNavigate?.();
  };

  const mainNav = [
    { icon: LayoutDashboard, label: "Dashboard", page: "dashboard" as const, path: "/dashboard/influencer" },
    { icon: Megaphone, label: "Available Tasks", page: "tasks" as const, path: "/dashboard/influencer/tasks" },
    { icon: Link2, label: "BrandSync Links", page: "links" as const, path: "/dashboard/influencer/links" },
  ];

  const mgmtNav = [
    { icon: Share2, label: "Platforms", page: "platforms" as const, path: "/dashboard/influencer/platforms" },
    { icon: Settings, label: "Settings", page: "settings" as const, path: "/dashboard/influencer/settings" },
  ];

  const NavBtn = ({ icon: Icon, label, page, path }: { icon: any; label: string; page: string; path: string }) => {
    const isActive = activePage === page;
    return (
      <Link
        href={path}
        onClick={onNavigate}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive ? "text-white shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
        }`}
        style={isActive ? { background: `linear-gradient(135deg, ${PINK}, #e91e80)` } : {}}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
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

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Main Menu</p>
        {mainNav.map(item => <NavBtn key={item.label} {...item} />)}

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mt-5 mb-2">Management</p>
        {mgmtNav.map(item => <NavBtn key={item.label} {...item} />)}
      </nav>

      {/* Help Card */}
      <div className="m-3 rounded-xl p-3 text-xs" style={{ background: "linear-gradient(135deg, #fff0f6, #ffe4ef)" }}>
        <div className="flex items-center gap-1.5 font-semibold text-gray-800 mb-1">
          <HelpCircle className="h-3.5 w-3.5" style={{ color: PINK }} />
          Need Help?
        </div>
        <p className="text-gray-500 leading-snug mb-2.5">Access our documentation or contact support for assistance.</p>
        <button className="w-full py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: PINK }}>
          Support Center
        </button>
      </div>
    </>
  );
};

export function InfluencerSidebar({
  activePage = "dashboard",
}: {
  activePage?: SidebarProps["activePage"];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarNav activePage={activePage} onNavigate={() => setOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-52 bg-white border-r border-gray-100 flex-col flex-shrink-0">
        <SidebarNav activePage={activePage} />
      </aside>

      {/* Floating hamburger for mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-4 z-30 w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  );
}

export function InfluencerTopbar({
  title,
  actions,
}: {
  title?: string;
  actions?: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Spacer for mobile hamburger */}
        <div className="w-9 lg:hidden" />
        <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          Influencer Portal
        </span>
        {title && <h1 className="text-base font-semibold text-gray-800 lg:hidden">{title}</h1>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
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
  );
}
