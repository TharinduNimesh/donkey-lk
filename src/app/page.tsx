"use client";

import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { HeroSection } from "@/components/ui/hero-section";
import { FeaturesSection } from "@/components/ui/features-section";
import { ProcessSection } from "@/components/ui/process-section";
import { TasksSection } from "@/components/ui/tasks-section";
import { WelcomeModal } from "@/components/welcome-modal";
import { ModalProvider } from "@/components/ui/animated-modal";

export default function Home() {
  return (
    <ModalProvider>
      <main className="min-h-screen">
        <WelcomeModal />
        <Header />
        <HeroSection />
        <section className="py-20" id="features">
          <FeaturesSection />
        </section>
        <section className="py-20">
          <ProcessSection />
        </section>
        <section className="py-20 bg-gradient-to-b from-transparent to-pink-50/30 dark:to-pink-950/30">
          <TasksSection />
        </section>
        <Footer />
      </main>
    </ModalProvider>
  );
}
