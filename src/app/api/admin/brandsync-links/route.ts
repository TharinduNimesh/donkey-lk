import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    // 1. Fetch all brandsync_links that are paid (is_paid = true)
    const { data: links, error: linksErr } = await (supabaseAdmin as any)
      .from('brandsync_links')
      .select('id, title, amount, created_at, user_id, platform, platform_url')
      .eq('is_paid', true)
      .order('created_at', { ascending: false });

    if (linksErr) {
      console.error('Error fetching BrandSync links:', linksErr);
      return NextResponse.json({ links: [] });
    }

    if (!links || links.length === 0) {
      return NextResponse.json({ links: [] });
    }

    // 2. Fetch all bank_transfer_slips with brandsync_id NOT null
    const { data: slips, error: slipsErr } = await (supabaseAdmin as any)
      .from('bank_transfer_slip')
      .select('id, brandsync_id, created_at')
      .not('brandsync_id', 'is', null);

    // 3. Fetch corresponding bank_transfer_status for these slips where status is ACCEPTED
    const acceptedSlipsMap = new Map<number, any>();
    if (slips && slips.length > 0) {
      const slipIds = slips.map((s: any) => s.id);
      const { data: statuses } = await (supabaseAdmin as any)
        .from('bank_transfer_status')
        .select('transfer_id, status, reviewed_at')
        .in('transfer_id', slipIds)
        .eq('status', 'ACCEPTED');

      if (statuses && statuses.length > 0) {
        const acceptedSlipIds = new Set(statuses.map((st: any) => st.transfer_id));
        const acceptedSlips = slips.filter((s: any) => acceptedSlipIds.has(s.id));
        for (const s of acceptedSlips) {
          const status = statuses.find((st: any) => st.transfer_id === s.id);
          acceptedSlipsMap.set(Number(s.brandsync_id), {
            slipId: s.id,
            created_at: s.created_at,
            reviewed_at: status?.reviewed_at || s.created_at,
          });
        }
      }
    }

    // 4. Batch-fetch user profiles
    const userIds = [...new Set(links.map((l: any) => l.user_id))].filter(Boolean) as string[];
    const { data: profiles } = userIds.length
      ? await supabaseAdmin
          .from('profile')
          .select('id, name, email')
          .in('id', userIds)
      : { data: [] };

    const profilesMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

    // 5. Assemble response
    const formattedLinks = links.map((link: any) => {
      const buyer = profilesMap.get(link.user_id) || null;
      const transferInfo = acceptedSlipsMap.get(Number(link.id)) || null;

      return {
        id: link.id,
        title: link.title,
        amount: Number(link.amount),
        created_at: link.created_at,
        user_id: link.user_id,
        platform: link.platform,
        platform_url: link.platform_url,
        buyer,
        paymentMethod: transferInfo ? 'BANK_TRANSFER' : 'PAYMENT_GATEWAY',
        paidAt: transferInfo ? transferInfo.reviewed_at : link.created_at,
      };
    });

    return NextResponse.json({ links: formattedLinks });
  } catch (error) {
    console.error('Admin BrandSync links error:', error);
    return NextResponse.json({ links: [] }, { status: 500 });
  }
}
