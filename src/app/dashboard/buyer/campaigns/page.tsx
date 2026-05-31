"use client";

import { BuyerSidebar, BuyerTopbar } from "@/components/dashboard/buyer-sidebar";
import { Megaphone } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <BuyerSidebar activePage="campaigns" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <BuyerTopbar title="Campaigns" />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 flex items-center justify-center">
          <div className="text-center bg-white border border-dashed border-gray-200 rounded-2xl p-12 max-w-md w-full">
            <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-8 w-8 text-[#C8185A]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaigns</h1>
            <p className="text-sm text-gray-500">
              The full campaign management suite is coming soon. Plan, organize, and launch multi-influencer campaigns seamlessly.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
