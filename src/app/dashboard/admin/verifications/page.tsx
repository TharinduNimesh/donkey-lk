"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ownership Verifications</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Verification Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No verification requests found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Contact Info</th>
                    <th className="text-left py-3 px-4">Platform</th>
                    <th className="text-left py-3 px-4">Profile URL</th>
                    <th className="text-left py-3 px-4">Submitted</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{request.profile.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Joined {format(new Date(request.profile.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Email:</span>{' '}
                            {request.profile.email}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Mobile:</span>{' '}
                            {getContactByType(request.profile.contacts, 'MOBILE')}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                          {request.platform}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <a 
                          href={request.profile_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                        >
                          View Profile
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleVerificationAction(request, 'accept')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerificationAction(request, 'reject')}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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