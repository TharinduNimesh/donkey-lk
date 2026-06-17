"use client";

import { IconStarFilled, IconQuote } from "@tabler/icons-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  avatarUrl: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "David O.",
    role: "Marketing Director @ TechFlow",
    quote: "BrandSync completely changed how we handle influencer marketing. The pay-per-performance model means we never overpay for a campaign. It's completely risk-free.",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 2,
    name: "Sarah K.",
    role: "Founder @ Bloom Beauty",
    quote: "We used to spend hours negotiating with creators. Now, we set a budget, and the creators come to us. Our ROI has increased by 300% since we switched to BrandSync.",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 3,
    name: "Michael T.",
    role: "Growth Lead @ Startup Inc",
    quote: "The transparent analytics dashboard is a game-changer. We can see exactly which creator drove the most clicks and views in real-time. Unmatched visibility.",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 4,
    name: "Jessica L.",
    role: "Brand Manager @ FitLife",
    quote: "No more upfront fees or risky deposits. We only pay when the creators deliver tangible views and clicks. BrandSync is the future of performance marketing.",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 5,
    name: "Ryan B.",
    role: "VP of Marketing @ Elevate",
    quote: "BrandSync's automated verification system ensures we're only paying for real, high-quality engagement. The level of trust and automation is simply incredible.",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 6,
    name: "Amanda C.",
    role: "CMO @ Fresh Foods",
    quote: "Launching campaigns is faster than ever. We've scaled our reach to millions of views effortlessly, all while staying strictly within our allocated monthly budgets.",
    avatarUrl: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=120&fit=crop&q=80",
    rating: 5
  }
];

export function BusinessTestimonialSection() {
  // Duplicate array to create a seamless infinite loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="w-full py-24 overflow-hidden relative">
      {/* Custom style injection for seamless infinite marquee */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          display: flex;
          width: max-content;
          animation: marquee-left 45s linear infinite;
        }
        .animate-marquee-right {
          display: flex;
          width: max-content;
          animation: marquee-right 45s linear infinite;
        }
        .animate-marquee-left:hover,
        .animate-marquee-right:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="text-center mb-16 px-4">
        <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold font-display text-gray-900 mb-4 tracking-tight">
          Trusted by Innovative Brands
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-light text-lg">
          Join thousands of businesses who are already scaling their reach risk-free.
        </p>
      </div>

      <div className="relative max-w-[100vw] mx-auto pb-4">
        {/* Left/Right fading gradients to make the edges blend smoothly */}
        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-[#fafafa] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-[#fafafa] to-transparent z-10 pointer-events-none"></div>

        {/* First Row - Moving Left */}
        <div className="flex w-fit animate-marquee-left group hover:[animation-play-state:paused]">
          <div className="flex gap-6 pr-6">
            {duplicatedTestimonials.slice(0, 6).map((testimonial, i) => (
              <TestimonialCard key={`${testimonial.id}-${i}`} testimonial={testimonial} />
            ))}
          </div>
          <div className="flex gap-6 pr-6" aria-hidden="true">
            {duplicatedTestimonials.slice(0, 6).map((testimonial, i) => (
              <TestimonialCard key={`copy-${testimonial.id}-${i}`} testimonial={testimonial} />
            ))}
          </div>
        </div>

        {/* Second Row - Moving Right */}
        <div className="flex w-fit animate-marquee-right mt-6 group hover:[animation-play-state:paused]">
          <div className="flex gap-6 pr-6">
            {duplicatedTestimonials.slice(6, 12).map((testimonial, i) => (
              <TestimonialCard key={`${testimonial.id}-${i}`} testimonial={testimonial} />
            ))}
          </div>
          <div className="flex gap-6 pr-6" aria-hidden="true">
            {duplicatedTestimonials.slice(6, 12).map((testimonial, i) => (
              <TestimonialCard key={`copy-${testimonial.id}-${i}`} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="w-[340px] md:w-[380px] flex-shrink-0 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.02)] flex flex-col justify-between relative">
      
      {/* Top quote icon & stars */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-0.5 text-pink-500">
          {[...Array(testimonial.rating)].map((_, i) => (
            <IconStarFilled key={i} size={14} />
          ))}
        </div>
        <div className="text-gray-200">
          <IconQuote size={20} className="opacity-40" />
        </div>
      </div>
      
      {/* Quote Text */}
      <p className="text-gray-600 font-light text-[15px] leading-relaxed mb-8 italic flex-grow">
        "{testimonial.quote}"
      </p>
      
      {/* Author Profile */}
      <div className="flex items-center gap-4 border-t border-gray-50 pt-5 mt-auto">
        <img 
          src={testimonial.avatarUrl} 
          alt={testimonial.name} 
          className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-50"
        />
        <div>
          <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
          <p className="text-gray-400 text-xs font-light mt-0.5">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}
