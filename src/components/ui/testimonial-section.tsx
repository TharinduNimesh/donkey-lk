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
    name: "Sarah Jenkins",
    role: "YouTube • 1.2M Followers",
    quote: "BrandSync changed my life. I used to spend days pitching to brands, now I just make videos and get paid automatically based on my views. It's so seamless.",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 2,
    name: "Marcus Chen",
    role: "Instagram • 450K Followers",
    quote: "The link sharing campaign is amazing. I can drop campaign links in my bio or story swipe-ups, and the clicks translate directly into cash on my dashboard. Uncapped earnings!",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 3,
    name: "Elena Rostova",
    role: "TikTok • 2.1M Followers",
    quote: "I was skeptical about the view rates, but my first payout of $1,500 cleared directly to my bank in 3 days. Verification is automated, so there are no delays.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 4,
    name: "David Kim",
    role: "YouTube • 800K Followers",
    quote: "The payout rates are very transparent. It's the first platform where I don't have to chase brands for invoice clearances. Highly recommended.",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 5,
    name: "Aisha Diallo",
    role: "Instagram • 620K Followers",
    quote: "I love that there are zero platform restrictions. I shared links on my Telegram and Facebook groups and made $800 in a single week.",
    avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 6,
    name: "Liam Carter",
    role: "YouTube • 1.5M Followers",
    quote: "Signing up was so simple. Within 10 minutes I was linked up and applying for my first campaign. Extremely user-friendly interface.",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 7,
    name: "Sofia Vergara",
    role: "TikTok • 350K Followers",
    quote: "The automated verification is a game-changer. I just post content, and the views track automatically. BrandSync is standard for creators now.",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&fit=crop&q=80",
    rating: 5
  },
  {
    id: 8,
    name: "Lucas Miller",
    role: "Twitch • 950K Followers",
    quote: "As a streamer, I don't have much time for brand campaigns. BrandSync lets me monetize my clips with zero effort. The passive income is real.",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&fit=crop&q=80",
    rating: 5
  }
];

export function TestimonialSection() {
  const row1 = [
    testimonials[0],
    testimonials[1],
    testimonials[2],
    testimonials[3],
  ];

  const row2 = [
    testimonials[4],
    testimonials[5],
    testimonials[6],
    testimonials[7],
  ];

  const row1Repeated = [...row1, ...row1];
  const row2Repeated = [...row2, ...row2];

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

      {/* Header */}
      <div className="text-center mb-16 px-4">
        <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold font-display text-gray-900 mb-4 tracking-tight">
          Loved by Creators
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-light text-lg">
          Hear from the influencers who are building their careers and boosting their income using BrandSync.
        </p>
      </div>

      {/* Testimonial Rows Container */}
      <div className="relative w-full flex flex-col gap-6">
        {/* Left and Right Fade Gradients */}
        <div className="absolute top-0 bottom-0 left-0 w-16 md:w-36 bg-gradient-to-r from-[#fafafa] to-transparent pointer-events-none z-10"></div>
        <div className="absolute top-0 bottom-0 right-0 w-16 md:w-36 bg-gradient-to-l from-[#fafafa] to-transparent pointer-events-none z-10"></div>

        {/* Row 1: Sliding Left */}
        <div className="w-full overflow-hidden py-2">
          <div className="flex gap-6 animate-marquee-left">
            {row1Repeated.map((t, idx) => (
              <div 
                key={`row1-${t.id}-${idx}`}
                className="w-[340px] md:w-[380px] flex-shrink-0 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.02)] flex flex-col justify-between relative"
              >
                {/* Top quote icon & stars */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-0.5 text-pink-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <IconStarFilled key={i} size={14} />
                    ))}
                  </div>
                  <div className="text-gray-200">
                    <IconQuote size={20} className="opacity-40" />
                  </div>
                </div>

                {/* Quote Text */}
                <p className="text-gray-600 font-light text-[15px] leading-relaxed mb-8 italic flex-grow">
                  "{t.quote}"
                </p>

                {/* Author Profile */}
                <div className="flex items-center gap-4 border-t border-gray-50 pt-5 mt-auto">
                  <img 
                    src={t.avatarUrl} 
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-50"
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs font-light mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Sliding Right */}
        <div className="w-full overflow-hidden py-2">
          <div className="flex gap-6 animate-marquee-right">
            {row2Repeated.map((t, idx) => (
              <div 
                key={`row2-${t.id}-${idx}`}
                className="w-[340px] md:w-[380px] flex-shrink-0 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.02)] flex flex-col justify-between relative"
              >
                {/* Top quote icon & stars */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-0.5 text-pink-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <IconStarFilled key={i} size={14} />
                    ))}
                  </div>
                  <div className="text-gray-200">
                    <IconQuote size={20} className="opacity-40" />
                  </div>
                </div>

                {/* Quote Text */}
                <p className="text-gray-600 font-light text-[15px] leading-relaxed mb-8 italic flex-grow">
                  "{t.quote}"
                </p>

                {/* Author Profile */}
                <div className="flex items-center gap-4 border-t border-gray-50 pt-5 mt-auto">
                  <img 
                    src={t.avatarUrl} 
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-50"
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs font-light mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
