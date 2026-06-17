"use client";

import Link from "next/link";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Activity,
  CheckCircle2,
  DollarSign
} from "lucide-react";

export function BusinessHeroSection() {
  return (
    <section className="w-full relative overflow-visible">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 md:pt-44 pb-20">
        
        {/* Top Text Content */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 relative z-10">
          <div className="inline-block rounded-full bg-pink-200/50 px-4 py-1.5 mb-6">
            <span className="text-[11px] font-bold tracking-widest text-pink-500 uppercase">
              For Brands & Agencies
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-bold font-display leading-[1.05] tracking-tight mb-6 text-gray-900">
            Scale your brand <br className="hidden sm:block" />
            with <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">real creators</span>
          </h1>
          
          <p className="text-lg text-gray-600 mb-10 max-w-2xl leading-relaxed font-light">
            Launch high-converting campaigns in minutes. Access thousands of vetted creators ready to promote your products across all major social platforms.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/business-signup" className="rounded-full bg-pink-500 px-8 py-3.5 text-sm font-bold tracking-wide text-white hover:bg-pink-600 transition-colors shadow-[0_4px_14px_0_rgba(236,72,153,0.39)]">
              Create Campaign
            </Link>
            <Link href="#business-how-it-works" className="rounded-full bg-white border border-gray-200 px-8 py-3.5 text-sm font-bold tracking-wide text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              Consult an Expert
            </Link>
          </div>
        </div>
        
        {/* Dashboard Graphic at the Bottom */}
        <div className="relative w-full max-w-6xl mx-auto mt-12 perspective-[2000px] z-20 pb-0">
          
          {/* Decorative glow behind the dashboard */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-pink-500/20 blur-[100px] rounded-full -z-10"></div>
          
          {/* Dashboard Container */}
          <div className="w-full bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-t-2xl lg:rounded-t-[2.5rem] overflow-hidden">
            
            {/* Window Header */}
            <div className="bg-gray-50/80 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white border border-gray-200/60 rounded-lg px-6 py-1.5 flex items-center text-xs text-gray-400 shadow-sm w-full max-w-md justify-between">
                  <div className="flex items-center gap-2">
                    <span>🔒</span>
                    <span className="font-medium text-gray-500">app.brandsync.com/dashboard</span>
                  </div>
                  <span className="text-gray-300 font-sans">⌘R</span>
                </div>
              </div>
              <div className="w-12"></div>
            </div>
            
            {/* Dashboard Content Area */}
            <div className="flex flex-col md:flex-row h-[500px] sm:h-[650px] bg-[#fafafa]">
              
              {/* Sidebar (hidden on small screens) */}
              <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 gap-8">
                {/* Profile Switcher */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white font-bold font-display shadow-sm">
                    N
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Nike Inc.</h4>
                    <p className="text-xs text-gray-500">Enterprise Plan</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
                  {[
                    { icon: Activity, label: "Overview", active: true },
                    { icon: BarChart3, label: "Campaigns", active: false },
                    { icon: Users, label: "Creators", active: false },
                    { icon: TrendingUp, label: "Analytics", active: false },
                    { icon: DollarSign, label: "Payments", active: false },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${item.active ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                      <item.icon size={18} strokeWidth={item.active ? 2.5 : 2} />
                      <span className={`text-sm ${item.active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 p-6 md:p-10 bg-[#fafafa] overflow-hidden relative">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 font-display tracking-tight">Campaign Overview</h3>
                    <p className="text-sm text-gray-500 mt-2 font-light">Monitoring real-time performance across 3 active campaigns</p>
                  </div>
                  <div className="hidden sm:flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors">
                      Export Report
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-gray-800 transition-colors">
                      New Campaign
                    </button>
                  </div>
                </div>
                
                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Total Reach", value: "12.4M", trend: "+14.2%", positive: true },
                    { label: "Avg. Engagement", value: "8.5%", trend: "+2.1%", positive: true },
                    { label: "Total Conversions", value: "1,240", trend: "-0.4%", positive: false },
                    { label: "Total Spend", value: "$12,400", trend: "On track", positive: true },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-sm text-gray-500 mb-2 font-medium">{stat.label}</p>
                      <h4 className="text-3xl font-bold text-gray-900 mb-3 font-display">{stat.value}</h4>
                      <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md ${stat.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {stat.positive ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                        {stat.trend}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Graph/Chart Area Mock */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hidden sm:block">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-gray-900 font-display">Performance Timeline</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                      <span className="text-xs text-gray-500 font-medium mr-4">Views</span>
                      <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                      <span className="text-xs text-gray-500 font-medium">Clicks</span>
                    </div>
                  </div>
                  <div className="h-40 flex items-end justify-between gap-3 px-2 relative">
                    {/* Horizontal grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="w-full h-[1px] bg-gray-100"></div>
                      <div className="w-full h-[1px] bg-gray-100"></div>
                      <div className="w-full h-[1px] bg-gray-100"></div>
                      <div className="w-full h-[1px] bg-gray-100"></div>
                    </div>
                    {/* Bars */}
                    {[40, 70, 45, 90, 65, 85, 100, 60, 80, 50, 75, 95].map((val, i) => (
                      <div key={i} className="w-full flex flex-col justify-end gap-1 group relative z-10 h-full">
                        <div className="w-full bg-pink-500 rounded-t-sm transition-all duration-500 group-hover:opacity-80" style={{ height: `${val}%` }}></div>
                        <div className="w-full bg-gray-200 rounded-t-sm transition-all duration-500 group-hover:opacity-80" style={{ height: `${val * 0.4}%` }}></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campaign Table (mock) */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hidden sm:block shadow-sm">
                  <div className="grid grid-cols-4 bg-gray-50 px-5 py-3 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                    <div>Campaign Name</div>
                    <div>Status</div>
                    <div>Creators</div>
                    <div className="text-right">ROI</div>
                  </div>
                  {[
                    { name: "Summer Launch 2026", status: "Active", creators: "45/50", roi: "320%" },
                    { name: "New App Install", status: "Active", creators: "12/20", roi: "185%" },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-4 px-5 py-4 border-b border-gray-50 text-sm items-center hover:bg-gray-50/50 transition-colors">
                      <div className="font-medium text-gray-900">{row.name}</div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600`}>
                          {row.status}
                        </span>
                      </div>
                      <div className="text-gray-600 text-xs flex items-center gap-1">
                        <Users size={14} className="text-gray-400" /> {row.creators}
                      </div>
                      <div className="text-right font-bold text-gray-900 font-display text-lg">{row.roi}</div>
                    </div>
                  ))}
                </div>
                
                {/* Floating "Approved" Badge overlay for extra effect */}
                <div className="absolute right-10 bottom-32 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce shadow-[0_10px_40px_-10px_rgba(236,72,153,0.3)] z-30">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-500 flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Content Approved</p>
                    <p className="text-xs text-gray-500">Video went live</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transparent to solid overlay layer to blend dashboard into the main site UI */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#fafafa] to-transparent pointer-events-none z-40 rounded-b-2xl lg:rounded-b-[2.5rem]"></div>
        </div>
        
        {/* Transparent to Solid Line break */}
        <div className="w-[1px] h-32 md:h-48 bg-gradient-to-b from-transparent via-gray-200 to-gray-200 mx-auto -mt-16 md:-mt-24 relative z-10"></div>
      </div>
    </section>
  );
}
