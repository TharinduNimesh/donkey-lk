"use client";

import { 
  Target, 
  Zap, 
  ShieldCheck 
} from "lucide-react";

export function BusinessFeaturesSection() {
  return (
    <section className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold font-display text-gray-900 mb-4 tracking-tight">
          Why Brands Choose Us
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-light text-lg">
          Drive real results with our performance-based influencer marketing platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Feature 1 */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col items-start relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 mb-6 border border-pink-100">
            <Target size={28} />
          </div>

          <h3 className="text-2xl font-bold font-display text-gray-900 mb-3">Hyper-Targeted Reach</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed flex-grow font-light">
            Connect with creators whose audiences perfectly match your ideal customer profile. Filter by demographics, engagement rates, and niche.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col items-start relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mb-6 border border-blue-100">
            <Zap size={28} />
          </div>

          <h3 className="text-2xl font-bold font-display text-gray-900 mb-3">Performance Based</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed flex-grow font-light">
            Stop paying for potential. Only pay for actual results—whether that's views, clicks, or conversions. Maximize your marketing ROI.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col items-start relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 mb-6 border border-green-100">
            <ShieldCheck size={28} />
          </div>

          <h3 className="text-2xl font-bold font-display text-gray-900 mb-3">Vetted Creators</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed flex-grow font-light">
            Every creator on our platform is strictly verified. We ensure brand safety and authentic engagement, so your brand is always in good hands.
          </p>
        </div>

      </div>
    </section>
  );
}
