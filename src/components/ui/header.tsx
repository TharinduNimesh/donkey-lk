"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? "bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)]" 
        : "bg-transparent"
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${
          scrolled ? "h-16" : "h-20"
        }`}>
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
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
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`text-sm font-medium pb-1 transition-colors ${
                pathname === "/" || pathname === "/for-creators" 
                  ? "text-pink-500 border-b-2 border-pink-500" 
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent"
              }`}
            >
              For Creators
            </Link>
            <Link 
              href="/for-businesses" 
              className={`text-sm font-medium pb-1 transition-colors ${
                pathname === "/for-businesses" 
                  ? "text-pink-500 border-b-2 border-pink-500" 
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent"
              }`}
            >
              For Businesses
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              How it Works
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/auth" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/auth/signup" className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-bold tracking-wide text-white hover:bg-pink-600 transition-colors shadow-sm">
              Sign Up
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white absolute top-16 left-0 w-full shadow-lg border-t border-gray-100">
          <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
              <Link 
                href="/" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === "/" || pathname === "/for-creators"
                    ? "bg-pink-50 text-pink-500"
                    : "text-gray-900 hover:bg-gray-50 hover:text-gray-900"
                }`}
                onClick={() => setIsOpen(false)}
              >
                For Creators
              </Link>
              <Link 
                href="/for-businesses" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === "/for-businesses"
                    ? "bg-pink-50 text-pink-500"
                    : "text-gray-900 hover:bg-gray-50 hover:text-gray-900"
                }`}
                onClick={() => setIsOpen(false)}
              >
                For Businesses
              </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium py-2" onClick={() => setIsOpen(false)}>
              How it Works
            </Link>
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/auth" className="text-center text-gray-600 font-medium py-2 border border-gray-200 rounded-full" onClick={() => setIsOpen(false)}>
                Login
              </Link>
              <Link href="/auth/signup" className="text-center rounded-full bg-pink-500 px-6 py-2.5 font-bold tracking-wide text-white shadow-sm" onClick={() => setIsOpen(false)}>
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
