import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { useSetupStore } from "@/lib/store";

type SetupUserProfileParams = {
  userId: string;
  name: string;
  role: Database['public']['Enums']['Roles'][];
  mobile?: string;
  onError?: (error: any) => void;
}

export async function setupUserProfile({
  userId,
  name,
  role,
  mobile,
  onError
}: SetupUserProfileParams) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profile')
      .select('id')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw checkError;
    }

    // Create profile only if it doesn't exist
    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profile')
        .insert({
          id: userId,
          name,
          role,
        });

      if (profileError) {
        throw profileError;
      }
    }

    // Create contact details for mobile if provided
    if (mobile) {
      // First check if the contact already exists
      const { data: existingContact, error: contactCheckError } = await supabase
        .from('contact_details')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'MOBILE')
        .eq('detail', mobile)
        .single();

      if (contactCheckError && contactCheckError.code !== 'PGRST116') {
        throw contactCheckError;
      }

      // Only create contact if it doesn't exist
      if (!existingContact) {
        const { error: contactError } = await supabase
          .from('contact_details')
          .insert({
            user_id: userId,
            type: 'MOBILE',
            detail: mobile,
          });

        // If we get a unique constraint violation, it means someone else already registered this number
        if (contactError?.code === '23505') { // PostgreSQL unique constraint violation code
          throw new Error("This mobile number is already registered with another account.");
        }

        if (contactError) {
          throw contactError;
        }
      }
    }

    // Reset all store state
    const store = useSetupStore.getState();
    store.reset();

    // Clear the persisted store data from localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('setup-storage');
    }

    return { error: null };
  } catch (error) {
    if (onError) {
      onError(error);
    }
    return { error };
  }
}

export type ContactDetail = {
  id: number;
  type: Database["public"]["Enums"]["ContactTypes"];
  detail: string;
  contactStatus?: {
    is_verified: boolean;
    verified_at: string | null;
  };
};

export async function fetchUserContactDetails() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Authentication required");
    }

    // Fetch contact details with their verification status
    const { data: contacts, error: contactError } = await supabase
      .from('contact_details')
      .select(`
        *,
        contact_status(
          is_verified,
          verified_at
        )
      `)
      .eq('user_id', user.id);

    if (contactError) {
      throw contactError;
    }

    const formattedContacts: ContactDetail[] = (contacts || []).map(contact => ({
      id: contact.id,
      type: contact.type,
      detail: contact.detail,
      contactStatus: contact.contact_status ? {
        is_verified: Boolean(contact.contact_status.is_verified),
        verified_at: contact.contact_status.verified_at
      } : undefined
    }));

    return {
      email: user.email,
      contacts: formattedContacts
    };
  } catch (error) {
    console.error("Error fetching user contact details:", error);
    throw error;
  }
}

export async function isUserBuyer(userId: string) {
  const { data, error } = await supabase
    .rpc('is_a_buyer', { user_id_input: userId });

  if (error) throw error;
  return data;
}

export async function isUserInfluencer(userId: string) {
  const { data, error } = await supabase
    .rpc('is_an_influencer', { user_id_input: userId });

  if (error) throw error;
  return data;
}

export async function getUserVerifiedPlatforms(userId: string) {
  const { data, error } = await supabase
    .from('influencer_profile')
    .select('*')
    .eq('user_id', userId)
    .eq('is_verified', true);

  if (error) throw error;
  return data || [];
}