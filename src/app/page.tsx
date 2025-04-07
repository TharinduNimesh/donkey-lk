"use client";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] opacity-30 blur-3xl bg-purple-500 rounded-full animate-blob"></div>
        <div className="absolute top-[30%] left-[-10%] w-[600px] h-[600px] opacity-30 blur-3xl bg-blue-500 rounded-full animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] right-[20%] w-[600px] h-[600px] opacity-30 blur-3xl bg-pink-500 rounded-full animate-blob animation-delay-4000"></div>
      </div>

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Monetize Your Social Impact
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto text-foreground/80">
              Unlock higher earnings through sponsored content while building your influence in Sri Lanka
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90">
                Start Earning
              </Button>
              <Button size="lg" variant="outline">
                For Brands
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background/50 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-border/50">
              <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                For Content Creators
              </h3>
              <ul className="space-y-4 text-foreground/80">
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  Higher local earnings
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  Direct brand collaborations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  Local market focus
                </li>
              </ul>
            </div>
            <div className="bg-background/50 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-border/50">
              <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                For Brands
              </h3>
              <ul className="space-y-4 text-foreground/80">
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  Access verified creators
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  Track campaign performance
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  Target local audience
                </li>
              </ul>
            </div>
            <div className="bg-background/50 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-border/50">
              <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Growing Creators
              </h3>
              <ul className="space-y-4 text-foreground/80">
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  Mentorship program
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  Content promotion
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  Community support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Ready to Maximize Your Earnings?
          </h2>
          <p className="text-xl mb-8 text-foreground/80">
            Join the fastest-growing creator monetization platform in Sri Lanka
          </p>
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90">
            Get Started Now
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
