"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/database.types";
import { toast } from "sonner";
import { format } from "date-fns";
import { getProofImageUrl } from "@/lib/utils/proofs";
import { parseViewCount, formatViewCount } from "@/lib/utils/views";

type ApplicationProof = Database['public']['Tables']['application_proofs']['Row'] & {
  proof_status: Database['public']['Tables']['proof_status']['Row'];
  task_application: {
    id: number;
    task: {
      title: string;
      description: string;
      targets: Array<{
        platform: Database['public']['Enums']['Platforms'];
        views: string;
      }>;
    };
    user: {
      name: string;
      email: string;
    };
    application_promises: Array<{
      platform: Database['public']['Enums']['Platforms'];
      promised_reach: string;
      est_profit: string;
    }>;
  };
};

interface GroupedProofs {
  applicationId: number;
  task: {
    title: string;
    description: string;
    targets: Array<{
      platform: Database['public']['Enums']['Platforms'];
      views: string;
    }>;
  };
  user: {
    name: string;
    email: string;
  };
  promises: Array<{
    platform: Database['public']['Enums']['Platforms'];
    promised_reach: string;
    est_profit: string;
    proofs: ApplicationProof[];
  }>;
}

export default function AdminProofsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [groupedProofs, setGroupedProofs] = useState<GroupedProofs[]>([]);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // Verify admin role
      const { data: profile } = await supabase
        .from('profile')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile?.role.includes('ADMIN')) {
        router.push('/dashboard');
        return;
      }
    };

    checkAdminAccess();
  }, [supabase, router]);

  const fetchProofs = async () => {
    try {
      const { data: proofData, error } = await supabase
        .from('application_proofs')
        .select(`
          *,
          proof_status!inner (*),
          task_application:task_applications (
            id,
            task:task_details (
              title,
              description,
              targets
            ),
            user:profile (
              name,
              email
            ),
            application_promises (
              platform,
              promised_reach,
              est_profit
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group proofs by application and platform
      const grouped = (proofData as ApplicationProof[]).reduce((acc: GroupedProofs[], proof) => {
        const existingGroup = acc.find(g => g.applicationId === proof.application_id);
        
        if (existingGroup) {
          const platformPromise = existingGroup.promises.find(p => p.platform === proof.platform);
          if (platformPromise) {
            platformPromise.proofs.push(proof);
          } else {
            const promise = proof.task_application.application_promises
              .find(p => p.platform === proof.platform);
            if (promise) {
              existingGroup.promises.push({
                ...promise,
                proofs: [proof]
              });
            }
          }
          return acc;
        } else {
          const promises = proof.task_application.application_promises
            .map(promise => ({
              ...promise,
              proofs: promise.platform === proof.platform ? [proof] : []
            }));

          acc.push({
            applicationId: proof.application_id,
            task: {
              title: proof.task_application.task.title,
              description: proof.task_application.task.description,
              targets: proof.task_application.task.targets as any
            },
            user: proof.task_application.user,
            promises
          });
          return acc;
        }
      }, []);

      setGroupedProofs(grouped);

      // Fetch image URLs for image proofs
      const imageUrlPromises = proofData
        .filter(proof => proof.proof_type === 'IMAGE')
        .map(async proof => ({
          content: proof.content,
          url: await getProofImageUrl(proof.content)
        }));

      const imageUrls = await Promise.all(imageUrlPromises);
      const urlMap = imageUrls.reduce((acc, { content, url }) => ({
        ...acc,
        [content]: url
      }), {});

      setProofUrls(urlMap);
    } catch (error) {
      console.error('Error fetching proofs:', error);
      toast.error("Failed to load proof submissions");
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to proof_status changes
  useEffect(() => {
    const channel = supabase
      .channel('proof-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proof_status'
        },
        () => {
          // Refresh data when proof status changes
          fetchProofs();
        }
      )
      .subscribe();

    // Initial fetch
    fetchProofs();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleProofStatusUpdate = async (proofId: number, status: Database["public"]["Enums"]["ProofStatus"]) => {
    try {
      const reviewedAt = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();
      const reviewerId = user?.id;

      const { error } = await supabase
        .from('proof_status')
        .update({
          status: status,
          reviewed_at: reviewedAt,
          reviewed_by: reviewerId
        })
        .eq('proof_id', proofId);

      if (error) throw error;

      // Update local state directly
      setGroupedProofs(prevGroups => {
        return prevGroups.map(group => ({
          ...group,
          promises: group.promises.map(promise => ({
            ...promise,
            proofs: promise.proofs.map(proof => 
              proof.id === proofId
                ? {
                    ...proof,
                    proof_status: {
                      ...proof.proof_status,
                      status: status,
                      reviewed_at: reviewedAt,
                      reviewed_by: reviewerId ?? null
                    }
                  } as ApplicationProof
                : proof
            )
          }))
        }));
      });

      toast.success(`Proof ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Error updating proof status:', error);
      toast.error('Failed to update proof status');
    }
  };

  const getStatusBadgeVariant = (status?: Database["public"]["Enums"]["ProofStatus"]) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'UNDER_REVIEW':
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Application Proofs</h1>
      </div>
      
      <div className="space-y-6">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </CardContent>
          </Card>
        ) : groupedProofs.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No proof submissions found
              </p>
            </CardContent>
          </Card>
        ) : (
          groupedProofs.map(group => (
            <Card key={group.applicationId}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{group.task.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{group.task.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{group.user.name}</div>
                    <div className="text-sm text-muted-foreground">{group.user.email}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {group.promises.map(promise => (
                  <div key={promise.platform} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                        {promise.platform}
                      </Badge>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Promised: </span>
                        <span className="font-medium">{formatViewCount(parseViewCount(promise.promised_reach))} views</span>
                        <span className="mx-2">•</span>
                        <span className="text-muted-foreground">Est. Earnings: </span>
                        <span className="font-medium">Rs. {parseFloat(promise.est_profit).toFixed(2)}</span>
                      </div>
                    </div>

                    {promise.proofs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4">Type</th>
                              <th className="text-left py-3 px-4">Content</th>
                              <th className="text-left py-3 px-4">Status</th>
                              <th className="text-left py-3 px-4">Submitted</th>
                              <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {promise.proofs.map((proof) => (
                              <tr key={proof.id} className="border-b">
                                <td className="py-3 px-4">
                                  {proof.proof_type}
                                </td>
                                <td className="py-3 px-4">
                                  {proof.proof_type === 'URL' ? (
                                    <a 
                                      href={proof.content} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                                    >
                                      View URL
                                    </a>
                                  ) : (
                                    proofUrls[proof.content] && (
                                      <a 
                                        href={proofUrls[proof.content]} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                                      >
                                        View Image
                                      </a>
                                    )
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    getStatusBadgeVariant(proof.proof_status.status)
                                  }`}>
                                    {proof.proof_status.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  {format(new Date(proof.created_at), 'MMM d, yyyy')}
                                </td>
                                <td className="py-3 px-4">
                                  {proof.proof_status.status === 'UNDER_REVIEW' && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                        onClick={() => handleProofStatusUpdate(proof.id, 'ACCEPTED')}
                                      >
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => handleProofStatusUpdate(proof.id, 'REJECTED')}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                        No proofs submitted for {promise.platform}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}