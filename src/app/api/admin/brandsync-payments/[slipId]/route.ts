import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendMail } from '@/lib/utils/email';
import { Database } from '@/types/database.types';

export async function POST(req: NextRequest, { params }: { params: { slipId: string } }) {
  try {
    const slipId = Number(params.slipId);
    if (!slipId) return NextResponse.json({ error: 'Invalid slip id' }, { status: 400 });

    const body = await req.json();
    const action = body.action as 'accept' | 'reject';
    const reason = body.reason as string | undefined;

    // Fetch slip and brandsync link
    const { data: slip } = await supabaseAdmin
      .from('brandsync_bank_transfer_slips')
      .select('id, brandsync_id, slip_path, status, created_at')
      .eq('id', slipId)
      .single();

    if (!slip) return NextResponse.json({ error: 'Slip not found' }, { status: 404 });

    const { data: link } = await supabaseAdmin
      .from('brandsync_links')
      .select('id, user_id, title, amount')
      .eq('id', slip.brandsync_id)
      .single();

    if (!link) return NextResponse.json({ error: 'BrandSync link not found' }, { status: 404 });

    if (action === 'accept') {
      // mark slip accepted and mark link as paid
      const { error: u1 } = await supabaseAdmin
        .from('brandsync_bank_transfer_slips')
        .update({ status: 'ACCEPTED' })
        .eq('id', slipId);
      if (u1) throw u1;

      const { error: u2 } = await supabaseAdmin
        .from('brandsync_links')
        .update({ is_paid: true })
        .eq('id', link.id);
      if (u2) throw u2;

      // send email to buyer
      const { data: profile } = await supabaseAdmin
        .from('profile')
        .select('email, name')
        .eq('id', link.user_id)
        .single();

      if (profile?.email) {
        await sendMail({
          to: profile.email,
          subject: 'Payment Accepted - BrandSync',
          template: 'payment-accepted',
          context: {
            name: profile.name || 'User',
            taskTitle: link.title || '',
            taskId: String(link.id),
            amount: String(link.amount || 0),
            date: new Date().toISOString().split('T')[0]
          },
          from: 'accounts@brandsync.lk'
        });
      }

      return NextResponse.json({ status: 'ok' });
    } else {
      // reject: mark slip rejected
      const { error } = await supabaseAdmin
        .from('brandsync_bank_transfer_slips')
        .update({ status: 'REJECTED' })
        .eq('id', slipId);
      if (error) throw error;

      // send rejection email
      const { data: profile } = await supabaseAdmin
        .from('profile')
        .select('email, name')
        .eq('id', link.user_id)
        .single();

      if (profile?.email) {
        await sendMail({
          to: profile.email,
          subject: 'Payment Rejected - BrandSync',
          template: 'payment-rejected',
          context: {
            name: profile.name || 'User',
            taskTitle: link.title || '',
            taskId: String(link.id),
            reason: reason || 'REJECTED',
            date: new Date().toISOString().split('T')[0]
          },
          from: 'accounts@brandsync.lk'
        });
      }

      return NextResponse.json({ status: 'ok' });
    }
  } catch (error) {
    console.error('BrandSync admin action error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
