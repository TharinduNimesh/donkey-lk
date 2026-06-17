"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { IconBrandYoutubeFilled, IconBrandInstagram, IconBrandTiktok, IconThumbUpFilled, IconHelpCircle } from "@tabler/icons-react";

export function HeroSection() {
  // Slider represents increments of 100k views.
  // 10 = 1M views, 50 = 5M views, 100 = 10M views.
  const [viewsSlider, setViewsSlider] = useState(50); 

  // List of local stock images for random loading
  const heroImages = [
    "/hero-stock/hero-random-andres-mfWsMDdN-Ro-unsplash.webp",
    "/hero-stock/hero-random-kudung-setiawan-JPlSLj5azFE-unsplash.webp",
    "/hero-stock/hero-random-steve-lord-g47EKQ0PxPw-unsplash.webp",
    "/hero-stock/hero-random-videodeck-co-4s_0zZKmMgA-unsplash.webp",
    "/hero-stock/hero-random-wesley-tingey-RAH1ipSQh24-unsplash.webp"
  ];

  const [mounted, setMounted] = useState(false);
  const [heroImage, setHeroImage] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * heroImages.length);
    setHeroImage(heroImages[randomIndex]);
    setMounted(true);
  }, []); 
  
  // $10 per 100k views per video, assuming an average of 10 videos per month.
  // Payout per video = viewsSlider * $10
  // Monthly payout = viewsSlider * $10 * 10 videos = viewsSlider * 100
  const earnings = viewsSlider * 100;
  
  // Format the views text nicely (e.g. 500k, 1M, 5.5M)
  const formatViews = (val: number) => {
    if (val === 0) return "0";
    if (val < 10) return `${val * 100}k`;
    return `${(val / 10).toFixed(1).replace('.0', '')}M`;
  };

  return (
    <section className="w-full relative overflow-visible">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 md:pt-44 pb-20">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative">
          
          {/* Left Content */}
          <div className="max-w-xl relative z-10 w-full">
            <div className="inline-block rounded-full bg-pink-200/50 px-4 py-1.5 mb-6">
              <span className="text-[11px] font-bold tracking-widest text-pink-500 uppercase">
                Creator First Platform
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-bold font-display leading-[1.05] tracking-tight mb-6 text-gray-900">
              Turn Your <br />
              Content into <br />
              <span className="text-pink-500">Cash</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-10 max-w-lg leading-relaxed font-light">
              Join thousands of creators monetizing their influence. Connect with top brands, participate in high-paying campaigns, and get paid for your views and clicks.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-14">
              <Link href="/auth/signup" className="rounded-full bg-pink-500 px-8 py-3.5 text-sm font-bold tracking-wide text-white hover:bg-pink-600 transition-colors shadow-[0_4px_14px_0_rgba(236,72,153,0.39)]">
                Start Earning
              </Link>
              <Link href="#how-it-works" className="rounded-full bg-white border border-gray-200 px-8 py-3.5 text-sm font-bold tracking-wide text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                See How It Works
              </Link>
            </div>
            
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                Monetize Across Platforms
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-transform hover:scale-110 cursor-pointer">
                  <IconBrandYoutubeFilled size={20} />
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-transform hover:scale-110 cursor-pointer">
                  <IconBrandInstagram size={20} />
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-transform hover:scale-110 cursor-pointer">
                  <IconBrandTiktok size={20} />
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-transform hover:scale-110 cursor-pointer">
                  <IconThumbUpFilled size={20} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Image & Floating Card */}
          <div className="relative w-full mt-8 lg:mt-0">
            <div className="relative w-full lg:w-[125%] h-[400px] md:h-[500px] lg:h-[640px] rounded-[2.5rem] lg:rounded-l-[3.5rem] lg:rounded-r-none overflow-hidden shadow-2xl z-0 bg-gray-50 lg:translate-x-8">
              <img 
                src={heroImage || "/hero-stock/hero-random-andres-mfWsMDdN-Ro-unsplash.webp"} 
                alt="Group of creators"
                className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                  mounted ? "opacity-100" : "opacity-0"
                }`}
              />
              {/* Soft Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-white/20"></div>
            </div>

            {/* Overlapping Card */}
            {/* On mobile: static position under the image. On desktop: absolute position over the image. */}
            <div className="relative mt-[-3rem] md:absolute md:bottom-12 md:left-0 md:mt-0 md:-translate-x-[15%] lg:-translate-x-[20%] w-[95%] mx-auto md:mx-0 md:w-[360px] bg-white/95 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-white/80 z-30">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-[1.25rem] bg-[#fff0f5] flex items-center justify-center text-[#ff1b6b] shadow-sm border border-pink-50">
                  <span className="text-3xl font-bold font-display leading-none">$</span>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1 group relative">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Potential Earnings</p>
                    <div className="cursor-pointer text-gray-400 hover:text-[#ff1b6b] transition-colors p-0.5">
                      <IconHelpCircle size={14} />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-gray-900/95 backdrop-blur-sm border border-gray-800 text-[11px] text-white rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-2xl z-50 text-left font-normal normal-case tracking-normal leading-relaxed font-sans">
                      Calculated at <span className="font-display font-bold text-pink-400">$10</span> per <span className="font-display font-bold text-pink-400">100k</span> views per video, assuming an average of <span className="font-display font-bold text-pink-400">10</span> videos posted per month.
                      {/* Triangle pointer */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-black text-gray-900 font-display tracking-tight leading-none">${earnings.toLocaleString()}</span>
                    <span className="text-sm font-medium text-gray-400 font-display ml-1">/mo</span>
                  </div>
                </div>
              </div>
              
              {/* Interactive Slider */}
              <div className="w-full mt-8 mb-4 relative px-1">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={viewsSlider} 
                  onChange={(e) => setViewsSlider(parseInt(e.target.value))}
                  className="w-full h-2.5 bg-gray-100 rounded-full appearance-none cursor-pointer hover:opacity-90 transition-opacity [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[#ff1b6b] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,27,107,0.5)] [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-[#ff1b6b] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full"
                  style={{
                    background: `linear-gradient(to right, #ff1b6b ${viewsSlider}%, #f3f4f6 ${viewsSlider}%)`
                  }}
                />
              </div>
              
              <div className="flex justify-between items-center mt-4 px-1">
                <p className="text-sm font-bold text-gray-600">Average Views per Video</p>
                <p className="text-sm font-black text-[#ff1b6b]">{formatViews(viewsSlider)}</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}