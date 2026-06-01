import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/admin/brandsync-payments
 * Returns all BrandSync bank transfer slips with their linked brandsync_links data,
 * statuses, and buyer profiles. Uses supabaseAdmin to bypass RLS.
 */
export async function GET() {
  try {
    // 1. Fetch all bank_transfer_slip rows that have a brandsync_id
    const { data: bsSlips, error: slipErr } = await (supabaseAdmin as any)
      .from('bank_transfer_slip')
      .select('id, slip, created_at, brandsync_id')
      .not('brandsync_id', 'is', null)
      .order('created_at', { ascending: false });

    if (slipErr) {
      console.error('Error fetching BrandSync slips:', slipErr);
      return NextResponse.json({ payments: [] });
    }

    if (!bsSlips || bsSlips.length === 0) {
      return NextResponse.json({ payments: [] });
    }

    // 2. Batch-fetch brandsync_links
    const linkIds = [...new Set(bsSlips.map((s: any) => Number(s.brandsync_id)))];
    const { data: bsLinks } = await (supabaseAdmin as any)
      .from('brandsync_links')
      .select('id, title, amount, user_id, platform, platform_url')
      .in('id', linkIds);

    const linksMap = new Map<number, any>((bsLinks || []).map((l: any) => [Number(l.id), l]));

    // 3. Batch-fetch statuses
    const slipIds = bsSlips.map((s: any) => s.id);
    const { data: statuses } = await (supabaseAdmin as any)
      .from('bank_transfer_status')
      .select('id, status, reviewed_at, reviewed_by, transfer_id')
      .in('transfer_id', slipIds);

    // 4. Collect unique user_ids for buyer profiles
    const userIds = [...new Set(
      bsSlips
        .map((s: any) => linksMap.get(Number(s.brandsync_id))?.user_id)
        .filter(Boolean)
    )] as string[];

    const { data: profiles } = userIds.length
      ? await supabaseAdmin
          .from('profile')
          .select('id, name, email')
          .in('id', userIds)
      : { data: [] };

    const profilesMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

    // 5. Assemble the response
    const payments = bsSlips.map((s: any) => {
      const link = linksMap.get(Number(s.brandsync_id)) || null;
      const status = (statuses || []).find((st: any) => st.transfer_id === s.id) || null;
      const buyer = link?.user_id ? profilesMap.get(link.user_id) || null : null;

      return {
        id: s.id,
        slip: s.slip,
        created_at: s.created_at,
        brandsync_id: s.brandsync_id,
        status,
        brandsync: link,
        buyer,
        task: {
          title: link?.title || 'BrandSync Link',
          description: link ? `${link.platform} • ${link.platform_url}` : null,
        },
        isBrandSync: true,
      };
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Admin BrandSync payments error:', error);
    return NextResponse.json({ payments: [] }, { status: 500 });
  }
}
