"use client";

import { BuyerSidebar, BuyerTopbar } from "@/components/dashboard/buyer-sidebar";
import { BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <BuyerSidebar activePage="analytics" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <BuyerTopbar title="Analytics" />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 flex items-center justify-center">
          <div className="text-center bg-white border border-dashed border-gray-200 rounded-2xl p-12 max-w-md w-full">
            <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="h-8 w-8 text-[#C8185A]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
            <p className="text-sm text-gray-500">
              Advanced analytics and reporting features are coming soon. You'll be able to track campaign performance, influencer ROI, and engagement metrics in real-time.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
