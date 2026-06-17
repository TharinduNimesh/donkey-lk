"use client";

import { useState, useRef, useEffect } from "react";
import { 
  IconPlayerPlayFilled, 
  IconPlayerPauseFilled, 
  IconVolume, 
  IconVolumeOff 
} from "@tabler/icons-react";

interface Step {
  id: number;
  number: string;
  title: string;
  description: string;
  videoUrl: string;
}

const steps: Step[] = [
  {
    id: 1,
    number: "01",
    title: "Sign up & Link Socials",
    description: "Create your profile in seconds and securely connect your Instagram, TikTok, YouTube or Facebook accounts to start verifying your reach.",
    videoUrl: "/guide-videos/example.mp4",
  },
  {
    id: 2,
    number: "02",
    title: "Browse & Apply",
    description: "Explore our campaign catalog. Filter by video views, link sharing, or content sharing. Find tasks matching your niche and apply instantly.",
    videoUrl: "/guide-videos/example.mp4",
  },
  {
    id: 3,
    number: "03",
    title: "Post Content",
    description: "Create your video, share a tracking link, or post brand creatives on your feed. Follow the clear guidelines to ensure successful submission.",
    videoUrl: "/guide-videos/example.mp4",
  },
  {
    id: 4,
    number: "04",
    title: "Get Paid",
    description: "Track your views, clicks, and submissions on your live dashboard. Receive direct, guaranteed payouts based on your verified performance.",
    videoUrl: "/guide-videos/example.mp4",
  }
];

export function ProcessSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Browser autoplay prevention
            setIsPlaying(false);
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [activeStep]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="how-it-works">
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold font-display text-gray-900 mb-4 tracking-tight">
          How It Works
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-light text-lg">
          Start monetizing your audience in four simple steps.
        </p>
      </div>

      <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left: Steps Timeline List */}
        <div className="w-full lg:col-span-7 flex flex-col gap-4">
          {steps.map((step, index) => {
            const isActive = index === activeStep;
            return (
              <div 
                key={step.id} 
                onClick={() => {
                  setActiveStep(index);
                  setIsPlaying(true);
                }}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-5 items-start ${
                  isActive 
                    ? "bg-white border-pink-100 shadow-[0_8px_30px_rgba(236,72,153,0.04)]" 
                    : "bg-transparent border-transparent hover:bg-gray-50/50"
                }`}
              >
                {/* Step badge */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold font-sans text-sm transition-colors shrink-0 ${
                  isActive 
                    ? "bg-pink-500 text-white shadow-[0_4px_12px_rgba(236,72,153,0.3)]" 
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {step.number}
                </div>

                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className={`text-lg font-bold transition-colors ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                      {step.title}
                    </h3>
                    
                    {/* Play/Pause Button on Step */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStep(index);
                        if (isActive) {
                          if (videoRef.current) {
                            if (isPlaying) {
                              videoRef.current.pause();
                              setIsPlaying(false);
                            } else {
                              videoRef.current.play().catch(() => {});
                              setIsPlaying(true);
                            }
                          }
                        } else {
                          setIsPlaying(true);
                        }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isActive 
                          ? "bg-pink-50 text-pink-500 hover:bg-pink-100/70" 
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                      }`}
                    >
                      {isActive && isPlaying ? <IconPlayerPauseFilled size={14} /> : <IconPlayerPlayFilled size={14} />}
                    </button>
                  </div>
                  
                  <p className={`text-sm leading-relaxed font-light transition-all ${
                    isActive ? "text-gray-500 font-normal" : "text-gray-400"
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: 1:1 Video Player Container */}
        <div className="w-full lg:col-span-5 flex justify-center">
          <div className="relative aspect-square w-full max-w-[400px] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-gray-50/50 flex items-center justify-center group">
            <video 
              ref={videoRef}
              key={steps[activeStep].videoUrl}
              className="w-full h-full object-cover aspect-square"
              loop
              muted={isMuted}
              playsInline
              autoPlay
            >
              <source src={steps[activeStep].videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Hover Video Overlay */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

            {/* Mute Control */}
            <button 
              onClick={handleMute} 
              className="absolute bottom-5 right-5 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-pink-500/90 hover:scale-105 flex items-center justify-center text-white backdrop-blur-sm cursor-pointer transition-all duration-200"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <IconVolumeOff size={18} /> : <IconVolume size={18} />}
            </button>
            
            {/* Center Play/Pause Control overlay */}
            <button 
              onClick={handlePlayPause}
              className="absolute inset-0 m-auto z-20 w-14 h-14 rounded-full bg-white/95 text-gray-900 shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 hover:bg-[#ff1b6b] hover:text-white"
            >
              {isPlaying ? <IconPlayerPauseFilled size={20} /> : <IconPlayerPlayFilled size={20} className="ml-0.5" />}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
