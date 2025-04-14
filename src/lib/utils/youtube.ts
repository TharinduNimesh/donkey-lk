import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { toast } from "sonner";

export interface ChannelInfo {
  title: string;
  subscribers: string;
  thumbnail: string | null;
  description: string;
}

export async function verifyYouTubeChannel(channelUrl: string, userId: string, channelInfo: ChannelInfo | null) {
  try {
    if (!channelInfo) {
      throw new Error("Channel info not found");
    }

    // Check if the URL already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('influencer_profile')
      .select('*')
      .eq('platform', 'YOUTUBE')
      .eq('url', channelUrl)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw checkError;
    }

    if (existingProfile) {
      if (existingProfile.is_verified) {
        throw new Error("This YouTube channel has already been verified by another user.");
      }
      
      if (existingProfile.user_id !== userId) {
        throw new Error("This YouTube channel is already registered by another user and pending verification.");
      }
      
      // If profile exists, not verified, and belongs to current user, return the existing profile
      return { profileId: existingProfile.id, message: "Continuing verification process..." };
    }

    // Create new profile if it doesn't exist
    const { data: profile, error: createError } = await supabase
      .from('influencer_profile')
      .insert({
        user_id: userId,
        platform: 'YOUTUBE',
        url: channelUrl,
        name: channelInfo.title,
        followers: channelInfo.subscribers,
        is_verified: false
      })
      .select('id')
      .single();

    if (createError) {
      if (createError.code === '23505') { // unique constraint violation
        // Handle race condition - try to fetch the profile again
        const { data: retryProfile } = await supabase
          .from('influencer_profile')
          .select('*')
          .eq('platform', 'YOUTUBE')
          .eq('url', channelUrl)
          .single();

        if (retryProfile) {
          if (retryProfile.is_verified) {
            throw new Error("This YouTube channel has already been verified by another user.");
          }
          if (retryProfile.user_id !== userId) {
            throw new Error("This YouTube channel is already registered by another user and pending verification.");
          }
          return { profileId: retryProfile.id, message: "Continuing verification process..." };
        }
      }
      throw createError;
    }

    return { profileId: profile.id };
  } catch (error) {
    throw error;
  }
}

export async function generateVerificationCode(profileId: string) {
  try {
    const response = await fetch('/api/verification/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: 'YOUTUBE',
        profileId: profileId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate verification code');
    }

    return response.json();
  } catch (error) {
    throw error;
  }
}

export async function checkYouTubeVerification(userId: string, channelUrl: string) {
  try {
    // Get the profile ID
    const { data: profile } = await supabase
      .from('influencer_profile')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'YOUTUBE')
      .eq('url', channelUrl)
      .single();

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Call verification API
    const response = await fetch('/api/verification/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileId: profile.id
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Verification failed');
    }

    return result;
  } catch (error) {
    throw error;
  }
}