import { supabase } from "@/lib/supabase"
import { Database } from "@/types/database.types"
import { useSetupStore } from "@/lib/store"

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
      const { error: contactError } = await supabase
        .from('contact_details')
        .insert({
          user_id: userId,
          type: 'MOBILE',
          detail: mobile,
        });

      if (contactError) {
        throw contactError;
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