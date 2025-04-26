import React, { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Database } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Award, TrendingUp, CheckCircle, Link, FileImage, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getStorageUrl } from "@/lib/utils/storage";

type TaskApplication = Database['public']['Tables']['task_applications']['Row'];
type ApplicationPromise = Database['public']['Tables']['application_promises']['Row'];
type InfluencerProfile = Database['public']['Tables']['influencer_profile']['Row'];
type ApplicationProof = Database['public']['Tables']['application_proofs']['Row'] & {
  status?: {
    id: number;
    status: Database['public']['Enums']['ProofStatus'];
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

// Get platform-specific color
const getPlatformColor = (platform: string) => {
  switch (platform.toUpperCase()) {
    case 'INSTAGRAM': return '#E1306C';
    case 'FACEBOOK': return '#4267B2';
    case 'TIKTOK': return '#000000';
    case 'YOUTUBE': return '#FF0000';
    default: return '#6366f1';
  }
};

// Get platform logo path
const getPlatformLogo = (platform: string) => {
  const platformName = platform.toLowerCase();
  return `/platforms/${platformName}.png`;
};

// Component to display proof details
const ProofsList = ({ proofs, platform }: { proofs: ApplicationProof[], platform: string }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setExpanded(!expanded)} 
        className="w-full justify-between text-sm text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 -mx-1"
      >
        <span className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          {expanded ? 'Hide Proofs' : 'View Proofs'}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      
      {expanded && (
        <div className="mt-3 space-y-3">
          {proofs.map((proof, index) => (
            <ProofItem key={proof.id} proof={proof} platform={platform} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

// Component to display individual proof item
const ProofItem = ({ proof, platform, index }: { proof: ApplicationProof, platform: string, index: number }) => {
  const [contentUrl, setContentUrl] = useState<string>("");
  
  React.useEffect(() => {
    // For IMAGE type proofs, fetch the URL from storage
    const fetchUrl = async () => {
      if (proof.proof_type === 'IMAGE') {
        const url = await getStorageUrl('proof-images', proof.content);
        if (url) setContentUrl(url);
      }
    };
    fetchUrl();
  }, [proof]);
  
  const platformColor = getPlatformColor(platform);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-2 mb-2">
        {proof.proof_type === 'IMAGE' ? (
          <FileImage className="h-4 w-4" style={{ color: platformColor }} />
        ) : (
          <Link className="h-4 w-4" style={{ color: platformColor }} />
        )}
        <span className="text-sm font-medium">
          {proof.proof_type === 'IMAGE' ? 'Image Proof' : 'URL Proof'}
        </span>
        <Badge 
          className="ml-auto text-xs" 
          variant="outline"
          style={{
            backgroundColor: proof.status?.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.1)' : 
                          proof.status?.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: proof.status?.status === 'ACCEPTED' ? 'rgb(16, 185, 129)' : 
                  proof.status?.status === 'REJECTED' ? 'rgb(239, 68, 68)' : 'rgb(245, 158, 11)',
            borderColor: proof.status?.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.2)' : 
                        proof.status?.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'
          }}
        >
          {proof.status?.status || 'UNDER_REVIEW'}
        </Badge>
      </div>
      
      {proof.proof_type === 'IMAGE' ? (
        <div className="mt-2 text-center">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs w-full"
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
            className="text-xs w-full"
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
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Reviewed on {format(new Date(proof.status.reviewed_at), 'MMM d, yyyy')}
        </p>
      )}
    </motion.div>
  );
};

export function ApplicationsListCard({ applications }: ApplicationsListCardProps) {
  return (
    <Card className="border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
        <CardTitle className="text-xl font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Users className="h-5 w-5 mr-2 text-indigo-500" />
          Influencer Applications
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6">
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
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-muted-foreground"
                  >
                    Application data unavailable
                  </motion.div>
                );
              }
              
              const platformColor = getPlatformColor(application.influencer.platform);
              const platformLogo = getPlatformLogo(application.influencer.platform);
              
              return (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      <Image 
                        src={platformLogo} 
                        alt={application.influencer.platform} 
                        width={28} 
                        height={28} 
                        className="object-contain"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{application.influencer.name}</h4>
                        <Badge 
                          className="capitalize bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/30"
                        >
                          {application.influencer.platform.toLowerCase()}
                        </Badge>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-muted-foreground">
                            {application.influencer.followers.toLocaleString()} followers
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-muted-foreground">
                            {format(new Date(application.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        
                        {application.promises[0] && (
                          <div className="flex items-center gap-1.5 col-span-2">
                            <TrendingUp className="h-4 w-4 text-pink-500" />
                            <span className="text-pink-600 dark:text-pink-400 font-medium">
                              Promised reach: {application.promises[0].promised_reach.toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        {/* Display proof count if there are any */}
                        {application.proofs && application.proofs.length > 0 && (
                          <div className="flex items-center gap-1.5 col-span-2 mt-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {application.proofs.length} {application.proofs.length === 1 ? 'Proof' : 'Proofs'} Submitted
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Proof details section */}
                      {application.proofs && application.proofs.length > 0 && (
                        <ProofsList proofs={application.proofs} platform={application.influencer.platform} />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No Applications Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your task is waiting for influencers to apply. Check back later or consider adjusting your task requirements.  
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
