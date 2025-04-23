"use client";

import { Header } from "@/components/ui/header";
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
              <span className="bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Terms of
              </span>{" "}
              Service
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Last Updated: April 23, 2025
            </p>
          </motion.div>

          {/* Introduction Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Introduction
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <p className="mb-6">
                  Welcome to BrandSync! These Terms of Service ("Terms") govern your use of BrandSync.lk, its related 
                  applications, features, and services (collectively referred to as the "Platform"). By accessing or using 
                  our Platform, you agree to be bound by these Terms. If you do not agree with any part of these Terms, 
                  you may not use our Platform.
                </p>
                <p className="mb-6">
                  BrandSync operates as an intermediary platform connecting Influencers and Brands (collectively referred to 
                  as "Users"). These Terms constitute a legally binding agreement between you and BrandSync.lk, whether you 
                  are a registered user or just browsing our Platform.
                </p>
                <p className="mb-6">
                  Please read these Terms carefully as they contain important information regarding your legal rights, 
                  remedies, and obligations.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Definitions Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Definitions
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <ul className="list-disc pl-6 space-y-4 mb-6">
                  <li><strong>"Platform"</strong> refers to BrandSync.lk, its websites, applications, and all related services.</li>
                  <li><strong>"Influencer"</strong> refers to users who promote Brands' content and services through their social media accounts.</li>
                  <li><strong>"Brand"</strong> or <strong>"Buyer"</strong> refers to users who seek promotion and engagement for their content through Influencers on our Platform.</li>
                  <li><strong>"Campaign"</strong> refers to any promotional activity created by a Brand for Influencers to participate in.</li>
                  <li><strong>"Content"</strong> refers to any text, images, videos, graphics, or other materials uploaded, shared, or created on the Platform.</li>
                  <li><strong>"Payment"</strong> refers to the financial compensation provided to Influencers for their services.</li>
                </ul>
              </div>
            </Card>
          </motion.section>

          {/* Account Registration Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Account Registration & Eligibility
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold mt-6 mb-4">1. Registration Requirements</h3>
                <p className="mb-4">
                  To use BrandSync services, you must create an account with accurate and complete information. You are responsible 
                  for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
                
                <h3 className="text-xl font-semibold mt-8 mb-4">2. Eligibility</h3>
                <p className="mb-4">By using BrandSync, you represent and warrant that:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>You are at least 18 years of age or have legal parental/guardian consent.</li>
                  <li>You have the right, authority, and capacity to enter into these Terms.</li>
                  <li>You will use the Platform in accordance with all applicable laws and regulations.</li>
                  <li>You are not prohibited from receiving services under the laws of Sri Lanka or other applicable jurisdictions.</li>
                </ul>
                
                <h3 className="text-xl font-semibold mt-8 mb-4">3. Account Verification</h3>
                <p className="mb-6">
                  BrandSync may require verification of your identity and/or your social media accounts. You agree to provide any 
                  requested information for verification purposes. We reserve the right to deny or revoke access to any user who 
                  fails to meet our verification standards.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Platform Rules Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Platform Rules & User Conduct
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <p className="mb-4">As a BrandSync user, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>Provide accurate information about yourself and your social media accounts.</li>
                  <li>Comply with all applicable laws and regulations when using our Platform.</li>
                  <li>Respect other users' rights, including intellectual property rights.</li>
                  <li>Not engage in any activities that could harm, disable, or overburden the Platform.</li>
                  <li>Not attempt to access areas of the Platform that you are not authorized to access.</li>
                  <li>Not use the Platform for fraudulent or deceptive practices.</li>
                  <li>Not post content that is illegal, harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable.</li>
                </ul>
                
                <h3 className="text-xl font-semibold mt-8 mb-4">Prohibited Content</h3>
                <p className="mb-4">You may not use our Platform to promote:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>Content that violates any applicable laws or regulations.</li>
                  <li>Adult content, pornography, or sexually explicit material.</li>
                  <li>Illegal drugs, substances, or paraphernalia.</li>
                  <li>Weapons, ammunition, or explosives.</li>
                  <li>Content that promotes hatred, violence, or discrimination.</li>
                  <li>Gambling services without proper licensing.</li>
                  <li>Content that infringes on others' intellectual property rights.</li>
                </ul>
              </div>
            </Card>
          </motion.section>

          {/* Influencer Terms Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Influencer Terms
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold mt-6 mb-4">1. Service Provision</h3>
                <p className="mb-6">
                  As an Influencer, you agree to provide the promotional services specified in the campaigns you accept, 
                  following all guidelines and requirements set forth by the Brand and BrandSync.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">2. Performance Standards</h3>
                <p className="mb-6">
                  Influencers must complete campaigns according to the agreed-upon specifications, including content type, 
                  posting schedule, and engagement requirements. Failure to meet these standards may result in non-payment, 
                  account penalties, or termination.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">3. Social Media Account Requirements</h3>
                <p className="mb-6">
                  You warrant that any social media accounts linked to BrandSync are owned and operated by you, comply with 
                  the respective platforms' terms of service, and accurately represent your follower count and engagement metrics.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">4. Payment Terms</h3>
                <p className="mb-6">
                  You will receive payment for successfully completed campaigns as specified in the campaign details. BrandSync 
                  reserves the right to withhold payment for incomplete, fraudulent, or non-compliant campaign activities.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Brand Terms Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Brand/Buyer Terms
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold mt-6 mb-4">1. Campaign Creation & Management</h3>
                <p className="mb-6">
                  As a Brand, you are responsible for creating clear campaign briefs with specific requirements and expectations. 
                  You must provide appropriate content and guidelines for Influencers to successfully promote your brand.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">2. Payment Obligations</h3>
                <p className="mb-6">
                  Brands must provide sufficient funds before launching campaigns. You authorize BrandSync to disburse funds 
                  to Influencers upon satisfactory completion of campaign requirements.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">3. Content Ownership</h3>
                <p className="mb-6">
                  You warrant that you have all necessary rights to the content provided for campaigns. You grant Influencers 
                  limited rights to use your content for the specific purpose of completing the campaign.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">4. Campaign Review</h3>
                <p className="mb-6">
                  Brands must review and approve or reject Influencer submissions within the timeframe specified in the 
                  campaign brief. Failure to review within the specified timeframe may result in automatic approval and payment.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Fees and Payments Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Fees & Payments
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold mt-6 mb-4">1. Platform Fees</h3>
                <p className="mb-6">
                  BrandSync charges service fees for facilitating connections between Brands and Influencers. These fees are 
                  clearly displayed before transaction completion. We reserve the right to modify our fee structure with 
                  reasonable notice.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">2. Payment Processing</h3>
                <p className="mb-6">
                  All payments are processed through our secure payment partners. By using our Platform, you agree to 
                  comply with the terms and conditions of our payment processors.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">3. Taxes</h3>
                <p className="mb-6">
                  Users are solely responsible for all taxes and reporting requirements related to income earned through 
                  BrandSync. We may provide tax documentation where required by law, but users remain responsible for proper 
                  tax filing and compliance.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">4. Currency</h3>
                <p className="mb-6">
                  All transactions on BrandSync are processed in Sri Lankan Rupees (LKR) unless otherwise specified. 
                  International users may be subject to currency conversion fees by their payment providers.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Intellectual Property Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Intellectual Property Rights
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold mt-6 mb-4">1. BrandSync Intellectual Property</h3>
                <p className="mb-6">
                  The Platform, including its logo, name, design, software, and content created by BrandSync, is protected by 
                  intellectual property laws. You may not use, reproduce, or distribute our intellectual property without 
                  explicit written permission.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">2. User-Generated Content</h3>
                <p className="mb-6">
                  You retain ownership of content you create and upload to BrandSync. However, you grant BrandSync a non-exclusive, 
                  worldwide, royalty-free license to use, reproduce, modify, and display your content for the purpose of operating 
                  and promoting the Platform.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">3. Campaign Content</h3>
                <p className="mb-6">
                  Unless explicitly agreed otherwise in writing, Influencers retain copyright ownership of content they create 
                  for campaigns, while granting Brands a license to use such content as specified in the campaign agreement.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">4. Infringement Claims</h3>
                <p className="mb-6">
                  If you believe your intellectual property rights have been infringed upon, please contact us at 
                  legal@brandsync.lk with detailed information about the alleged infringement.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Liability and Disclaimers Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Liability & Disclaimers
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold mt-6 mb-4">1. Limitation of Liability</h3>
                <p className="mb-6">
                  To the maximum extent permitted by law, BrandSync shall not be liable for any indirect, incidental, special, 
                  consequential, or punitive damages arising out of or relating to your use of our Platform.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">2. No Warranty</h3>
                <p className="mb-6">
                  The Platform is provided on an "as is" and "as available" basis without warranties of any kind, either 
                  express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, 
                  or non-infringement.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">3. Intermediary Status</h3>
                <p className="mb-6">
                  BrandSync acts solely as an intermediary platform connecting Brands and Influencers. We do not guarantee 
                  campaign results, including views, engagement, or conversion rates.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">4. Indemnification</h3>
                <p className="mb-6">
                  You agree to indemnify and hold BrandSync harmless from any claims, damages, liabilities, costs, or expenses 
                  arising out of your use of the Platform, your violation of these Terms, or your infringement of any rights 
                  of another person or entity.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Term and Termination Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Term & Termination
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold mt-6 mb-4">1. Term</h3>
                <p className="mb-6">
                  These Terms will remain in full force and effect while you use the Platform or maintain an account with us.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">2. Termination by You</h3>
                <p className="mb-6">
                  You may terminate your account at any time by following the instructions on the Platform or by contacting 
                  our support team. Termination may be subject to the completion of ongoing campaigns or payment obligations.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">3. Termination by BrandSync</h3>
                <p className="mb-6">
                  BrandSync reserves the right to suspend or terminate your account at any time for violations of these Terms, 
                  fraud, illegal activity, or any other reason we deem appropriate. We will make reasonable efforts to notify 
                  you of termination.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">4. Effect of Termination</h3>
                <p className="mb-6">
                  Upon termination, your right to use the Platform will immediately cease. All provisions that by their nature 
                  should survive termination shall survive, including intellectual property rights, warranties, indemnities, 
                  and limitations of liability.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Modifications to Terms Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Modifications to Terms
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <p className="mb-6">
                  BrandSync reserves the right to modify or replace these Terms at any time. We will provide notice of material 
                  changes by posting the updated Terms on our Platform and updating the "Last Updated" date at the top of this page.
                </p>
                <p className="mb-6">
                  Your continued use of the Platform after any such changes constitutes your acceptance of the new Terms. If you 
                  do not agree to the new Terms, you must stop using the Platform.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Contact Information Section */}
          <motion.section variants={childVariants}>
            <Card className="p-6 md:p-8 border border-pink-100/50 dark:border-pink-900/50 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Contact Information
              </h2>
              
              <div className="prose prose-pink dark:prose-invert max-w-none">
                <p className="mb-6">
                  If you have any questions about these Terms, please contact us at:
                </p>
                <ul className="list-none space-y-2 mb-6">
                  <li><strong>Email:</strong> <a href="mailto:legal@brandsync.lk" className="text-pink-500 hover:text-pink-600 transition-colors">legal@brandsync.lk</a></li>
                  <li><strong>Address:</strong> BrandSync Head Office, Colombo, Sri Lanka</li>
                </ul>
              </div>
            </Card>
          </motion.section>

          {/* Call to Action */}
          <motion.div variants={childVariants} className="text-center pt-8">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Have questions about our Terms of Service?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="mailto:legal@brandsync.lk"
                className="inline-flex items-center justify-center px-8 py-3 font-medium transition-all duration-300 transform hover:-translate-y-0.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white"
              >
                Contact Legal Team
              </a>
              <Link
                href="/policies/privacy-policy"
                className="inline-flex items-center justify-center px-8 py-3 font-medium transition-all duration-300 transform hover:-translate-y-0.5 rounded-full bg-background border border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 text-foreground"
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