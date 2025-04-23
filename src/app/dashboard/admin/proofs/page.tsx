"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Database } from "@/types/database.types";
import { toast } from "sonner";
import { format } from "date-fns";
import { getProofImageUrl } from "@/lib/utils/proofs";
import { parseViewCount, formatViewCount } from "@/lib/utils/views";
import { ProofVerificationModal, type ProofRejectionReason, proofRejectionReasons } from "@/components/dashboard/proof-verification-modal";
import { sendMail } from "@/lib/utils/email";

const ITEMS_PER_PAGE = 10;

type SortOption = 'newest' | 'oldest';
type StatusFilter = 'ALL' | Database["public"]["Enums"]["ProofStatus"];
type PlatformFilter = 'ALL' | Database["public"]["Enums"]["Platforms"];

type ApplicationProof = Database['public']['Tables']['application_proofs']['Row'] & {
  proof_status: Database['public']['Tables']['proof_status']['Row'] & {
    reviewer: {
      name: string;
      email: string;
    } | null;
  };
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProofs, setTotalProofs] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    action: 'accept' | 'reject';
    proof: ApplicationProof | null;
  }>({
    isOpen: false,
    action: 'accept',
    proof: null
  });
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

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
      let query = supabase
        .from('application_proofs')
        .select(`
          *,
          proof_status!inner (*,
            reviewer:profile!proof_status_reviewed_by_fkey (
              name,
              email
            )
          ),
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
        `, { count: 'exact' });

      if (statusFilter !== 'ALL') {
        query = query.eq('proof_status.status', statusFilter);
      }

      if (platformFilter !== 'ALL') {
        query = query.eq('platform', platformFilter);
      }

      if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query.gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
      }

      query = query.order('created_at', { ascending: sortBy === 'oldest' });

      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;
      query = query.range(start, end);

      const { data: proofData, error, count } = await query;

      if (error) throw error;

      setTotalProofs(count || 0);

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
          fetchProofs();
        }
      )
      .subscribe();

    fetchProofs();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    fetchProofs();
  }, [currentPage, sortBy, statusFilter, platformFilter, dateFilter]);

  const getActionRequired = (reason: ProofRejectionReason, customReason: string) => {
    switch (reason) {
      case 'INVALID_PROOFS':
        return 'Please ensure your proof submission includes clear, valid screenshots or links that demonstrate the task completion.';
      case 'VIEWS_NOT_REACHED':
        return 'Please wait until your content reaches the promised view count before submitting proof.';
      case 'FAKE_OWNERSHIP':
        return 'Please submit proof from a verified account that you own. You may need to complete the platform verification process first.';
      case 'DUPLICATE_SUBMISSION':
        return 'Please submit unique proof for each task. The same content cannot be used for multiple tasks.';
      case 'CONTENT_REMOVED':
        return 'Please ensure the promoted content is still accessible and submit new proof.';
      case 'METRICS_MISMATCH':
        return 'Please submit proof that accurately reflects the current engagement metrics from your platform analytics.';
      case 'OTHER':
        return customReason;
      default:
        return 'Please review the rejection reason and submit new proof that addresses these concerns.';
    }
  };

  const handleProofStatusUpdate = async (
    proofId: number, 
    status: Database["public"]["Enums"]["ProofStatus"],
    rejectionReason?: ProofRejectionReason,
    customReason?: string
  ) => {
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

      const proof = verificationModal.proof;
      if (!proof) return;

      const promiseDetails = proof.task_application.application_promises
        .find(p => p.platform === proof.platform);

      if (!promiseDetails) return;

      const emailContext: Record<string, string> = {
        name: proof.task_application.user.name,
        taskTitle: proof.task_application.task.title,
        taskId: proof.application_id.toString(),
        platform: proof.platform,
        date: format(new Date(), 'MMMM d, yyyy'),
        promisedViews: formatViewCount(parseViewCount(promiseDetails.promised_reach)),
        earnings: parseFloat(promiseDetails.est_profit).toFixed(2)
      };

      if (status === 'ACCEPTED') {
        await sendMail({
          to: proof.task_application.user.email,
          subject: 'Proof Accepted - BrandSync',
          template: 'proof-accepted',
          context: emailContext,
          from: 'verify@brandsync.lk'
        });
      } else if (rejectionReason) {
        const rejectionLabel = proofRejectionReasons.find(
          (r) => r.value === rejectionReason
        )?.label || 'Proof Rejected';

        await sendMail({
          to: proof.task_application.user.email,
          subject: 'Proof Rejected - BrandSync',
          template: 'proof-rejected',
          context: {
            ...emailContext,
            rejectionReason: rejectionLabel,
            actionRequired: getActionRequired(rejectionReason, customReason || '')
          },
          from: 'verify@brandsync.lk'
        });
      }

      setGroupedProofs(prevGroups => {
        return prevGroups.map(group => ({
          ...group,
          promises: group.promises.map(promise => ({
            ...promise,
            proofs: promise.proofs.map(p => 
              p.id === proofId
                ? {
                    ...p,
                    proof_status: {
                      ...p.proof_status,
                      status: status,
                      reviewed_at: reviewedAt,
                      reviewed_by: reviewerId
                    }
                  } as ApplicationProof
                : p
            )
          }))
        }));
      });

      toast.success(`Proof ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Error updating proof status:', error);
      toast.error('Failed to update proof status');
    } finally {
      setVerificationModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleProofAction = (proof: ApplicationProof, action: 'accept' | 'reject') => {
    setVerificationModal({
      isOpen: true,
      action,
      proof
    });
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

  const totalPages = Math.ceil(totalProofs / ITEMS_PER_PAGE);

  const PaginationControls = () => (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-sm">
        Page {currentPage} of {totalPages}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Application Proofs</h1>
        <div className="flex items-center gap-4">
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => {
              setSortBy(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value: StatusFilter) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={platformFilter}
            onValueChange={(value: PlatformFilter) => {
              setPlatformFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Platforms</SelectItem>
              <SelectItem value="YOUTUBE">YouTube</SelectItem>
              <SelectItem value="FACEBOOK">Facebook</SelectItem>
              <SelectItem value="TIKTOK">TikTok</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[160px] justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateFilter as Date}
                onSelect={(date: Date | undefined) => {
                  setDateFilter(date ?? null);
                  setCurrentPage(1);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFilter(null);
                setCurrentPage(1);
              }}
            >
              Clear Date
            </Button>
          )}
        </div>
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
                              <th className="text-left py-3 px-4">Reviewed By</th>
                              <th className="text-left py-3 px-4">Reviewed At</th>
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
                                  {proof.proof_status.reviewer?.name || '-'}
                                </td>
                                <td className="py-3 px-4">
                                  {proof.proof_status.reviewed_at 
                                    ? format(new Date(proof.proof_status.reviewed_at), 'MMM d, yyyy')
                                    : '-'}
                                </td>
                                <td className="py-3 px-4">
                                  {proof.proof_status.status === 'UNDER_REVIEW' && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                        onClick={() => handleProofAction(proof, 'accept')}
                                      >
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => handleProofAction(proof, 'reject')}
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
        {groupedProofs.length > 0 && <PaginationControls />}
      </div>
      {verificationModal.proof && (
        <ProofVerificationModal
          isOpen={verificationModal.isOpen}
          onClose={() => setVerificationModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={async (isAccepted, reason, customReason) => {
            if (verificationModal.proof) {
              await handleProofStatusUpdate(
                verificationModal.proof.id,
                isAccepted ? 'ACCEPTED' : 'REJECTED',
                reason,
                customReason
              );
            }
          }}
          action={verificationModal.action}
          proofDetails={{
            platform: verificationModal.proof.platform,
            promisedViews: parseViewCount(
              verificationModal.proof.task_application.application_promises.find(
                p => p.platform === verificationModal.proof?.platform
              )?.promised_reach || '0'
            )
          }}
        />
      )}
    </div>
  );
}