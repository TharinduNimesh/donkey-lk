import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { getStorageUrl } from "./storage";

export async function submitApplicationProofs(applicationId: number, proofs: Array<{
  platform: Database["public"]["Enums"]["Platforms"];
  proofType: Database["public"]["Enums"]["ProofType"];
  content: string;
}>) {
  try {
    const { error } = await supabase
      .from('application_proofs')
      .insert(proofs.map(proof => ({
        application_id: applicationId,
        platform: proof.platform,
        proof_type: proof.proofType,
        content: proof.content
      })));

    if (error) throw error;
  } catch (error) {
    console.error('Error submitting proofs:', error);
    throw error;
  }
}

export async function getApplicationProofs(applicationId: number) {
  try {
    const { data, error } = await supabase
      .from('application_proofs')
      .select(`
        *,
        proof_status (
          status,
          reviewed_at,
          reviewed_by
        )
      `)
      .eq('application_id', applicationId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting application proofs:', error);
    throw error;
  }
}

export async function getProofImageUrl(filePath: string) {
  try {
    const url = await getStorageUrl('proof-images', filePath);

    return url;
  } catch (error) {
    console.error('Error getting proof image URL:', error);
    throw error;
  }
}