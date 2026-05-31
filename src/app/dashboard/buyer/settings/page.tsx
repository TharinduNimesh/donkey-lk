"use client";

import { useState } from "react";
import { BuyerSidebar, BuyerTopbar } from "@/components/dashboard/buyer-sidebar";
import { Input } from "@/components/ui/input";

const PINK = "#C8185A";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <BuyerSidebar activePage="settings" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <BuyerTopbar />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your global brand profile, billing methods, and preferences.</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-200">
              {[
                { id: "profile", label: "Brand Profile" },
                { id: "billing", label: "Billing & Subscriptions" },
                { id: "notifications", label: "Notifications" },
                { id: "team", label: "Team Access" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-semibold transition-colors relative ${
                    activeTab === tab.id ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 rounded-t-full" style={{ background: PINK }} />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "profile" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-base font-semibold text-gray-900">Brand Identity</h2>
                      <button className="text-xs font-semibold hover:underline" style={{ color: PINK }}>Edit Detail</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-2">Brand Logo</p>
                        <div className="w-24 h-24 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center p-2 shadow-inner">
                          <div className="w-full h-full bg-white rounded-lg border border-gray-100 flex items-center justify-center shadow-sm">
                            {/* Dummy icon */}
                            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                              <rect width="32" height="32" rx="8" fill={PINK} fillOpacity="0.1" />
                              <path d="M16 10L24 16L16 22L8 16L16 10Z" stroke={PINK} strokeWidth="2" strokeLinejoin="round" />
                              <path d="M16 13L19.5 16L16 19L12.5 16L16 13Z" fill={PINK} />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-2 space-y-4">
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1.5 block">Legal Brand Name</label>
                          <Input value="BrandSync Influencer Technologies" readOnly className="h-9 bg-white text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1.5 block">Website URL</label>
                          <Input value="https://brandsync.io" readOnly className="h-9 bg-white text-sm" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="text-xs text-gray-500 font-medium mb-1.5 block">Brand Description</label>
                      <textarea 
                        className="w-full text-sm border border-gray-200 rounded-lg p-3 outline-none focus:border-pink-300 min-h-[100px] resize-y"
                        readOnly
                        value="BrandSync is an industry-leading platform dedicated to streamlining influencer marketing campaigns through data-driven insights and automated task management for enterprise-scale brands."
                      />
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                      <button className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Discard</button>
                      <button className="px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90" style={{ background: PINK }}>Save Changes</button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Billing Information</h2>
                    <p className="text-xs text-gray-500 mb-5">Manage payment methods and view history</p>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50 mb-3 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-6 bg-[#1a1f36] rounded text-white text-[9px] font-bold flex items-center justify-center">VISA</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">•••• •••• •••• 4242</p>
                          <p className="text-xs text-gray-500">Expires 12/26</p>
                        </div>
                      </div>
                      <button className="text-xs font-semibold px-2.5 py-1 rounded-md bg-green-100 text-green-700">Active</button>
                    </div>

                    <button className="w-full py-3 rounded-lg border border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                      Add Payment Method
                    </button>

                    <div className="mt-6 p-4 rounded-lg bg-gray-50">
                      <p className="text-xs font-semibold text-gray-900 mb-3">Upcoming Invoice</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-gray-500">Next billing date</p>
                          <p className="text-sm font-semibold text-gray-900">October 14, 2024</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500">Amount</p>
                          <p className="text-lg font-bold" style={{ color: PINK }}>$499.00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                    
                    <div className="space-y-5">
                      {[
                        { title: "Campaign Updates", desc: "Daily digest of performance", active: true },
                        { title: "Task Completion", desc: "When an influencer finishes a task", active: true },
                        { title: "Security Alerts", desc: "Login attempts and key changes", active: true },
                        { title: "Marketing Emails", desc: "News about features and sales", active: false },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                            <p className="text-[10px] text-gray-500">{item.desc}</p>
                          </div>
                          <div className={`w-9 h-5 rounded-full relative transition-colors ${item.active ? "bg-[#c8185a]" : "bg-gray-200"}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.active ? "right-0.5" : "left-0.5"}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#fff0f6] rounded-xl border border-pink-100 p-6">
                    <h2 className="text-base font-semibold text-red-600 mb-2">Danger Zone</h2>
                    <p className="text-[11px] text-gray-600 mb-4 leading-relaxed">
                      Permanently delete your account and all associated brand data. This action cannot be undone.
                    </p>
                    <button className="w-full py-2 rounded-lg border border-red-200 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                      Delete Brand Profile
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab !== "profile" && (
              <div className="py-20 text-center bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-lg font-semibold text-gray-900">Coming Soon</p>
                <p className="text-sm text-gray-500 mt-1">This section is currently under construction.</p>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
