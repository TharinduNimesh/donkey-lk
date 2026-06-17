"use client";

import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { HeroSection } from "@/components/ui/hero-section";
import { FeaturesSection } from "@/components/ui/features-section";
import { ProcessSection } from "@/components/ui/process-section";
import { TestimonialSection } from "@/components/ui/testimonial-section";
import { WelcomeModal } from "@/components/welcome-modal";
import { ModalProvider } from "@/components/ui/animated-modal";
import { Analytics } from "@vercel/analytics/next"

export default function Home() {
  return (
    <ModalProvider>
      <main className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-pink-100 selection:text-pink-900 overflow-x-hidden">
        {/* Soft pink background for hero section */}
        <div className="absolute top-0 left-0 right-0 h-[85vh] bg-gradient-to-b from-[#fdf2f8] via-[#fdf2f8]/70 to-transparent -z-10 pointer-events-none"></div>
        
        <WelcomeModal />
        <Header />
        
        <div className="relative z-10">
          <HeroSection />
        </div>
        
        <div className="bg-[#fafafa]">
          <FeaturesSection />
        </div>
        
        <div className="bg-white">
          <ProcessSection />
        </div>
        
        <div className="bg-[#fafafa] pt-8 pb-16">
          <TestimonialSection />
        </div>
        
        <Footer />
        <Analytics />
      </main>
    </ModalProvider>
  );
}
