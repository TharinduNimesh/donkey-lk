import React, { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Database } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  TrendingUp,
  CheckCircle,
  Link,
  FileImage,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getStorageUrl } from "@/lib/utils/storage";

type TaskApplication =
  Database["public"]["Tables"]["task_applications"]["Row"];
type ApplicationPromise =
  Database["public"]["Tables"]["application_promises"]["Row"];
type InfluencerProfile =
  Database["public"]["Tables"]["influencer_profile"]["Row"];
type ApplicationProof =
  Database["public"]["Tables"]["application_proofs"]["Row"] & {
    status?: {
      id: number;
      status: Database["public"]["Enums"]["ProofStatus"];
      proof_id: number;
      created_at: string;
      reviewed_at: string | null;
      reviewed_by: string | null;
    } | null;
  };

interface ApplicationWithDetails extends TaskApplication {
  promises: ApplicationPromise[];
  influencer: InfluencerProfile | null;
  proofs: ApplicationProof[];
}

interface ApplicationsListCardProps {
  applications: ApplicationWithDetails[];
}

// Get platform-specific colors
const platformColors: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  YOUTUBE: {
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-500/10",
    border: "border-red-100 dark:border-red-500/20",
  },
  TIKTOK: {
    text: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-500/10",
    border: "border-cyan-100 dark:border-cyan-500/20",
  },
  INSTAGRAM: {
    text: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-500/10",
    border: "border-pink-100 dark:border-pink-500/20",
  },
  FACEBOOK: {
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-100 dark:border-blue-500/20",
  },
  TWITTER: {
    text: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    border: "border-sky-100 dark:border-sky-500/20",
  },
};

// Get platform logo path
const getPlatformLogo = (platform: string) => {
  const platformName = platform.toLowerCase();
  return `/platforms/${platformName}.png`;
};

// Component to display proof details
const ProofsList = ({
  proofs,
  platform,
}: {
  proofs: ApplicationProof[];
  platform: string;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 pt-3 border-t border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full justify-between text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 -mx-1"
      >
        <span className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
          {expanded ? "Hide Proofs" : "View Proofs"}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {proofs.map((proof, index) => (
            <ProofItem
              key={proof.id}
              proof={proof}
              platform={platform}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Component to display individual proof item
const ProofItem = ({
  proof,
  platform,
  index,
}: {
  proof: ApplicationProof;
  platform: string;
  index: number;
}) => {
  const [contentUrl, setContentUrl] = useState<string>("");

  React.useEffect(() => {
    const fetchUrl = async () => {
      if (proof.proof_type === "IMAGE") {
        const url = await getStorageUrl("proof-images", proof.content);
        if (url) setContentUrl(url);
      }
    };
    fetchUrl();
  }, [proof]);

  const colors =
    platformColors[platform.toUpperCase()] || platformColors.YOUTUBE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="p-3 bg-muted/30 dark:bg-white/[0.03] rounded-lg border border-border"
    >
      <div className="flex items-center gap-2 mb-2">
        {proof.proof_type === "IMAGE" ? (
          <FileImage className={`h-4 w-4 ${colors.text}`} />
        ) : (
          <Link className={`h-4 w-4 ${colors.text}`} />
        )}
        <span className="text-sm font-medium text-foreground">
          {proof.proof_type === "IMAGE" ? "Image Proof" : "URL Proof"}
        </span>
        <Badge
          className="ml-auto text-xs border"
          variant="outline"
          style={{
            backgroundColor:
              proof.status?.status === "ACCEPTED"
                ? "rgba(16, 185, 129, 0.1)"
                : proof.status?.status === "REJECTED"
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(245, 158, 11, 0.1)",
            color:
              proof.status?.status === "ACCEPTED"
                ? "rgb(52, 211, 153)"
                : proof.status?.status === "REJECTED"
                ? "rgb(248, 113, 113)"
                : "rgb(251, 191, 36)",
            borderColor:
              proof.status?.status === "ACCEPTED"
                ? "rgba(16, 185, 129, 0.2)"
                : proof.status?.status === "REJECTED"
                ? "rgba(239, 68, 68, 0.2)"
                : "rgba(245, 158, 11, 0.2)",
          }}
        >
          {proof.status?.status || "UNDER_REVIEW"}
        </Badge>
      </div>

      {proof.proof_type === "IMAGE" ? (
        <div className="mt-2 text-center">
          <Button
            variant="outline"
            size="sm"
            className="text-xs w-full border-border bg-muted/50 text-foreground hover:bg-muted hover:text-foreground"
            asChild
          >
            <a
              href={contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              View Image
            </a>
          </Button>
        </div>
      ) : (
        <div className="mt-2 text-center">
          <Button
            variant="outline"
            size="sm"
            className="text-xs w-full border-border bg-muted/50 text-foreground hover:bg-muted hover:text-foreground"
            asChild
          >
            <a
              href={proof.content}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Visit URL
            </a>
          </Button>
        </div>
      )}

      {proof.status?.reviewed_at && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Reviewed on{" "}
          {format(new Date(proof.status.reviewed_at), "MMM d, yyyy")}
        </p>
      )}
    </motion.div>
  );
};

export function ApplicationsListCard({
  applications,
}: ApplicationsListCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Influencer Applications
        </h2>
        {applications.length > 0 && (
          <span className="ml-auto text-sm text-gray-500">
            {applications.length}{" "}
            {applications.length === 1 ? "application" : "applications"}
          </span>
        )}
      </div>

      {applications.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {applications.map((application, index) => {
            if (!application.influencer) {
              return (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 border border-border rounded-xl text-sm text-muted-foreground bg-muted/20"
                >
                  Application data unavailable
                </motion.div>
              );
            }

            const platformLogo = getPlatformLogo(
              application.influencer.platform
            );
            const colors =
              platformColors[application.influencer.platform.toUpperCase()] ||
              platformColors.YOUTUBE;

            return (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="p-5 border border-border rounded-xl hover:border-pink-200 dark:hover:border-pink-800 hover:shadow-md transition-all duration-300 bg-card"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-11 h-11 bg-muted rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Image
                      src={platformLogo}
                      alt={application.influencer.platform}
                      width={28}
                      height={28}
                      className="object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-foreground truncate">
                        {application.influencer.name}
                      </h4>
                      <Badge
                        className={`capitalize text-xs ${colors.bg} ${colors.text} ${colors.border} border`}
                      >
                        {application.influencer.platform.toLowerCase()}
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {application.influencer.followers.toLocaleString()}{" "}
                          followers
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {format(
                            new Date(application.created_at),
                            "MMM d, yyyy"
                          )}
                        </span>
                      </div>

                      {application.promises[0] && (
                        <div className="flex items-center gap-1.5 col-span-2">
                          <TrendingUp className="h-3.5 w-3.5 text-pink-500" />
                          <span className="text-pink-600 dark:text-pink-400 font-medium">
                            Promised reach:{" "}
                            {application.promises[0].promised_reach.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Display proof count if there are any */}
                      {application.proofs &&
                        application.proofs.length > 0 && (
                          <div className="flex items-center gap-1.5 col-span-2 mt-1">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {application.proofs.length}{" "}
                              {application.proofs.length === 1
                                ? "Proof"
                                : "Proofs"}{" "}
                              Submitted
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Proof details section */}
                    {application.proofs &&
                      application.proofs.length > 0 && (
                        <ProofsList
                          proofs={application.proofs}
                          platform={application.influencer.platform}
                        />
                      )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-12 bg-muted/20 rounded-xl border border-border">
          <div className="w-14 h-14 mx-auto rounded-full bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center mb-4">
            <Users className="h-7 w-7 text-pink-500" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            No Applications Yet
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your task is waiting for influencers to apply. Check back later or
            consider adjusting your task requirements.
          </p>
        </div>
      )}
    </div>
  );
}
