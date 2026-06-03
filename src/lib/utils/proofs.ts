import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { getStorageUrl } from "./storage";

export async function submitApplicationProofs(applicationId: number, proofs: Array<{
  platform: Database["public"]["Enums"]["Platforms"];
  proofType: Database["public"]["Enums"]["ProofType"];
  content: string;
}>) {
  try {
    const freshInserts: typeof proofs = [];

    for (const proof of proofs) {
      // Try to resubmit (PATCH) — if the proof was previously rejected, the server
      // updates the content in-place and resets status to UNDER_REVIEW, preserving
      // the rejection history so admins can see it.
      const res = await fetch("/api/task-applications/proofs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          platform: proof.platform,
          proofType: proof.proofType,
          content: proof.content,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 409) {
          // 409 = proof not rejected — shouldn't normally reach here
          throw new Error(err.error || "This proof cannot be resubmitted (not rejected)");
        }
        throw new Error(err.error || `Resubmit failed (${res.status})`);
      }

      const result = await res.json();

      if (!result.resubmitted) {
        // No existing rejected proof found — queue for fresh insert
        freshInserts.push(proof);
      }
      // If resubmitted === true, the server updated the row — no insert needed
    }

    // Insert any proofs that had no prior row
    if (freshInserts.length > 0) {
      const { error } = await supabase
        .from("application_proofs")
        .insert(
          freshInserts.map((proof) => ({
            application_id: applicationId,
            platform: proof.platform,
            proof_type: proof.proofType,
            content: proof.content,
          }))
        );

      if (error) {
        console.error("Supabase insert error (application_proofs):", error);
        throw new Error(error.message || JSON.stringify(error));
      }
    }
  } catch (error) {
    console.error("Error submitting proofs:", error);
    if (error instanceof Error) throw error;
    throw new Error(JSON.stringify(error));
  }
}

export async function getApplicationProofs(applicationId: number) {
  try {
    const { data, error } = await supabase
      .from("application_proofs")
      .select(`
        *,
        proof_status (
          status,
          reviewed_at,
          reviewed_by
        )
      `)
      .eq("application_id", applicationId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting application proofs:", error);
    throw error;
  }
}

export async function getProofImageUrl(filePath: string) {
  try {
    const url = await getStorageUrl("proof-images", filePath);
    return url;
  } catch (error) {
    console.error("Error getting proof image URL:", error);
    throw error;
  }
}