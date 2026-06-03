import React from "react";
import { motion } from "framer-motion";
import { Check, DollarSign, ExternalLink } from "lucide-react";
import { formatDateToNow } from "@/lib/utils";
import { formatViewCount, parseViewCount } from "@/lib/utils/views";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Database } from "@/types/database.types";
import { PlatformIcon } from "./platform-icon";

type TaskApplication = Database["public"]["Tables"]["task_applications"]["Row"] & {
  application_promises: Database["public"]["Tables"]["application_promises"]["Row"][];
};

type InfluencerProfile = Database["public"]["Tables"]["influencer_profile"]["Row"];

interface ExistingApplicationCardProps {
  application: TaskApplication;
  existingProofs?: Record<string, Array<{
    type: Database["public"]["Enums"]["ProofType"];
    content: string;
    status?: Database["public"]["Enums"]["ProofStatus"];
    reviewedAt?: string | null;
  }>>;
  proofUrls?: Record<string, string>;
  verifiedProfiles?: InfluencerProfile[];
}

export function ExistingApplicationCard({ 
  application,
  existingProofs = {},
  proofUrls = {},
  verifiedProfiles = []
}: ExistingApplicationCardProps) {
  // Currency: 1 USD = NEXT_PUBLIC_LKR_PER_USD LKR
  const LKR_PER_USD = Number(process.env.NEXT_PUBLIC_LKR_PER_USD ?? "295");
  const LKR_TO_USD = 1 / (LKR_PER_USD || 295);
  const formatUSD = (lkrAmount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(lkrAmount * LKR_TO_USD);

  const calculateTotalEarnings = (application: TaskApplication) => {
    return application.application_promises.reduce(
      (total, promise) => total + parseFloat(promise.est_profit), 0
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md overflow-hidden shadow-sm relative">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600" />
        
        <CardHeader className="py-3 px-4 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/20 dark:bg-gray-900/10">
          <div className="flex items-center justify-between gap-2.5">
            <div>
              <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">Active Application</CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground mt-0.5">Applied {formatDateToNow(application.created_at)}</CardDescription>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <Badge className="pointer-events-none select-none bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 border border-emerald-100 dark:border-emerald-900/30 rounded-full font-bold text-[9px] uppercase tracking-wider leading-none shadow-3xs">
                Active
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
              {application.application_promises.map((promise, index) => {
                const platformProofs = existingProofs[promise.platform] || [];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    whileHover={{ y: -1 }}
                  >
                    <Card className="border border-pink-100 dark:border-pink-900/20 bg-pink-50/5 dark:bg-pink-950/5 hover:border-pink-200 dark:hover:border-pink-900/40 transition-all duration-300 h-full shadow-3xs hover:shadow-2xs flex flex-col justify-between">
                      <CardContent className="py-2.5 px-3 space-y-2 flex flex-col justify-between h-full">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {(() => {
                              const platformProfiles = verifiedProfiles.filter(p => p.platform === promise.platform);
                              const isVerified = platformProfiles.length > 0;
                              return (
                                <>
                                  {isVerified && platformProfiles.length > 0 ? (
                                    <div className="relative shrink-0">
                                      <div className="flex -space-x-2 overflow-hidden">
                                        {platformProfiles.slice(0, 3).map((prof) => (
                                          <div key={prof.id} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[9px] font-bold overflow-hidden border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-850 shadow-3xs">
                                            {prof.profile_pic ? (
                                              <img src={prof.profile_pic} alt={prof.name} className="w-full h-full object-cover" />
                                            ) : (
                                              <span className="text-gray-500 font-bold">{prof.name?.charAt(0).toUpperCase()}</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      <div className="absolute -bottom-1 -right-1 rounded-full border border-white dark:border-gray-900 shadow-3xs overflow-hidden z-10">
                                        <PlatformIcon platform={promise.platform} size="xs" />
                                      </div>
                                    </div>
                                  ) : (
                                    <PlatformIcon platform={promise.platform} size="sm" />
                                  )}
                                  <div className="min-w-0">
                                    <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate uppercase tracking-wider leading-none">{promise.platform}</h3>
                                    {isVerified && (
                                      <p className="text-[9px] text-pink-600 dark:text-pink-400 truncate font-bold mt-1.5 leading-none">
                                        {platformProfiles.length === 1 
                                          ? platformProfiles[0].name 
                                          : platformProfiles.length === 2 
                                            ? `${platformProfiles[0].name}, ${platformProfiles[1].name}` 
                                            : `${platformProfiles[0].name} + ${platformProfiles.length - 1} more`
                                        }
                                      </p>
                                    )}
                                    <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                                      <span className="font-bold text-pink-600 dark:text-pink-400">
                                        {formatViewCount(parseViewCount(promise.promised_reach))}
                                      </span> views promised
                                    </p>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
 
                          {/* Render Uploaded Proofs & Statuses */}
                          {platformProofs.length > 0 && (
                            <div className="pt-2 border-t border-gray-100/60 dark:border-gray-800/30 space-y-1.5">
                              <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Submitted Proofs</p>
                              <div className="space-y-1.5">
                                {platformProofs.map((proof, pIdx) => {
                                  const isUrl = proof.type === 'URL';
                                  const fileUrl = isUrl ? proof.content : proofUrls[proof.content];
                                  return (
                                    <div key={pIdx} className="flex items-center justify-between text-[10px] bg-white/50 dark:bg-gray-900/50 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800/40 gap-2 min-w-0">
                                      {fileUrl ? (
                                        <a 
                                          href={fileUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-pink-600 dark:text-pink-400 hover:underline truncate flex items-center gap-1 font-semibold select-none min-w-0 max-w-[100px]"
                                        >
                                          {isUrl ? '🔗 Link' : '📷 Screen'}
                                          <ExternalLink className="h-2 w-2 shrink-0" />
                                        </a>
                                      ) : (
                                        <span className="text-muted-foreground truncate max-w-[100px] font-medium">
                                          {isUrl ? '🔗 Link' : '📷 Screen'}
                                        </span>
                                      )}
                                      
                                      <span className={`
                                        text-[8px] font-bold px-1.5 py-0.2 rounded-full select-none uppercase shrink-0
                                        ${proof.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : ''}
                                        ${proof.status === 'REJECTED' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' : ''}
                                        ${!proof.status || proof.status === 'UNDER_REVIEW' ? 'bg-gray-100 text-gray-700 dark:bg-gray-850 dark:text-gray-300' : ''}
                                      `}>
                                        {proof.status === 'UNDER_REVIEW' ? 'Reviewing' : proof.status || 'Pending'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
 
                        <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800/80 flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider leading-none">Est. Earnings</span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatUSD(parseFloat(promise.est_profit))}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
 
            <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-500/5 dark:via-teal-500/0 border border-emerald-500/20 dark:border-emerald-500/10 shadow-3xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-3xs shrink-0">
                  <DollarSign className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-855 dark:text-emerald-400">Total Potential Earnings</span>
                  <p className="text-[9px] text-muted-foreground leading-none mt-0.5">Based on your promises</p>
                </div>
              </div>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                {formatUSD(calculateTotalEarnings(application))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

