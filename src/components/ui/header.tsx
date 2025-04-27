"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from "./resizable-navbar";
import { Button } from "./button";

const navItems = [
  {
    name: "For Creators",
    link: "/auth",
  },
  {
    name: "For Brands",
    link: "/auth",
  },
  {
    name: "About Us",
    link: "#features",
  },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Navbar>
        <NavBody>
          <Link
            href="/"
            className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-xl font-bold"
          >
            <div className="h-8 w-8 relative">
              <img
                src="/logo.png"
                alt="BrandSync Logo"
                className="object-contain"
                width={32}
                height={32}
              />
            </div>
            <div>
              Brand
              <span className="bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Sync
              </span>
            </div>
          </Link>

          <NavItems items={navItems} />

          <div className="relative z-20 flex items-center space-x-4">
            <Link href="/auth" legacyBehavior>
              <NavbarButton
                as="a"
                variant="secondary"
                className="group relative inline-flex items-center justify-center px-8 py-3 font-medium transition-all duration-300 transform hover:-translate-y-0.5 rounded-full"
              >
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-pink-400">
                  Sign In
                </span>
                <div className="absolute inset-0 border border-pink-200 dark:border-pink-800 rounded-full">
                  <div className="absolute inset-0 flex justify-center [container-type:inline-size]">
                    <div className="w-[100cqw] aspect-square absolute blur-md -z-10 animate-spin-slow rounded-full bg-pink-500/5"></div>
                  </div>
                </div>
              </NavbarButton>
            </Link>
            <Link href="/auth/signup" legacyBehavior>
              <NavbarButton
                as="a"
                variant="dark"
                className="group relative inline-flex items-center justify-center px-8 py-3 font-medium transition-all duration-300 transform hover:-translate-y-0.5 rounded-full"
              >
                <span className="relative z-10 text-white">Get Started</span>
                <div className="absolute inset-0 bg-pink-600 rounded-full">
                  <div className="absolute inset-0 flex justify-center [container-type:inline-size]">
                    <div className="w-[100cqw] aspect-square absolute blur-2xl -z-10 animate-spin-slower rounded-full bg-pink-500/20"></div>
                  </div>
                </div>
                <span className="absolute -inset-0.5 -z-10 rounded-full bg-gradient-to-br from-[#ff80b5] to-[#9089fc] opacity-30 group-hover:opacity-50 transition duration-300"></span>
              </NavbarButton>
            </Link>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <Link
              href="/"
              className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-xl font-bold"
            >
              <div className="h-8 w-8 relative">
                <img
                  src="/logo.png"
                  alt="BrandSync Logo"
                  className="object-contain"
                  width={32}
                  height={32}
                />
              </div>
              <div>
                Brand
                <span className="bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                  Sync
                </span>
              </div>
            </Link>
            <MobileNavToggle
              isOpen={isOpen}
              onClick={() => setIsOpen(!isOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <div className="flex w-full flex-col space-y-4">
              {navItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.link}
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-full px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-3 pt-4">
                <Link href="/auth" legacyBehavior>
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-950"
                  >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-pink-400">
                      Sign In
                    </span>
                  </Button>
                </Link>
                <Link href="/auth" legacyBehavior>
                  <Button className="w-full rounded-full bg-pink-600 hover:bg-pink-500">
                    <span className="text-white">Get Started</span>
                  </Button>
                </Link>
              </div>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </>
  );
}
