"use client";

import { Footer } from "@/components/ui/footer";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function TermsOfServicePage() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-pink-50/30 dark:to-pink-950/10">
      <main className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          className="max-w-4xl mx-auto space-y-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Page Title */}
          <motion.div variants={childVariants} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent font-display">
                Terms and Conditions
              </span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Effective Date: June 12, 2026
            </p>
          </motion.div>

          {/* General Terms Card */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm">
              <div className="prose prose-pink dark:prose-invert max-w-none space-y-6 text-sm text-gray-650 dark:text-gray-300 leading-relaxed">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-100 mb-4 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                    1. GENERAL TERMS
                  </h2>
                  <ol className="list-decimal pl-5 space-y-3">
                    <li>By registering and using Brandsync.lk, you agree to comply with these Terms and Conditions.</li>
                    <li>Brandsync.lk acts as a digital marketing platform connecting Advertisers (Clients) and Influencers/Content Creators.</li>
                    <li>Brandsync.lk reserves the right to modify these Terms and Conditions at any time without prior notice.</li>
                    <li>Users must provide accurate and truthful information during registration.</li>
                    <li>Any fraudulent activity, manipulation of views, clicks, engagements, or payments may result in immediate account suspension.</li>
                  </ol>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h2 className="text-xl font-bold text-gray-850 dark:text-zinc-100 mb-4 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                    SECTION A – CLIENT (ADVERTISER) TERMS
                  </h2>
                  
                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">2. Campaign Creation</h3>
                  <ol className="list-decimal pl-5 mb-4 space-y-2">
                    <li>Clients are responsible for ensuring all submitted content complies with Sri Lankan laws and platform policies.</li>
                    <li>
                      Clients shall not promote:
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Illegal products or services.</li>
                        <li>Misleading or deceptive advertisements.</li>
                        <li>Hate speech, violence, or harmful content.</li>
                        <li>Copyright-infringing content.</li>
                      </ul>
                    </li>
                    <li>Brandsync.lk reserves the right to reject any campaign without providing a reason.</li>
                  </ol>

                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">3. Payments</h3>
                  <ol className="list-decimal pl-5 mb-4 space-y-2">
                    <li>All campaign payments must be made in advance before campaign activation.</li>
                    <li>Campaign fees are non-refundable once the campaign has started.</li>
                    <li>Any payment gateway charges, taxes, or bank charges shall be borne by the Client unless otherwise stated.</li>
                  </ol>

                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">4. Performance and Results</h3>
                  <ol className="list-decimal pl-5 mb-4 space-y-2">
                    <li>Brandsync.lk will make reasonable efforts to deliver the requested campaign performance.</li>
                    <li>Actual results may vary depending on audience behavior, content quality, platform algorithms, and market conditions.</li>
                    <li>Brandsync.lk does not guarantee sales, conversions, revenue, or business outcomes.</li>
                    <li>Campaign statistics displayed on the dashboard are considered the official performance records.</li>
                  </ol>

                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">5. Content Ownership</h3>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Clients retain ownership of their submitted content.</li>
                    <li>Clients grant Brandsync.lk and participating influencers permission to share and promote campaign content during the campaign period.</li>
                  </ol>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h2 className="text-xl font-bold text-gray-850 dark:text-zinc-100 mb-4 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                    SECTION B – INFLUENCER / CONTENT CREATOR TERMS
                  </h2>

                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">6. Eligibility</h3>
                  <ol className="list-decimal pl-5 mb-4 space-y-2">
                    <li>Influencers must own or have legal authority to manage the social media accounts used on the platform.</li>
                    <li>Fake, purchased, automated, or artificially generated followers, views, clicks, or engagements are strictly prohibited.</li>
                    <li>Brandsync.lk may request verification documents at any time.</li>
                  </ol>

                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">7. Campaign Participation</h3>
                  <ol className="list-decimal pl-5 mb-4 space-y-2">
                    <li>Influencers must complete campaign requirements exactly as specified.</li>
                    <li>Required posts, shares, comments, views, or clicks must remain active for the minimum campaign duration specified.</li>
                    <li>Deleting campaign content before the required period may result in payment cancellation.</li>
                  </ol>

                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">8. Payments to Influencers</h3>
                  <ol className="list-decimal pl-5 mb-4 space-y-2">
                    <li>Payments are calculated based on successfully completed and verified campaign actions.</li>
                    <li>Brandsync.lk reserves the right to review campaign activity before approving payments.</li>
                    <li>Payments may be withheld for suspected fraud, fake traffic, bot activity, or policy violations.</li>
                    <li>Payment schedules and minimum withdrawal limits will be displayed within the platform.</li>
                  </ol>

                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">9. Prohibited Activities</h3>
                  <p className="mb-2">Influencers shall not:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li>Use bots or automated software.</li>
                    <li>Purchase fake views, clicks, followers, or engagements.</li>
                    <li>Create multiple accounts to manipulate earnings.</li>
                    <li>Submit false performance reports.</li>
                    <li>Engage in fraudulent activity of any kind.</li>
                  </ul>
                  <p className="text-xs text-red-500 font-semibold">Violation may result in permanent account termination and forfeiture of earnings.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h2 className="text-xl font-bold text-gray-850 dark:text-zinc-100 mb-4 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                    SECTION C – LIABILITY and DISCLAIMERS
                  </h2>

                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">10. Limitation of Liability</h3>
                  <ol className="list-decimal pl-5 mb-4 space-y-2">
                    <li>Brandsync.lk shall not be liable for indirect, incidental, or consequential damages arising from platform use.</li>
                    <li>Users use the platform at their own risk.</li>
                    <li>Brandsync.lk is not responsible for outages, interruptions, or algorithm changes made by third-party platforms such as Facebook, Instagram, TikTok, YouTube, or X.</li>
                  </ol>

                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">11. Account Suspension</h3>
                  <ol className="list-decimal pl-5 mb-4 space-y-2">
                    <li>Brandsync.lk reserves the right to suspend or terminate any account violating these Terms and Conditions.</li>
                    <li>Suspended users may lose access to pending earnings or campaign balances resulting from policy violations.</li>
                  </ol>

                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">12. Privacy</h3>
                  <ol className="list-decimal pl-5 mb-4 space-y-2">
                    <li>User information will be handled in accordance with the Brandsync.lk Privacy Policy.</li>
                    <li>Personal information will not be sold to third parties without consent except where required by law.</li>
                  </ol>

                  <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100 mt-4 mb-2">13. Governing Law</h3>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>These Terms and Conditions shall be governed by the laws of Sri Lanka.</li>
                    <li>Any disputes arising from platform use shall be subject to the jurisdiction of the courts of Sri Lanka.</li>
                  </ol>
                </div>
              </div>
            </Card>
          </motion.section>

          {/* Legal Support Button */}
          <motion.div variants={childVariants} className="text-center pt-4">
            <p className="text-gray-650 dark:text-gray-400 mb-4 text-sm font-medium">
              Have questions about our Terms and Conditions?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="mailto:support@brandsync.lk"
                className="inline-flex items-center justify-center px-8 py-2.5 font-bold text-xs uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-0.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white shadow-md hover:shadow-lg"
              >
                Contact Support
              </a>
              <Link
                href="/policies/privacy-policy"
                className="inline-flex items-center justify-center px-8 py-2.5 font-bold text-xs uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-0.5 rounded-full bg-background border border-pink-205 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 text-foreground"
              >
                View Privacy Policy
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}