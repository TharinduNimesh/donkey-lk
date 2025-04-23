"use client";

import { Header } from "@/components/ui/header";
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
              <span className="bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Privacy & Refund
              </span>{" "}
              Policy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Effective Date: 22 April 2025
            </p>
          </motion.div>

          {/* Privacy Policy Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Privacy Policy
              </h2>

              <div className="prose prose-pink dark:prose-invert max-w-none">
                <p className="mb-6">
                  At BrandSync.lk ("we", "our", "us"), your privacy is important
                  to us. This Privacy Policy explains how we collect, use, and
                  protect your personal information in accordance with the Data
                  Protection Act of Sri Lanka No. 9 of 2022.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                  1. Information We Collect
                </h3>
                <p className="mb-4">
                  When you interact with BrandSync.lk, we may collect:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>
                    Personal Identification Information (Name, Email address,
                    Telephone number, Billing and Delivery address).
                  </li>
                  <li>
                    Payment Information (processed securely via PayHere, Stripe,
                    PayPal — we do not store your payment card details).
                  </li>
                  <li>
                    Device and Usage Data (IP address, browser type, time zone,
                    and device info).
                  </li>
                </ul>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                  2. How We Use Your Information
                </h3>
                <p className="mb-4">We use this data to:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>Process and fulfill orders.</li>
                  <li>Verify and authenticate payments.</li>
                  <li>Communicate about orders, promotions, and updates.</li>
                  <li>Improve website performance and user experience.</li>
                  <li>Prevent fraud and ensure platform security.</li>
                </ul>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                  3. Data Sharing
                </h3>
                <p className="mb-4">We only share your personal information:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>
                    With trusted service providers for order processing and
                    payment.
                  </li>
                  <li>When legally required under Sri Lankan law.</li>
                </ul>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                  4. Data Protection
                </h3>
                <p className="mb-4">
                  We apply strong measures to protect your personal data:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>SSL encryption for secure transactions.</li>
                  <li>Secure third-party payment processing.</li>
                  <li>Limited access to personal data within our company.</li>
                </ul>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                  5. User Rights
                </h3>
                <p className="mb-4">You may:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>
                    Request access, correction, or deletion of your personal
                    data.
                  </li>
                  <li>
                    Withdraw consent for marketing communications at any time by
                    contacting support@brandsync.lk.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold mt-8 mb-4">6. Cookies</h3>
                <p className="mb-6">
                  We use cookies to improve your experience, measure site
                  performance, and serve relevant ads. By using BrandSync.lk,
                  you consent to this use. You may disable cookies via your
                  browser settings.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                  7. Third-Party Links
                </h3>
                <p className="mb-6">
                  We are not responsible for the content or privacy practices of
                  external websites.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                  8. Policy Updates
                </h3>
                <p className="mb-6">
                  We may update this Privacy Policy. Any changes will be posted
                  on this page with a new effective date.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Refund Policy Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Refund & Return Policy
              </h2>

              <div className="prose prose-pink dark:prose-invert max-w-none">
                <p className="mb-6">
                  At BrandSync.lk, we are committed to customer satisfaction and
                  fair service. Please read our refund and return policy
                  carefully before placing an order.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                  1. Digital Product Policy
                </h3>
                <p className="mb-6">
                  All products and services offered on BrandSync.lk are digital
                  in nature (such as social media engagement and view
                  campaigns). Once service delivery has begun, purchases are
                  considered non-refundable.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                  2. Refund Eligibility
                </h3>
                <p className="mb-4">You may request a refund if:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>
                    Your order was not delivered within the promised timeframe.
                  </li>
                  <li>
                    The delivered service significantly differs from the
                    description on our website.
                  </li>
                  <li>Payment was duplicated or charged incorrectly.</li>
                </ul>
                <p className="mb-6">
                  All refund requests must be made within 7 days of the
                  transaction.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                  3. Non-Refundable Situations
                </h3>
                <p className="mb-4">Refunds will not be provided if:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>The service has been partially or fully delivered.</li>
                  <li>
                    The delay was caused by customer inaction or misinformation.
                  </li>
                  <li>
                    Platform policy changes (TikTok, Instagram, Facebook) affect
                    the final result.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                  4. Refund Process
                </h3>
                <p className="mb-6">
                  If eligible, refunds will be processed within 7 business days
                  to your original payment method.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">Contact Us</h3>
                <p className="mb-6">
                  For any inquiries or refund requests:
                  <br />
                  📧{" "}
                  <a
                    href="mailto:support@brandsync.lk"
                    className="text-pink-500 hover:text-pink-600 transition-colors"
                  >
                    support@brandsync.lk
                  </a>
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Call to Action */}
          <motion.div variants={childVariants} className="text-center pt-8">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Have more questions about our policies?
            </p>
            <a
              href="mailto:support@brandsync.lk"
              className="inline-flex items-center justify-center px-8 py-3 font-medium transition-all duration-300 transform hover:-translate-y-0.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white"
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
