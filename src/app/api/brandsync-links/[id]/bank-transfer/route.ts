import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('slip');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const brandsyncId = Number(id);
    if (!brandsyncId) {
      return NextResponse.json({ error: 'Invalid BrandSync ID' }, { status: 400 });
    }

    // Check existing rejections first
    const { data: slips, error: slipsError } = await supabaseAdmin
      .from('bank_transfer_slip')
      .select(`
        id,
        bank_transfer_status (
          status
        )
      `)
      .eq('brandsync_id', brandsyncId);

    if (!slipsError && slips) {
      const rejectionCount = slips.filter((s: any) => {
        const statusObj = s.bank_transfer_status;
        const statusVal = Array.isArray(statusObj) 
          ? statusObj[0]?.status 
          : statusObj?.status;
        return statusVal === 'REJECTED';
      }).length;

      if (rejectionCount >= 3) {
        return NextResponse.json({ error: 'Upload blocked: This link is locked after 3 rejected attempts. Contact accounts@brandsync.lk.' }, { status: 403 });
      }
    }

    const extension = file.name.split('.').pop() || 'png';
    const filePath = `${bradsyncSafePrefix()}${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('bank-transfer-slips')
      .upload(filePath, file as any, { contentType: file.type });

    if (uploadError) {
      console.error('Bank transfer upload error', uploadError);
      return NextResponse.json({ error: 'Failed to upload slip' }, { status: 500 });
    }

    const { data, error: insertError } = await (supabaseAdmin as any)
      .from('bank_transfer_slip')
      .insert({ brandsync_id: brandsyncId, slip: filePath })
      .select('id, brandsync_id, slip, created_at')
      .single();

    if (insertError) {
      console.error('Failed to insert brandsync bank transfer slip', insertError);
      // cleanup
      await supabaseAdmin.storage.from('bank-transfer-slips').remove([filePath]);
      return NextResponse.json({ error: 'Failed to save slip' }, { status: 500 });
    }

    return NextResponse.json({ slip: data }, { status: 201 });
  } catch (error) {
    console.error('brandsync bank transfer error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

function bradsyncSafePrefix() {
  return 'brandsync_slips/';
}
