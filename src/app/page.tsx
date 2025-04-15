"use client";

import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { HeroSection } from "@/components/ui/hero-section";
import { FeaturesSection } from "@/components/ui/features-section";
import { ProcessSection } from "@/components/ui/process-section";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <section className="py-20">
        <FeaturesSection />
      </section>
      <section className="py-20">
        <ProcessSection />
      </section>
      <Footer />
    </main>
  );
}
