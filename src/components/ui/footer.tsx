"use client";

import Link from "next/link";
import { 
  IconBrandYoutubeFilled, 
  IconBrandInstagram, 
  IconBrandTiktok, 
  IconBrandFacebookFilled 
} from "@tabler/icons-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-100 bg-[#fbfbfc] pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Socials Column */}
          <div className="lg:col-span-5 flex flex-col items-start">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 relative flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="BrandSync Logo"
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="text-xl font-bold font-display text-gray-900 tracking-tight">
                Brand<span className="text-pink-500">Sync</span>
              </span>
            </Link>
            
            <p className="text-sm text-gray-500 leading-relaxed font-light mb-8 max-w-sm">
              Sri Lanka's leading influencer monetization platform. Connecting authentic creators with top brands for high-performing, verified campaign reach.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#ff0000] hover:border-red-100 hover:bg-red-50 flex items-center justify-center transition-all duration-200"
              >
                <IconBrandYoutubeFilled size={18} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#e1306c] hover:border-pink-100 hover:bg-pink-50 flex items-center justify-center transition-all duration-200"
              >
                <IconBrandInstagram size={18} />
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-all duration-200"
              >
                <IconBrandTiktok size={18} />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#1877f2] hover:border-blue-100 hover:bg-blue-50 flex items-center justify-center transition-all duration-200"
              >
                <IconBrandFacebookFilled size={18} />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 w-full">
            
            {/* Column 1: Platform */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Platform</h4>
              <ul className="flex flex-col gap-3 text-sm font-light text-gray-600">
                <li>
                  <Link href="#how-it-works" className="hover:text-pink-500 transition-colors">How it Works</Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-pink-500 transition-colors">Join as Creator</Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-pink-500 transition-colors">Partner as Brand</Link>
                </li>
                <li>
                  <Link href="/withdraw" className="hover:text-pink-500 transition-colors">Withdrawals</Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Support */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Support</h4>
              <ul className="flex flex-col gap-3 text-sm font-light text-gray-600">
                <li>
                  <Link href="/support" className="hover:text-pink-500 transition-colors">Contact Support</Link>
                </li>
                <li>
                  <Link href="/brand-guidelines" className="hover:text-pink-500 transition-colors">Brand Guidelines</Link>
                </li>
                <li>
                  <Link href="/setup" className="hover:text-pink-500 transition-colors">Account Setup</Link>
                </li>
                <li>
                  <Link href="/policies/privacy-policy" className="hover:text-pink-500 transition-colors">Help Center</Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div className="flex flex-col gap-4 col-span-2 sm:col-span-1">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Legal</h4>
              <ul className="flex flex-col gap-3 text-sm font-light text-gray-600">
                <li>
                  <Link href="/policies/privacy-policy" className="hover:text-pink-500 transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/policies/terms-of-service" className="hover:text-pink-500 transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link href="/policies/privacy-policy" className="hover:text-pink-500 transition-colors">Cookie Policy</Link>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom Bar: Copyright & Powered by */}
        <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-light text-gray-400">
          <p>
            © {currentYear} BrandSync. All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            <span>Powered by</span>
            <a 
              href="https://eversoft.lk" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold text-gray-500 hover:text-pink-500 transition-colors tracking-wide"
            >
              Eversoft
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}
