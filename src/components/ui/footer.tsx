"use client";

import {
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  Mail,
  PhoneCall,
  MapPin,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "For Creators", href: "#creators" },
    { name: "For Brands", href: "#brands" },
    { name: "Success Stories", href: "#success-stories" },
    { name: "Blog", href: "#blog" },
    { name: "Contact", href: "#contact" },
  ];

  const resources = [
    { name: "Help Center", href: "/help" },
    { name: "Community Guidelines", href: "/guidelines" },
    { name: "Monetization Guide", href: "/monetization" },
    { name: "Brand Collaboration", href: "/collaboration" },
    { name: "Analytics & Reports", href: "/analytics" },
  ];

  const socialLinks = [
    {
      name: "Instagram",
      icon: InstagramIcon,
      href: "https://instagram.com/brandsync",
    },
    {
      name: "LinkedIn",
      icon: LinkedinIcon,
      href: "https://linkedin.com/brandsync",
    },
    {
      name: "Twitter",
      icon: TwitterIcon,
      href: "https://twitter.com/brandsync",
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      href: "https://facebook.com/brandsync",
    },
  ];

  return (
    <div className="relative bg-background py-4 mt-20">
      <footer className="relative mx-auto w-[95%] max-w-7xl rounded-3xl">
        {/* Gradient Border Container */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-pink-500/50 via-pink-600/25 to-pink-700/5" />
          <div className="absolute inset-[1px] rounded-3xl bg-background" />
        </div>

        {/* Content */}
        <div className="relative px-4 pt-12 pb-8 sm:px-6 lg:px-8 sm:pt-20 sm:pb-12">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Company Info */}
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center space-x-3">
                <Image
                  src="/logo.png"
                  alt="BrandSync Logo"
                  width={40}
                  height={40}
                  className="w-8 h-8 sm:w-10 sm:h-10"
                />
                <div className="text-2xl sm:text-3xl font-display font-bold ">
                  Brand
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600">
                    Sync
                  </span>
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-md">
                Connect with top brands, monetize your influence, and grow your
                audience. BrandSync is where creators and brands unite for
                authentic partnerships.
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:hello@brandsync.com"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">
                    hello@brandsync.com
                  </span>
                </a>
                <a
                  href="tel:+94771234567"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">+94 77 123 4567</span>
                </a>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">
                    Colombo, Sri Lanka
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links & Resources */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Quick Links
                  </h3>
                  <ul role="list" className="space-y-3 sm:space-y-4">
                    {quickLinks.map((link) => (
                      <li key={link.name}>
                        <a
                          href={link.href}
                          className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors duration-200"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="sm:mt-0">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Resources
                  </h3>
                  <ul role="list" className="space-y-3 sm:space-y-4">
                    {resources.map((resource) => (
                      <li key={resource.name}>
                        <a
                          href={resource.href}
                          className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors duration-200"
                        >
                          {resource.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Stay Connected
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Join our community and stay updated with latest opportunities
                </p>
                <form className="w-full">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 min-w-0 px-4 py-2 text-sm sm:text-base bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/20"
                    />
                    <button className="w-full sm:w-auto px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity">
                      Subscribe
                    </button>
                  </div>
                </form>
                <div className="mt-6 sm:mt-8">
                  <div className="flex flex-wrap gap-4 sm:gap-6">
                    {socialLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          className="text-muted-foreground hover:text-pink-500 transition-colors duration-200"
                        >
                          <span className="sr-only">{item.name}</span>
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
              <p className="text-sm sm:text-base text-muted-foreground order-2 sm:order-1">
                © {currentYear} BrandSync. All rights reserved.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground order-1 sm:order-2">
                <Link
                  href="/policies/privacy-policy"
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  Privacy Policy
                </Link>
                <span className="hidden sm:inline">•</span>
                <Link
                  href="/policies/terms-of-service"
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  Terms of Service
                </Link>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap">
                  Developed by{" "}
                  <a
                    href="https://eversoft.lk"
                    className="font-medium text-pink-500 hover:text-pink-600 transition-colors"
                  >
                    Eversoft IT
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
