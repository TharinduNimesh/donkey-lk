"use client";

import * as React from "react";
import {
  UserIcon,
  Sparkles,
  DollarSign,
  BarChart,
  Handshake,
  LucideIcon,
} from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { FancyText } from "./fancy-text";

type Step = {
  title: string;
  description: string;
  icon: LucideIcon;
  area: string;
};

const steps: Step[] = [
  {
    title: "Create Your Profile",
    description:
      "Set up your profile as a creator or brand. Showcase your niche, audience metrics, and past achievements.",
    icon: UserIcon,
    area: "md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]",
  },
  {
    title: "Smart AI Matching",
    description:
      "Our AI matches creators with the perfect brands based on audience alignment and campaign goals.",
    icon: Sparkles,
    area: "md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]",
  },
  {
    title: "Seamless Collaboration",
    description:
      "Connect and collaborate effortlessly. Manage content approvals and campaign progress in real-time.",
    icon: Handshake,
    area: "md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]",
  },
  {
    title: "Track Performance",
    description:
      "Access detailed analytics and insights to measure campaign success and engagement metrics.",
    icon: BarChart,
    area: "md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]",
  },
  {
    title: "Secure Payments",
    description:
      "Automated payment system ensures creators get paid on time while brands maintain transparent records.",
    icon: DollarSign,
    area: "md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]",
  },
];

export function ProcessSection() {
  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="relative overflow-hidden rounded-full px-4 py-1.5 bg-gradient-to-r from-pink-500/10 to-pink-600/10 backdrop-blur-sm border border-pink-500/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,0,255,0.05),transparent_70%)]"></div>
              <div className="flex items-center gap-1.5">
                <Sparkles
                  className="h-3.5 w-3.5 text-pink-500/80"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium tracking-wide text-pink-600/80 dark:text-pink-400/90">
                  SIMPLIFY COLLABORATION
                </span>
              </div>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            How Brand<span className="text-pink-500">Sync</span>{" "}
            <FancyText>Works</FancyText>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our community of creators and brands in four simple steps. Our
            platform makes collaboration seamless and rewarding.
          </p>
        </div>

        {/* Process Grid */}
        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-6 xl:max-h-[40rem] xl:grid-rows-2">
          {steps.map((step, index) => (
            <GridItem
              key={index}
              area={step.area}
              icon={<step.icon />}
              title={step.title}
              description={step.description}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactElement;
  title: string;
  description: string;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border border-border/40 dark:border-border/20 p-2 md:rounded-3xl md:p-3 backdrop-blur-sm">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          variant="default"
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 [box-shadow:0_0_0_1px_rgba(0,0,0,0.03)] dark:[box-shadow:0_0_0_1px_rgba(255,255,255,0.03)]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-pink-200/20 dark:border-pink-500/20 bg-pink-50/50 dark:bg-pink-950/50 p-2.5">
              {React.isValidElement(icon) &&
                React.cloneElement(icon, {
                  className: "w-5 h-5 text-pink-500",
                  "aria-hidden": "true",
                } as React.SVGProps<SVGSVGElement>)}
            </div>
            <div className="space-y-3">
              <h3 className="font-display text-xl/[1.375rem] font-semibold text-balance md:text-2xl/[1.875rem]">
                {title}
              </h3>
              <p className="text-sm/[1.125rem] text-muted-foreground md:text-base/[1.375rem]">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
