import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const linkId = Number(id);
    if (!linkId) {
      return NextResponse.json({ error: 'Invalid BrandSync ID' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership of the BrandSync Link before deleting it
    const { data: link, error: linkError } = await supabaseAdmin
      .from('brandsync_links')
      .select('user_id, thumbnail_path')
      .eq('id', linkId)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'BrandSync link not found' }, { status: 404 });
    }

    if (link.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this link' }, { status: 403 });
    }

    // Delete thumbnail from storage if it exists
    if (link.thumbnail_path) {
      await supabaseAdmin.storage
        .from('proof-images')
        .remove([link.thumbnail_path]);
    }

    // Delete associated bank transfer slips
    await supabaseAdmin
      .from('bank_transfer_slip')
      .delete()
      .eq('brandsync_id', linkId);

    // Delete associated clicks
    await (supabaseAdmin as any)
      .from('brandsync_clicks')
      .delete()
      .eq('brandsync_id', linkId);

    // Delete associated influencer tokens
    await (supabaseAdmin as any)
      .from('brandsync_influencer_tokens')
      .delete()
      .eq('brandsync_id', linkId);

    // Delete the BrandSync Link itself
    const { error: deleteError } = await supabaseAdmin
      .from('brandsync_links')
      .delete()
      .eq('id', linkId);

    if (deleteError) {
      console.error('Delete BrandSync Link error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete BrandSync link' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('brandsync delete error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
