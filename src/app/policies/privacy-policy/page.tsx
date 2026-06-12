"use client";

import { Footer } from "@/components/ui/footer";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
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
                Privacy Policy
              </span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Effective Date: June 12, 2026
            </p>
          </motion.div>

          {/* Privacy Policy Card */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm">
              <div className="prose prose-pink dark:prose-invert max-w-none space-y-6 text-sm text-gray-650 dark:text-gray-300 leading-relaxed">
                <p>
                  <strong>Brandsync.lk</strong> (&ldquo;Brandsync&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting the privacy and personal information of our users. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Brandsync.lk platform.
                </p>
                <p>
                  By accessing or using Brandsync.lk, you agree to the practices described in this Privacy Policy.
                </p>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">1. Information We Collect</h3>
                  
                  <h4 className="font-semibold text-gray-700 dark:text-zinc-200 mt-2 mb-1">1.1 Personal Information</h4>
                  <p className="mb-2">We may collect the following personal information during registration and use of our platform:</p>
                  <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>Full Name</li>
                    <li>Mobile Number</li>
                    <li>Email Address</li>
                    <li>Date of Birth (if required)</li>
                    <li>Profile Information</li>
                    <li>Payment Details</li>
                    <li>Bank Account Information (for influencer payouts)</li>
                    <li>National Identity Card or Verification Documents (where required)</li>
                  </ul>

                  <h4 className="font-semibold text-gray-700 dark:text-zinc-200 mt-3 mb-1">1.2 Technical Information</h4>
                  <p className="mb-2">We may automatically collect:</p>
                  <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>IP Address</li>
                    <li>Device Information</li>
                    <li>Browser Type</li>
                    <li>Operating System</li>
                    <li>Access Times</li>
                    <li>Website Usage Data</li>
                    <li>Cookies and Tracking Information</li>
                  </ul>

                  <h4 className="font-semibold text-gray-700 dark:text-zinc-200 mt-3 mb-1">1.3 Social Media Information</h4>
                  <p className="mb-2">When connecting social media accounts, we may collect:</p>
                  <ul className="list-disc pl-5 mb-2 space-y-1">
                    <li>Account Username</li>
                    <li>Public Profile Information</li>
                    <li>Follower Counts</li>
                    <li>Engagement Statistics</li>
                    <li>Content Performance Metrics</li>
                  </ul>
                  <p className="text-xs text-gray-500 italic">We only access information that users authorize through supported platforms.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">2. How We Use Your Information</h3>
                  <p className="mb-2">We use collected information to:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Create and manage user accounts.</li>
                    <li>Verify user identity.</li>
                    <li>Process campaign orders and payments.</li>
                    <li>Facilitate influencer payouts.</li>
                    <li>Measure campaign performance.</li>
                    <li>Prevent fraud and abuse.</li>
                    <li>Improve platform functionality.</li>
                    <li>Provide customer support.</li>
                    <li>Communicate updates, promotions, and service notifications.</li>
                    <li>Comply with legal obligations.</li>
                  </ul>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">3. Cookies and Tracking Technologies</h3>
                  <p className="mb-2">Brandsync.lk may use cookies and similar technologies to:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Remember user preferences.</li>
                    <li>Maintain login sessions.</li>
                    <li>Analyze website traffic.</li>
                    <li>Improve user experience.</li>
                    <li>Detect fraudulent activities.</li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-500">Users may disable cookies through their browser settings, although some features may not function properly.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">4. Information Sharing</h3>
                  <p className="mb-3">We do not sell, rent, or trade personal information to third parties.</p>
                  <p className="mb-2">We may share information only with:</p>
                  
                  <h4 className="font-semibold text-gray-700 dark:text-zinc-200 mt-2 mb-1">4.1 Service Providers</h4>
                  <p className="mb-2">Third-party providers assisting with:</p>
                  <ul className="list-disc pl-5 mb-3 space-y-1">
                    <li>Payment Processing</li>
                    <li>SMS Verification</li>
                    <li>Email Services</li>
                    <li>Analytics Services</li>
                    <li>Website Hosting</li>
                  </ul>

                  <h4 className="font-semibold text-gray-700 dark:text-zinc-200 mt-3 mb-1">4.2 Legal Requirements</h4>
                  <p className="mb-2">We may disclose information when required by:</p>
                  <ul className="list-disc pl-5 mb-3 space-y-1">
                    <li>Sri Lankan laws and regulations.</li>
                    <li>Court orders.</li>
                    <li>Government authorities.</li>
                    <li>Law enforcement investigations.</li>
                  </ul>

                  <h4 className="font-semibold text-gray-700 dark:text-zinc-200 mt-3 mb-1">4.3 Business Transfers</h4>
                  <p>If Brandsync.lk undergoes a merger, acquisition, or business transfer, user information may be transferred as part of that transaction.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">5. Payment Security</h3>
                  <p>Brandsync.lk does not store complete credit card or debit card details on its servers.</p>
                  <p className="mt-2">Payment transactions are processed through secure third-party payment gateways that comply with applicable security standards.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">6. Influencer Verification</h3>
                  <p className="mb-2">To maintain platform integrity, Brandsync.lk may request:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Identity verification documents.</li>
                    <li>Ownership verification of social media accounts.</li>
                    <li>Additional information required to prevent fraud.</li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-500">Verification information will be stored securely and used solely for platform administration and compliance purposes.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">7. Data Retention</h3>
                  <p className="mb-2">We retain personal information only for as long as necessary to:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Provide platform services.</li>
                    <li>Fulfill legal obligations.</li>
                    <li>Resolve disputes.</li>
                    <li>Enforce platform agreements.</li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-500">When information is no longer required, it will be securely deleted or anonymized.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">8. User Rights</h3>
                  <p className="mb-2">Users may request to:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Access their personal information.</li>
                    <li>Correct inaccurate information.</li>
                    <li>Update account details.</li>
                    <li>Request account deletion.</li>
                    <li>Withdraw consent where applicable.</li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-500">Certain information may be retained where required by law or for legitimate business purposes.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">9. Data Security</h3>
                  <p>Brandsync.lk implements reasonable administrative, technical, and physical safeguards to protect personal information against:</p>
                  <ul className="list-disc pl-5 my-2 space-y-1">
                    <li>Unauthorized access</li>
                    <li>Loss</li>
                    <li>Misuse</li>
                    <li>Disclosure</li>
                    <li>Alteration</li>
                    <li>Destruction</li>
                  </ul>
                  <p className="text-xs text-gray-500">However, no online platform can guarantee absolute security.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">10. Children’s Privacy</h3>
                  <p>Brandsync.lk is intended for users aged 18 years and above.</p>
                  <p className="mt-2">We do not knowingly collect personal information from individuals under 18 years of age. If we become aware that such information has been collected, we will take reasonable steps to remove it.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">11. Third-Party Links</h3>
                  <p>Our platform may contain links to third-party websites or services. Brandsync.lk is not responsible for the privacy practices or content of external websites. Users should review the privacy policies of such websites before providing personal information.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">12. Changes to This Privacy Policy</h3>
                  <p>Brandsync.lk reserves the right to update this Privacy Policy at any time. Changes will become effective immediately upon publication on the website. Continued use of the platform after changes constitutes acceptance of the updated Privacy Policy.</p>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-3">13. Contact Information</h3>
                  <p className="mb-2">If you have any questions regarding this Privacy Policy, please contact:</p>
                  <address className="not-italic bg-gray-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-gray-150/40 dark:border-zinc-800/60 mt-2 space-y-1">
                    <p className="font-semibold text-gray-800 dark:text-zinc-200">Brandsync.lk</p>
                    <p>Email: <a href="mailto:support@brandsync.lk" className="text-pink-500 hover:text-pink-600 transition-colors">support@brandsync.lk</a></p>
                    <p>Website: <a href="https://www.brandsync.lk" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 transition-colors">www.brandsync.lk</a></p>
                    <p>Sri Lanka</p>
                  </address>
                </div>
              </div>
            </Card>
          </motion.section>

          {/* Contact Support Button */}
          <motion.div variants={childVariants} className="text-center pt-4">
            <p className="text-gray-650 dark:text-gray-400 mb-4 text-sm font-medium">
              Have questions about our privacy practices?
            </p>
            <a
              href="mailto:support@brandsync.lk"
              className="inline-flex items-center justify-center px-8 py-2.5 font-bold text-xs uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-0.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white shadow-md hover:shadow-lg"
            >
              Contact Support
            </a>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
