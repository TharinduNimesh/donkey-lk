"use client";

import Link from "next/link";
import { 
  IconBrandYoutubeFilled, 
  IconBrandInstagram, 
  IconBrandTiktok, 
  IconBrandFacebookFilled, 
  IconLink, 
  IconShare 
} from "@tabler/icons-react";

export function FeaturesSection() {
  return (
    <section className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold font-display text-gray-900 mb-4 tracking-tight">
          Hot Campaigns Available
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-light text-lg">
          Browse high-paying opportunities from top brands and start earning immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Campaign 1: Video Views */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col items-start relative transition-all duration-300">
          {/* Header Row: Social Media Icons */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-[#ff0000] border border-red-100">
              <IconBrandYoutubeFilled size={18} />
            </div>
            <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-[#e1306c] border border-pink-100">
              <IconBrandInstagram size={18} />
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-200">
              <IconBrandTiktok size={18} />
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#1877f2] border border-blue-100">
              <IconBrandFacebookFilled size={18} />
            </div>
          </div>

          <h3 className="text-2xl font-bold font-display text-gray-900 mb-3">Video Views Monetization</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed flex-grow font-light">
            Monetize your video content across all major platforms. Make short-form or long-form videos and get paid for your reach.
          </p>

          {/* Earning Potential banner with clear boundaries */}
          <div className="w-full bg-pink-50/30 rounded-2xl p-4 mb-6 border border-pink-100/50">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">Earning Rate</span>
              <span className="text-[10px] font-bold text-gray-400 font-sans">Guaranteed</span>
            </div>
            <p className="text-gray-900 text-sm font-medium">
              <span className="text-3xl font-black text-[#ff1b6b] font-display tracking-tight leading-none">$10</span>
              <span className="text-gray-500 font-light ml-1.5">per 100K views</span>
            </p>
          </div>

          {/* Earning Pool Stats */}
          <div className="w-full border-t border-gray-100 pt-5 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Total Valuation</p>
                <p className="text-xl font-black text-gray-900 font-display">$1.0M</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Allocation</p>
                <p className="text-xs font-bold text-pink-500 uppercase tracking-widest mt-1">Start Today</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full">
              <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
                <span>Pool Progress</span>
                <span className="font-sans text-gray-900">30% Allocated</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full transition-all duration-500" style={{ width: "30%" }}></div>
              </div>
            </div>
          </div>

          {/* Active Creators Stack */}
          <div className="flex items-center gap-3 mb-8 w-full">
            <div className="flex -space-x-2.5 overflow-hidden">
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80" alt="Creator" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80" alt="Creator" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80" alt="Creator" />
            </div>
            <p className="text-xs font-bold text-gray-500 font-sans">
              <span className="text-gray-900 font-black">100+</span> active creators
            </p>
          </div>

          <Link href="/auth/signup" className="w-full">
            <button className="w-full rounded-full py-4 bg-pink-500 text-white font-bold text-sm tracking-wide hover:bg-pink-600 hover:shadow-[0_4px_14px_rgba(236,72,153,0.3)] transition-all cursor-pointer">
              Apply Now
            </button>
          </Link>
        </div>

        {/* Campaign 2: Link Sharing */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col items-start relative transition-all duration-300">
          {/* Header Row: Single Link Icon */}
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-700 border border-gray-100 mb-6">
            <IconLink size={20} />
          </div>

          <h3 className="text-2xl font-bold font-display text-gray-900 mb-3">Smart Link Sharing</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed flex-grow font-light">
            Share custom tracking links in bio, posts, groups or messages. No platform limitations — earn on any platform.
          </p>

          {/* Earning Potential banner with clear boundaries */}
          <div className="w-full bg-gray-50/50 rounded-2xl p-4 mb-6 border border-gray-200/50">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Earning Rate</span>
              <span className="text-[10px] font-bold text-gray-400 font-sans">Uncapped</span>
            </div>
            <p className="text-gray-900 text-sm font-medium">
              <span className="text-3xl font-black text-gray-900 font-display tracking-tight leading-none">$10</span>
              <span className="text-gray-500 font-light ml-1.5">per 10K clicks</span>
            </p>
          </div>

          {/* Earning Pool Stats */}
          <div className="w-full border-t border-gray-100 pt-5 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Total Valuation</p>
                <p className="text-xl font-black text-gray-900 font-display">$5.0M</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Status</p>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mt-1">Join Now</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full">
              <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
                <span>Pool Progress</span>
                <span className="font-sans text-gray-900">60% Progressed</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full transition-all duration-500" style={{ width: "60%" }}></div>
              </div>
            </div>
          </div>

          {/* Active Creators Stack */}
          <div className="flex items-center gap-3 mb-8 w-full">
            <div className="flex -space-x-2.5 overflow-hidden">
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&fit=crop&q=80" alt="Creator" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80" alt="Creator" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80" alt="Creator" />
            </div>
            <p className="text-xs font-bold text-gray-500 font-sans">
              <span className="text-gray-900 font-black">1,000+</span> active creators
            </p>
          </div>

          <Link href="/auth/signup" className="w-full">
            <button className="w-full rounded-full py-4 bg-pink-500 text-white font-bold text-sm tracking-wide hover:bg-pink-600 hover:shadow-[0_4px_14px_rgba(236,72,153,0.3)] transition-all cursor-pointer">
              Apply Now
            </button>
          </Link>
        </div>

        {/* Campaign 3: Post Sharing (Coming Soon) */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col items-start relative transition-all duration-300">
          {/* Header Row: Share Icon and Coming Soon badge */}
          <div className="flex justify-between items-center w-full mb-6">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
              <IconShare size={20} />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full uppercase">
              Coming Soon
            </span>
          </div>

          <h3 className="text-2xl font-bold font-display text-gray-900 mb-3">Content & Post Sharing</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed flex-grow font-light">
            Share pre-curated images, videos, or texts directly to your social feed. Minimal effort, direct payouts.
          </p>

          {/* Earning Potential banner with clear boundaries */}
          <div className="w-full bg-gray-50/50 rounded-2xl p-4 mb-6 border border-gray-200/50">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Earning Rate</span>
              <span className="text-[10px] font-bold text-gray-400 font-sans">Estimated</span>
            </div>
            <p className="text-gray-900 text-sm font-medium">
              <span className="text-3xl font-black text-gray-400 font-display tracking-tight leading-none">$10</span>
              <span className="text-gray-500 font-light ml-1.5">per post share</span>
            </p>
          </div>

          {/* Earning Pool Stats */}
          <div className="w-full border-t border-gray-100 pt-5 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Est. Valuation</p>
                <p className="text-xl font-black text-gray-900 font-display">$10.0M</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Timeline</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Coming Year</p>
              </div>
            </div>

            {/* Waiting list status/info placeholder */}
            <div className="w-full p-2.5 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center">
              <p className="text-[11px] font-bold text-gray-500">Waiting List Open for Early Access</p>
            </div>
          </div>

          {/* Active Creators Stack (Waiting List) */}
          <div className="flex items-center gap-3 mb-8 w-full">
            <div className="flex -space-x-2.5 overflow-hidden">
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&fit=crop&q=80" alt="Creator" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=80&fit=crop&q=80" alt="Creator" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&fit=crop&q=80" alt="Creator" />
            </div>
            <p className="text-xs font-bold text-gray-500 font-sans">
              <span className="text-gray-900 font-black">30+</span> on waiting list
            </p>
          </div>

          <Link href="/auth/signup" className="w-full">
            <button className="w-full rounded-full py-4 bg-white border border-gray-200 text-gray-700 font-bold text-sm tracking-wide hover:bg-gray-50 transition-colors cursor-pointer">
              Join Waitlist
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
}