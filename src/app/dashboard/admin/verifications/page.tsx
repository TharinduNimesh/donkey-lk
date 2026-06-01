"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OwnershipVerificationModal, type VerificationRejectionReason, verificationRejectionReasons } from "@/components/dashboard/ownership-verification-modal";
import { sendMail } from "@/lib/utils/email";

type Profile = Database["public"]["Tables"]["profile"]["Row"];
type ContactDetail = Database["public"]["Tables"]["contact_details"]["Row"];
type VerificationRequest = Database["public"]["Tables"]["influencer_profile_verification_requests"]["Row"];

type RequestWithDetails = VerificationRequest & {
  profile: Profile & {
    contacts: ContactDetail[];
  };
};

const getActionRequired = (reason: VerificationRejectionReason, customReason: string) => {
  switch (reason) {
    case 'INSUFFICIENT_INFO':
      return 'Please resubmit your verification request with complete and clear information about your account ownership.';
    case 'ALREADY_VERIFIED':
      return 'This account is already verified with another BrandSync profile. If you believe this is an error, please contact our support team.';
    case 'FAKE_ACCOUNT':
      return 'We could not verify the authenticity of this account. Please ensure you are the legitimate owner and provide clear proof of ownership.';
    case 'LOW_FOLLOWERS':
      return 'Your account does not meet our minimum follower requirement. Please reapply once you have grown your audience.';
    case 'INACTIVE_PROFILE':
      return 'Your account shows insufficient recent activity. Please maintain regular content posting and engagement before reapplying.';
    case 'SUSPICIOUS_ACTIVITY':
      return 'We detected unusual activity on your account. Please ensure your account follows our community guidelines and platform terms of service.';
    case 'CONTENT_VIOLATION':
      return 'Your account content violates our community guidelines. Please review our terms of service and content policies before reapplying.';
    case 'INCOMPLETE_PROFILE':
      return 'Please complete your social media profile with all required information and resubmit your verification request.';
    case 'OTHER':
      return customReason;
    default:
      return 'Please address the issues mentioned and submit a new verification request.';
  }
};

export default function AdminVerificationsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    action: 'accept' | 'reject';
    request: RequestWithDetails | null;
  }>({
    isOpen: false,
    action: 'accept',
    request: null
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data: verificationRequests, error } = await supabase
          .from('influencer_profile_verification_requests')
          .select(`
            *,
            profile (
              id,
              name,
              email,
              role,
              created_at,
              contacts:contact_details (
                id,
                type,
                detail
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setRequests(verificationRequests as RequestWithDetails[]);
      } catch (error) {
        console.error('Error fetching verification requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [supabase, router]);

  const getContactByType = (contacts: ContactDetail[], type: Database["public"]["Enums"]["ContactTypes"]) => {
    return contacts.find(contact => contact.type === type)?.detail;
  };

  const handleVerificationAction = (request: RequestWithDetails, action: 'accept' | 'reject') => {
    setVerificationModal({
      isOpen: true,
      action,
      request
    });
  };

  const handleVerificationUpdate = async (
    isAccepted: boolean,
    verificationDetails?: {
      profileName: string;
      followerCount: string;
      profilePicUrl: string;
    },
    rejectionReason?: VerificationRejectionReason,
    customReason?: string
  ) => {
    const request = verificationModal.request;
    if (!request) return;

    try {
      if (isAccepted && verificationDetails) {
        const { error } = await supabase
          .rpc('accept_influencer_verification', {
            p_request_id: request.id,
            p_name: verificationDetails.profileName,
            p_followers: verificationDetails.followerCount,
            p_pic: verificationDetails.profilePicUrl
          });

        if (error) throw error;

        await sendMail({
          to: request.profile.email,
          subject: 'Account Verification Approved - BrandSync',
          template: 'verification-accepted',
          context: {
            name: request.profile.name,
            platform: request.platform,
            profileName: verificationDetails.profileName,
            followerCount: verificationDetails.followerCount,
            date: format(new Date(), 'MMMM d, yyyy')
          },
          from: 'verify@brandsync.lk'
        });
      } else if (!isAccepted && rejectionReason) {
        const { error } = await supabase
          .from('influencer_profile_verification_requests')
          .delete()
          .eq('id', request.id);

        if (error) throw error;

        const rejectionLabel = verificationRejectionReasons.find(
          (r) => r.value === rejectionReason
        )?.label || 'Verification Rejected';

        await sendMail({
          to: request.profile.email,
          subject: 'Account Verification Update - BrandSync',
          template: 'verification-rejected',
          context: {
            name: request.profile.name,
            platform: request.platform,
            profileUrl: request.profile_url,
            date: format(new Date(), 'MMMM d, yyyy'),
            rejectionReason: rejectionLabel,
            actionRequired: getActionRequired(rejectionReason, customReason || '')
          },
          from: 'verify@brandsync.lk'
        });
      }

      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success(`Verification request ${isAccepted ? 'accepted' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error updating verification request:', error);
      toast.error(`Failed to ${isAccepted ? 'accept' : 'reject'} verification request`);
    } finally {
      setVerificationModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ownership Verifications</h1>
        <p className="text-xs text-gray-500">Review and verify channel ownership submissions from platform influencers.</p>
      </div>

      <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Platform Verification Requests</h2>
          <p className="text-xs text-gray-400">Manage and verify pending account verifications below.</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-400 py-10 text-sm">
              No verification requests found
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-b border-gray-100 hover:bg-transparent">
                  <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">User</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Contact Info</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Platform</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Profile URL</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Submitted</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                    <TableCell className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{request.profile.name}</div>
                        <div className="text-[10px] text-gray-400">
                          Joined {format(new Date(request.profile.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="space-y-0.5 text-xs text-gray-600">
                        <div>
                          <span className="font-medium text-gray-400">Email:</span>{' '}
                          <span className="text-gray-700">{request.profile.email}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-400">Mobile:</span>{' '}
                          <span className="text-gray-700">{getContactByType(request.profile.contacts, 'MOBILE') || '-'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <Badge variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-50/80 border-0 font-semibold text-[10px] px-2 py-0.5">
                        {request.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-semibold">
                      <a 
                        href={request.profile_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700 hover:underline"
                      >
                        View Profile
                      </a>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs text-gray-500">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleVerificationAction(request, 'accept')}
                          className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerificationAction(request, 'reject')}
                          className="h-7 text-xs text-red-600 border-red-200 bg-red-50/30 hover:bg-red-50 hover:text-red-700 font-semibold"
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      {verificationModal.request && (
        <OwnershipVerificationModal
          isOpen={verificationModal.isOpen}
          onClose={() => setVerificationModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handleVerificationUpdate}
          action={verificationModal.action}
          platform={verificationModal.request.platform}
        />
      )}
    </div>
  );
}