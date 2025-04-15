"use client";

import { Cover } from "@/components/ui/cover";
import { SparklesCore } from "@/components/ui/sparkles";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FancyText } from "./fancy-text";

const featuredPeople = [
  {
    id: 1,
    name: "Sarah Johnson",
    designation: "Beauty & Lifestyle | 2M+ Followers",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80",
  },
  {
    id: 2,
    name: "Nike",
    designation: "Global Sports Brand",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80",
  },
  {
    id: 3,
    name: "Alex Rivera",
    designation: "Tech Reviews | 1.5M+ Followers",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80",
  },
  {
    id: 4,
    name: "Green Earth",
    designation: "Sustainable Living Brand",
    image: "https://images.unsplash.com/photo-1505489435671-80a165c60816?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80",
  },
  {
    id: 5,
    name: "Emma Chen",
    designation: "Food & Travel | 3M+ Followers",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80",
  },
];

export function HeroSection() {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full dark:opacity-20 opacity-10">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="h-full w-full"
          particleColor="#ec4899"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight font-display">
            Where <Cover className="text-pink-500">Creators</Cover> and{" "}
            <Cover className="text-pink-500">Brands</Cover> <FancyText>Unite</FancyText>
          </h1>
          <span className="block text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with top brands, monetize your influence, and grow your audience through{" "}
            <Cover className="text-pink-500">BrandSync</Cover>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button className="group relative inline-flex items-center justify-center px-8 py-3 font-medium transition-all duration-300 transform hover:-translate-y-0.5 rounded-full">
            <span className="relative z-10 text-white">Get Started</span>
            <div className="absolute inset-0 bg-pink-600 rounded-full">
              <div className="absolute inset-0 flex justify-center [container-type:inline-size]">
                <div className="w-[100cqw] aspect-square absolute blur-2xl -z-10 animate-spin-slower rounded-full bg-pink-500/20"></div>
              </div>
            </div>
            <span className="absolute -inset-0.5 -z-10 rounded-full bg-gradient-to-br from-[#ff80b5] to-[#9089fc] opacity-30 group-hover:opacity-50 transition duration-300"></span>
          </button>

          <button className="group relative inline-flex items-center justify-center px-8 py-3 font-medium transition-all duration-300 transform hover:-translate-y-0.5 rounded-full">
            <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-pink-400">Learn More</span>
            <div className="absolute inset-0 border border-pink-200 dark:border-pink-800 rounded-full">
              <div className="absolute inset-0 flex justify-center [container-type:inline-size]">
                <div className="w-[100cqw] aspect-square absolute blur-md -z-10 animate-spin-slow rounded-full bg-pink-500/5"></div>
              </div>
            </div>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-muted-foreground">Join our growing community of creators and brands</p>
          <div className="flex flex-row items-center justify-center w-full">
            <AnimatedTooltip items={featuredPeople} />
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          y: [0, 8, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer group"
      >
        <div className="relative">
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-lg group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all duration-300" />
          <div className="relative rounded-full bg-white/10 backdrop-blur-sm border border-white/20 p-2 transition-all duration-300 group-hover:border-pink-500/50">
            <ChevronDown 
              size={24} 
              className="text-white/70 group-hover:text-pink-400 transition-colors duration-300"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}