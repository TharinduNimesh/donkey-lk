"use client";

import { Button } from "./button";
import { useEffect, useState } from "react";
import Link from "next/link";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-4 left-0 right-0 z-50 mx-4 transition-all duration-300 ${
      scrolled ? "bg-background/80 backdrop-blur-lg shadow-lg" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto rounded-full px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            donkey.lk
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-foreground/80 hover:text-foreground">Features</Link>
            <Link href="#creators" className="text-foreground/80 hover:text-foreground">For Creators</Link>
            <Link href="#brands" className="text-foreground/80 hover:text-foreground">For Brands</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}