"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Profile = Database["public"]["Tables"]["profile"]["Row"];
type ContactDetail = Database["public"]["Tables"]["contact_details"]["Row"];
type VerificationRequest = Database["public"]["Tables"]["influencer_profile_verification_requests"]["Row"];

type RequestWithDetails = VerificationRequest & {
  profile: Profile & {
    contacts: ContactDetail[];
  };
};

export default function AdminVerificationsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const [profileName, setProfileName] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Fetch verification requests with user profiles and contact details
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

  const handleAccept = async (request: RequestWithDetails) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleReject = async (request: RequestWithDetails) => {
    try {
      const { error } = await supabase
        .from('influencer_profile_verification_requests')
        .delete()
        .eq('id', request.id);

      if (error) throw error;

      // Remove from local state
      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success('Verification request rejected successfully');
    } catch (error) {
      console.error('Error rejecting verification request:', error);
      toast.error('Failed to reject verification request');
    }
  };

  const handleConfirmAccept = async () => {
    if (!selectedRequest) return;
    setIsAccepting(true);

    try {
      const { data, error } = await supabase
        .rpc('accept_influencer_verification', {
          p_request_id: selectedRequest.id,
          p_name: profileName,
          p_followers: followerCount,
          p_pic: profilePicUrl
        });

      if (error) throw error;

      // Update local state
      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setIsModalOpen(false);
      setSelectedRequest(null);
      setProfileName("");
      setFollowerCount("");
      setProfilePicUrl("");
      toast.success('Profile verified successfully');
    } catch (error) {
      console.error('Error accepting verification request:', error);
      toast.error('Failed to verify profile');
    } finally {
      setIsAccepting(false);
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
                            onClick={() => handleAccept(request)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(request)}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Profile Verification</DialogTitle>
            <DialogDescription>
              Enter the profile details to verify this account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profileName">Profile/Channel Name</Label>
              <Input
                id="profileName"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter profile or channel name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followers">Follower Count</Label>
              <Input
                id="followers"
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
                placeholder="e.g. 10K, 1.4M, 500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profilePic">Profile Picture URL</Label>
              <Input
                id="profilePic"
                value={profilePicUrl}
                onChange={(e) => setProfilePicUrl(e.target.value)}
                placeholder="Enter profile picture URL"
                type="url"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={isAccepting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAccept}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"/>
                  Verifying...
                </>
              ) : (
                'Confirm Verification'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}