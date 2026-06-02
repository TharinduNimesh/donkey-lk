import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Database } from "@/types/database.types";
import { formatViewCount, parseViewCount } from "@/lib/utils/views";
import { ProofUpload } from "@/components/ui/proof-upload";
import { Badge } from "@/components/ui/badge";
import { Upload, HelpCircle } from "lucide-react";
import { PlatformIcon } from "./platform-icon";

type TaskApplication = Database["public"]["Tables"]["task_applications"]["Row"] & {
  application_promises: Database["public"]["Tables"]["application_promises"]["Row"][];
};

interface ProofSubmissionSectionProps {
  application: TaskApplication;
  existingProofs: Record<string, Array<{
    type: Database["public"]["Enums"]["ProofType"];
    content: string;
    status?: Database["public"]["Enums"]["ProofStatus"];
    reviewedAt?: string | null;
  }>>;
  selectedProofs: Record<string, Array<{
    type: Database["public"]["Enums"]["ProofType"];
    content: string;
  }>>;
  proofUrls: Record<string, string>;
  onProofAdd: (platform: string, type: Database["public"]["Enums"]["ProofType"], content: string) => void;
  onProofRemove: (platform: string, index: number) => void;
  onProofSubmit: () => void;
  isLoading: boolean;
}

export function ProofSubmissionSection({
  application,
  existingProofs,
  selectedProofs,
  proofUrls,
  onProofAdd,
  onProofRemove,
  onProofSubmit,
  isLoading
}: ProofSubmissionSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm relative">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-pink-500 to-purple-600" />
        
        <CardHeader className="py-3 px-4 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/20 dark:bg-gray-900/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Submit Campaign Proofs
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
                Provide evidence of your campaign performance below (URLs or screenshots)
              </CardDescription>
            </div>
            <div className="flex items-center text-[10px] text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md w-fit font-medium">
              <HelpCircle className="h-3 w-3 mr-1 text-pink-500 shrink-0" />
              Reviewed by admins
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {application.application_promises.map((promise, index) => (
              <motion.div
                key={promise.platform}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="p-3.5 border border-gray-100 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-900/5 rounded-lg space-y-3 shadow-3xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100/60 dark:border-gray-800/60">
                  <div className="flex items-center space-x-2 min-w-0">
                    <PlatformIcon platform={promise.platform} size="sm" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-xs">
                      {promise.platform} Proofs
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50/30 dark:bg-pink-950/10 border-pink-100 dark:border-pink-900/20 px-2 py-0.5 rounded-full select-none uppercase tracking-wider">
                    Target: {formatViewCount(parseViewCount(promise.promised_reach))} views
                  </Badge>
                </div>
                
                <ProofUpload
                  platform={promise.platform}
                  existingProofs={existingProofs[promise.platform] || []}
                  selectedProofs={selectedProofs[promise.platform] || []}
                  proofUrls={proofUrls}
                  onProofAdd={(type, content) => onProofAdd(promise.platform, type, content)}
                  onProofRemove={(index) => onProofRemove(promise.platform, index)}
                  maxSize={5 * 1024 * 1024}
                />
              </motion.div>
            ))}

            <div className="flex justify-end pt-1">
              <Button
                onClick={onProofSubmit}
                disabled={isLoading || Object.keys(selectedProofs).length === 0}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold transition-all duration-300 shadow-sm disabled:opacity-50 h-9 px-4 rounded-lg text-xs"
              >
                {isLoading ? (
                  <>
                    <div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Submit Performance Proofs
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

