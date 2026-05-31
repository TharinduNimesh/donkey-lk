"use client";

import { InfluencerSidebar, InfluencerTopbar } from "@/components/dashboard/influencer-sidebar";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <InfluencerSidebar activePage="settings" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <InfluencerTopbar title="Settings" />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 flex items-center justify-center">
          <div className="text-center bg-white border border-dashed border-gray-200 rounded-2xl p-12 max-w-md w-full">
            <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-[#C8185A]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-sm text-gray-500">
              Account and preference settings are coming soon. You'll be able to manage your notifications, payout details, and security options here.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
