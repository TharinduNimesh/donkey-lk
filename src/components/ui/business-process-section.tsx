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
    title: "Setup Your Brand",
    description: "Create your brand profile and add payment methods. Define your brand guidelines and target audience demographics in minutes.",
    videoUrl: "/guide-videos/example.mp4",
  },
  {
    id: 2,
    number: "02",
    title: "Create a Campaign",
    description: "Choose your campaign type: video views, link clicks, or content posts. Set your budget, requirements, and payout structures.",
    videoUrl: "/guide-videos/example.mp4",
  },
  {
    id: 3,
    number: "03",
    title: "Creators Apply & Post",
    description: "Our vetted creators will discover your campaign and apply. They'll generate content following your guidelines and share it with their audience.",
    videoUrl: "/guide-videos/example.mp4",
  },
  {
    id: 4,
    number: "04",
    title: "Measure & Scale",
    description: "Watch the results roll in on your live dashboard. Track engagement, reach, and ROI in real-time, and easily scale up campaigns that perform best.",
    videoUrl: "/guide-videos/example.mp4",
  }
];

export function BusinessProcessSection() {
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
          playPromise.catch((error) => {
            console.log("Autoplay prevented:", error);
            setIsPlaying(false);
          });
        }
      }
    }
  }, [activeStep]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section id="how-it-works" className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold font-display text-gray-900 mb-4 tracking-tight">
          How It Works
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-light text-lg">
          Launch your first creator campaign in four simple steps.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 items-start relative">
        
        {/* Left Side: Steps */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4 relative z-10">
          {steps.map((step, index) => {
            const isActive = activeStep === index;
            
            return (
              <div 
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`p-6 md:p-8 rounded-[2rem] border transition-all duration-500 cursor-pointer ${
                  isActive 
                    ? 'bg-white border-pink-100 shadow-[0_20px_50px_rgba(236,72,153,0.08)] scale-[1.02] transform' 
                    : 'bg-transparent border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex gap-6 items-start">
                  <div className={`font-display text-4xl md:text-5xl font-black tracking-tighter transition-colors duration-500 ${
                    isActive ? 'text-pink-500' : 'text-gray-200'
                  }`}>
                    {step.number}
                  </div>
                  <div>
                    <h3 className={`text-xl md:text-2xl font-bold font-display mb-3 transition-colors duration-500 ${
                      isActive ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </h3>
                    <div className={`grid transition-all duration-500 ease-in-out ${
                      isActive ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'
                    }`}>
                      <div className="overflow-hidden">
                        <p className="text-gray-500 leading-relaxed font-light text-sm md:text-base">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Right Side: Video Player */}
        <div className="w-full lg:w-1/2 sticky top-32 lg:translate-x-4">
          <div className="relative aspect-[9/16] max-w-[360px] mx-auto lg:max-w-none lg:aspect-square w-full rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden bg-gray-900 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border-[8px] border-white group">
            
            {/* Video Element */}
            <video
              ref={videoRef}
              src={steps[activeStep].videoUrl}
              className="w-full h-full object-cover transition-opacity duration-500"
              loop
              muted={isMuted}
              playsInline
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 md:p-8">
              
              <div className="flex items-center justify-between w-full">
                {/* Play/Pause Button */}
                <button 
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors border border-white/30"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? (
                    <IconPlayerPauseFilled size={20} />
                  ) : (
                    <IconPlayerPlayFilled size={20} />
                  )}
                </button>
                
                {/* Volume Toggle */}
                <button 
                  onClick={toggleMute}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors border border-white/30"
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  {isMuted ? (
                    <IconVolumeOff size={20} />
                  ) : (
                    <IconVolume size={20} />
                  )}
                </button>
              </div>
              
              {/* Progress Bar (Visual only for effect) */}
              <div className="w-full h-1 bg-white/30 rounded-full mt-6 overflow-hidden">
                <div className="h-full bg-pink-500 w-1/3 rounded-full relative">
                  <div className="absolute right-0 top-0 w-2 h-2 bg-white rounded-full -translate-y-[2px] shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* Decorative blur behind video */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-pink-500/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
        </div>

      </div>
    </section>
  );
}
