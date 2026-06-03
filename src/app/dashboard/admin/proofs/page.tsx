"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    user_id: string;
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
            user_id,
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

      const proof = verificationModal.proof;
      if (!proof) return;

      const promiseDetails = proof.task_application.application_promises
        .find(p => p.platform === proof.platform);

      if (!promiseDetails) return;

      const influencerUserId = proof.task_application.user_id;
      const proofEarning = parseFloat(promiseDetails.est_profit);
      const previousStatus = proof.proof_status?.status;

      // --- Balance adjustment ---
      // Credit est_profit ONCE per platform — only when BOTH URL and IMAGE proofs
      // for that platform are ACCEPTED. Deduct only when that condition is broken.
      if (influencerUserId && proofEarning > 0) {
        // Fetch all proofs for this application + platform (including this one after update)
        const { data: allPlatformProofs } = await supabase
          .from('application_proofs')
          .select('id, proof_type, proof_status(status)')
          .eq('application_id', proof.application_id)
          .eq('platform', proof.platform);

        // Build a map of proof_type → status, simulating the status after this update
        const statusMap: Record<string, string> = {};
        (allPlatformProofs || []).forEach((p: any) => {
          const s = p.proof_status;
          const st = Array.isArray(s) ? s[0]?.status : s?.status;
          // Simulate the new status for the proof being updated
          statusMap[p.proof_type] = p.id === proofId ? status : (st || 'UNDER_REVIEW');
        });

        const bothAcceptedAfter = statusMap['URL'] === 'ACCEPTED' && statusMap['IMAGE'] === 'ACCEPTED';

        // Was it fully accepted BEFORE this change?
        const statusMapBefore: Record<string, string> = {};
        (allPlatformProofs || []).forEach((p: any) => {
          const s = p.proof_status;
          const st = Array.isArray(s) ? s[0]?.status : s?.status;
          statusMapBefore[p.proof_type] = st || 'UNDER_REVIEW';
        });
        const bothAcceptedBefore = statusMapBefore['URL'] === 'ACCEPTED' && statusMapBefore['IMAGE'] === 'ACCEPTED';

        const { data: currentBalance, error: balErr } = await supabase
          .from('account_balance')
          .select('balance, total_earning')
          .eq('user_id', influencerUserId)
          .single();

        if (!balErr && currentBalance) {
          if (bothAcceptedAfter && !bothAcceptedBefore) {
            // Just reached fully-accepted — credit the earning
            await supabase
              .from('account_balance')
              .update({
                balance: currentBalance.balance + proofEarning,
                total_earning: currentBalance.total_earning + proofEarning,
              })
              .eq('user_id', influencerUserId);
          } else if (!bothAcceptedAfter && bothAcceptedBefore) {
            // Was fully accepted, now it's not — deduct the earning
            await supabase
              .from('account_balance')
              .update({
                balance: Math.max(0, currentBalance.balance - proofEarning),
                total_earning: Math.max(0, currentBalance.total_earning - proofEarning),
              })
              .eq('user_id', influencerUserId);
          }
        }
      }


      // --- Update proof status ---
      const { error } = await supabase
        .from('proof_status')
        .update({
          status: status,
          reviewed_at: reviewedAt,
          reviewed_by: reviewerId
        })
        .eq('proof_id', proofId);

      if (error) throw error;

      const emailContext: Record<string, string> = {
        name: proof.task_application.user.name,
        taskTitle: proof.task_application.task.title,
        taskId: proof.application_id.toString(),
        platform: proof.platform,
        date: format(new Date(), 'MMMM d, yyyy'),
        promisedViews: formatViewCount(parseViewCount(promiseDetails.promised_reach)),
        earnings: parseFloat(promiseDetails.est_profit).toFixed(2)
      };

      let emailSent = false;
      let emailErrorMsg = '';

      try {
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
        emailSent = true;
      } catch (emailError: any) {
        console.error('Failed to send proof notification email:', emailError);
        emailErrorMsg = emailError?.message || 'SMTP error';
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

      if (emailSent) {
        toast.success(`Proof ${status.toLowerCase()} successfully and email notification sent.`);
      } else {
        toast.warning(`Proof ${status.toLowerCase()} successfully, but email notification failed: ${emailErrorMsg}`);
      }
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
        return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50/80 border-0 font-semibold';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 hover:bg-red-50/80 border-0 font-semibold';
      case 'UNDER_REVIEW':
      default:
        return 'bg-amber-50 text-amber-700 hover:bg-amber-50/80 border-0 font-semibold';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Application Proofs</h1>
          <p className="text-xs text-gray-500">Review and approve task campaign completion proofs submitted by influencers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => {
              setSortBy(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] bg-white border-gray-200">
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
            <SelectTrigger className="w-[140px] bg-white border-gray-200">
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
            <SelectTrigger className="w-[140px] bg-white border-gray-200">
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
                  "w-[160px] justify-start text-left font-normal bg-white border-gray-200",
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
          <div className="bg-white rounded-xl border border-gray-100 p-10 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
          </div>
        ) : groupedProofs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            No proof submissions found
          </div>
        ) : (
          groupedProofs.map(group => (
            <div key={group.applicationId} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{group.task.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{group.task.description}</p>
                </div>
                <div className="text-left md:text-right">
                  <div className="font-semibold text-sm text-gray-800">{group.user.name}</div>
                  <div className="text-xs text-gray-500">{group.user.email}</div>
                </div>
              </div>

              <div className="space-y-6">
                {group.promises.map(promise => (
                  <div key={promise.platform} className="space-y-3 last:mb-0">
                    <div className="flex items-center justify-between bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      <Badge variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-50/80 border-0 font-semibold text-xs px-2 py-0.5">
                        {promise.platform}
                      </Badge>
                      <div className="text-xs font-medium text-gray-500">
                        <span>Promised Reach: <strong className="text-gray-800 font-semibold">{formatViewCount(parseViewCount(promise.promised_reach))} views</strong></span>
                        <span className="mx-2">•</span>
                        <span>Est. Earnings: <strong className="text-emerald-600 font-semibold">Rs. {parseFloat(promise.est_profit).toFixed(2)}</strong></span>
                      </div>
                    </div>

                    {promise.proofs.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
                        <Table>
                          <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b border-gray-100 hover:bg-transparent">
                              <TableHead className="py-2.5 px-4 font-semibold text-gray-600 text-xs">Type</TableHead>
                              <TableHead className="py-2.5 px-4 font-semibold text-gray-600 text-xs">Content</TableHead>
                              <TableHead className="py-2.5 px-4 font-semibold text-gray-600 text-xs">Status</TableHead>
                              <TableHead className="py-2.5 px-4 font-semibold text-gray-600 text-xs">Submitted</TableHead>
                              <TableHead className="py-2.5 px-4 font-semibold text-gray-600 text-xs">Reviewed By</TableHead>
                              <TableHead className="py-2.5 px-4 font-semibold text-gray-600 text-xs">Reviewed At</TableHead>
                              <TableHead className="py-2.5 px-4 font-semibold text-gray-600 text-xs text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {promise.proofs.map((proof) => (
                              <TableRow key={proof.id} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                                <TableCell className="py-3 px-4 text-xs font-semibold text-gray-700">
                                  {proof.proof_type}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-xs">
                                  {proof.proof_type === 'URL' ? (
                                    <a 
                                      href={proof.content} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-700 font-semibold hover:underline"
                                    >
                                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                      Open URL
                                    </a>
                                  ) : (
                                    proofUrls[proof.content] && (
                                      <a 
                                        href={proofUrls[proof.content]} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="group inline-block"
                                        title="Click to view full image"
                                      >
                                        <img
                                          src={proofUrls[proof.content]}
                                          alt="Proof screenshot"
                                          className="w-16 h-12 object-cover rounded-md border border-gray-200 shadow-sm group-hover:shadow-md group-hover:border-pink-200 transition-all"
                                        />
                                      </a>
                                    )
                                  )}
                                </TableCell>
                                 <TableCell className="py-3 px-4">
                                   <div className="flex flex-col gap-1">
                                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border-0 w-fit ${
                                       getStatusBadgeVariant(proof.proof_status.status)
                                     }`}>
                                       {proof.proof_status.status}
                                     </span>
                                     {/* Show resubmission warning: UNDER_REVIEW but previously reviewed (rejected) */}
                                     {proof.proof_status.status === 'UNDER_REVIEW' && proof.proof_status.reviewed_at && (
                                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                                         ⚠ Previously Rejected
                                       </span>
                                     )}
                                   </div>
                                 </TableCell>
                                 <TableCell className="py-3 px-4 text-xs text-gray-500">
                                   <div>{format(new Date(proof.created_at), 'MMM d, yyyy')}</div>
                                   {proof.proof_status.status === 'UNDER_REVIEW' && proof.proof_status.reviewed_at && (
                                     <div className="text-[9px] text-amber-600 font-medium mt-0.5">
                                       Rejected: {format(new Date(proof.proof_status.reviewed_at), 'MMM d, yyyy')}
                                     </div>
                                   )}
                                 </TableCell>
                                <TableCell className="py-3 px-4 text-xs text-gray-500">
                                  {proof.proof_status.reviewer?.name || '-'}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-xs text-gray-500">
                                  {proof.proof_status.reviewed_at 
                                    ? format(new Date(proof.proof_status.reviewed_at), 'MMM d, yyyy')
                                    : '-'}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right">
                                  {proof.proof_status.status === 'UNDER_REVIEW' && (
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs text-emerald-600 border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 hover:text-emerald-700"
                                        onClick={() => handleProofAction(proof, 'accept')}
                                      >
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs text-red-600 border-red-200 bg-red-50/30 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => handleProofAction(proof, 'reject')}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg bg-gray-50/20">
                        No proofs submitted for {promise.platform}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
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