"use client";

import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { BusinessHeroSection } from "@/components/ui/business-hero-section";
import { BusinessFeaturesSection } from "@/components/ui/business-features-section";
import { BusinessProcessSection } from "@/components/ui/business-process-section";
import { BusinessPricingSection } from "@/components/ui/business-pricing-section";
import { BusinessTestimonialSection } from "@/components/ui/business-testimonial-section";
import { WelcomeModal } from "@/components/welcome-modal";
import { ModalProvider } from "@/components/ui/animated-modal";
import { Analytics } from "@vercel/analytics/next"

export default function BusinessHome() {
  return (
    <ModalProvider>
      <main className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-pink-100 selection:text-pink-900 overflow-x-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 right-0 h-[85vh] bg-gradient-to-b from-[#fdf2f8] via-[#fdf2f8]/70 to-transparent -z-10 pointer-events-none"></div>
        <div className="fixed top-[40%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-pink-400/5 blur-[120px] pointer-events-none -z-0"></div>
        <div className="fixed bottom-[-10%] -right-[5%] w-[35vw] h-[35vw] rounded-full bg-rose-400/5 blur-[100px] pointer-events-none -z-0"></div>
        
        <WelcomeModal />
        <Header />
        
        <div className="relative z-10">
          <BusinessHeroSection />
        </div>
        
        <div className="relative z-10">
          <BusinessPricingSection />
        </div>

        <div className="relative z-10">
          <BusinessFeaturesSection />
        </div>
        
        <div className="relative z-10 bg-white/60 backdrop-blur-xl">
          <BusinessProcessSection />
        </div>
        
        <div className="relative z-10 pt-8 pb-16">
          <BusinessTestimonialSection />
        </div>
        
        <Footer />
        <Analytics />
      </main>
    </ModalProvider>
  );
}
