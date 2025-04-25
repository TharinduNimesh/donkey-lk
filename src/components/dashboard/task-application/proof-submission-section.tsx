import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Database } from "@/types/database.types";
import { formatViewCount, parseViewCount } from "@/lib/utils/views";
import { ProofUpload } from "@/components/ui/proof-upload";
import { Upload } from "lucide-react";

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
      <Card className="mb-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="font-medium text-gray-900 dark:text-gray-100">
              Submit Proofs
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Provide evidence of your campaign performance
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-6">
          <div className="space-y-6">
            {application.application_promises.map((promise, index) => (
              <motion.div
                key={promise.platform}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{promise.platform} Proofs</h3>
                  <div className="text-sm text-muted-foreground">
                    Promised: {formatViewCount(parseViewCount(promise.promised_reach))} views
                  </div>
                </div>
                
                <ProofUpload
                  platform={promise.platform}
                  existingProofs={existingProofs[promise.platform] || []}
                  selectedProofs={selectedProofs[promise.platform] || []}
                  proofUrls={proofUrls}
                  onProofAdd={(type, content) => onProofAdd(promise.platform, type, content)}
                  onProofRemove={(index) => onProofRemove(promise.platform, index)}
                />
              </motion.div>
            ))}

            <div className="flex justify-end">
              <Button
                onClick={onProofSubmit}
                disabled={isLoading || Object.keys(selectedProofs).length === 0}
                className="bg-pink-600 hover:bg-pink-700 text-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Proofs
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
