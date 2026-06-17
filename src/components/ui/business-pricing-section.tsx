"use client";

import Link from "next/link";
import { Eye, MousePointerClick, BadgeCheck } from "lucide-react";

export function BusinessPricingSection() {
  return (
    <section className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold font-display text-gray-900 mb-6 tracking-tight">
          Pay-Per-Performance Model
        </h2>
        <p className="text-gray-600 font-light text-lg leading-relaxed">
          Stop guessing your ROI. With BrandSync, you only pay for tangible results—<br className="hidden sm:block" />views and clicks—not just for a post to go live.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        
        {/* Left Card: Transparent Pricing */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 md:p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <h3 className="text-2xl font-bold font-display text-gray-900 mb-8">
            Transparent Pricing, Real Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
            
            {/* Box 1: Views */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-pink-200 transition-colors">
              <div className="absolute top-6 right-6 opacity-10 text-pink-500 group-hover:scale-110 group-hover:opacity-20 transition-all duration-300">
                <Eye size={64} strokeWidth={1} />
              </div>
              <h4 className="text-4xl font-black font-display text-[#ce1156] mb-1">$165</h4>
              <p className="text-sm font-bold text-gray-900 mb-4 tracking-wide">per 100K Views</p>
              <p className="text-sm text-gray-500 font-light leading-relaxed max-w-[85%] relative z-10">
                Guarantee reach and brand awareness efficiently.
              </p>
            </div>
            
            {/* Box 2: Clicks */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-pink-200 transition-colors">
              <div className="absolute top-6 right-6 opacity-10 text-pink-500 group-hover:scale-110 group-hover:opacity-20 transition-all duration-300">
                <MousePointerClick size={64} strokeWidth={1} />
              </div>
              <h4 className="text-4xl font-black font-display text-[#ce1156] mb-1">$0.70</h4>
              <p className="text-sm font-bold text-gray-900 mb-4 tracking-wide">per 100 Clicks</p>
              <p className="text-sm text-gray-500 font-light leading-relaxed max-w-[85%] relative z-10">
                Drive targeted traffic directly to your landing pages.
              </p>
            </div>
            
          </div>
        </div>

        {/* Right Card: Risk-Free Scaling */}
        <div className="lg:col-span-1 rounded-[2rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(206,17,86,0.2)] flex flex-col bg-gradient-to-br from-[#d6135c] to-[#a10d44] text-white relative overflow-hidden">
          
          {/* Decorative background circle */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl"></div>
          
          <div className="mb-6 relative z-10">
            <BadgeCheck size={36} className="text-white" strokeWidth={2} />
          </div>
          
          <h3 className="text-2xl font-bold font-display text-white mb-4 relative z-10">
            Risk-Free Scaling
          </h3>
          
          <p className="text-white/90 font-light leading-relaxed mb-10 text-sm md:text-base relative z-10">
            Set strict budget caps. If a creator's post underperforms, you don't pay the full amount. If it goes viral, your cost is capped at your budget.
          </p>
          
          <div className="mt-auto relative z-10">
            <Link 
              href="/auth/signup" 
              className="inline-block bg-white text-[#d6135c] font-bold px-8 py-3.5 rounded-full text-sm hover:bg-gray-50 transition-colors shadow-sm w-fit"
            >
              Start Scaling
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
