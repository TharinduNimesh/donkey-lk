import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';

export async function uploadTaskContent(file: File) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const { data: { user } } = await supabase.auth.getUser();
    const filePath = `${user?.id}/${fileName}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('task-content')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    return filePath;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function uploadBankTransferSlip(file: File, taskId: number) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const { data: { user } } = await supabase.auth.getUser();
    const filePath = `${user?.id}/${fileName}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('bank-transfer-slips')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Insert slip record into bank_transfer_slip table
    const { error: insertError } = await supabase
      .from('bank_transfer_slip')
      .insert({
        slip: filePath,
        task_id: taskId
      });

    if (insertError) {
      // If insert fails, clean up the uploaded file
      await supabase.storage
        .from('bank-transfer-slips')
        .remove([filePath]);
      throw insertError;
    }

    return filePath;
  } catch (error) {
    console.error('Error uploading bank transfer slip:', error);
    throw error;
  }
}

export async function uploadProofImage(file: File) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const { data: { user } } = await supabase.auth.getUser();
    const filePath = `${user?.id}/${fileName}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('proof-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    return filePath;
  } catch (error) {
    console.error('Error uploading proof image:', error);
    throw error;
  }
}