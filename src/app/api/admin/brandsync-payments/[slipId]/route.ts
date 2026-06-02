import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendMail } from '@/lib/utils/email';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slipId: string }> }) {
  try {
    const { slipId: slipIdParam } = await params;
    const slipId = Number(slipIdParam);
    if (!slipId) return NextResponse.json({ error: 'Invalid slip id' }, { status: 400 });

    const body = await req.json();
    const action = body.action as 'accept' | 'reject';
    const reason = body.reason as string | undefined;

    // Fetch slip and brandsync link
    const { data: slip } = await (supabaseAdmin as any)
      .from('bank_transfer_slip')
      .select('id, brandsync_id, slip, created_at')
      .eq('id', slipId)
      .single();

    if (!slip) return NextResponse.json({ error: 'Slip not found' }, { status: 404 });

    const { data: slipStatus } = await (supabaseAdmin as any)
      .from('bank_transfer_status')
      .select('id, status, reviewed_at, reviewed_by, transfer_id')
      .eq('transfer_id', slipId)
      .single();

    const { data: link } = await supabaseAdmin
      .from('brandsync_links')
      .select('id, user_id, title, amount')
      .eq('id', slip.brandsync_id)
      .single();

    if (!link) return NextResponse.json({ error: 'BrandSync link not found' }, { status: 404 });

    if (action === 'accept') {
      // mark slip accepted and mark link as paid
      if (slipStatus) {
        const { error: u1 } = await (supabaseAdmin as any)
          .from('bank_transfer_status')
          .update({ status: 'ACCEPTED', reviewed_at: new Date().toISOString() })
          .eq('transfer_id', slipId);
        if (u1) throw u1;
      } else {
        const { error: u1 } = await (supabaseAdmin as any)
          .from('bank_transfer_status')
          .insert({ transfer_id: slipId, status: 'ACCEPTED', reviewed_at: new Date().toISOString() });
        if (u1) throw u1;
      }

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

      let emailSent = false;
      let emailError = '';

      if (profile?.email) {
        const origin = new URL(req.url).origin;
        try {
          const mailResp = await fetch(`${origin}/api/mail/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': req.headers.get('cookie') || '',
            },
            body: JSON.stringify({
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
            })
          });
          if (mailResp.ok) {
            emailSent = true;
          } else {
            const errData = await mailResp.json().catch(() => ({}));
            emailError = errData.error || `status ${mailResp.status}`;
          }
        } catch (mailErr: any) {
          console.error('Failed to send payment accepted email:', mailErr);
          emailError = mailErr?.message || 'Network error';
        }
      }

      return NextResponse.json({ status: 'ok', emailSent, emailError });
    } else {
      // reject: mark slip rejected
      if (slipStatus) {
        const { error } = await (supabaseAdmin as any)
          .from('bank_transfer_status')
          .update({ status: 'REJECTED', reviewed_at: new Date().toISOString() })
          .eq('transfer_id', slipId);
        if (error) throw error;
      } else {
        const { error } = await (supabaseAdmin as any)
          .from('bank_transfer_status')
          .insert({ transfer_id: slipId, status: 'REJECTED', reviewed_at: new Date().toISOString() });
        if (error) throw error;
      }

      // send rejection email
      const { data: profile } = await supabaseAdmin
        .from('profile')
        .select('email, name')
        .eq('id', link.user_id)
        .single();

      let emailSent = false;
      let emailError = '';

      if (profile?.email) {
        const origin = new URL(req.url).origin;
        try {
          const mailResp = await fetch(`${origin}/api/mail/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': req.headers.get('cookie') || '',
            },
            body: JSON.stringify({
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
            })
          });
          if (mailResp.ok) {
            emailSent = true;
          } else {
            const errData = await mailResp.json().catch(() => ({}));
            emailError = errData.error || `status ${mailResp.status}`;
          }
        } catch (mailErr: any) {
          console.error('Failed to send payment rejected email:', mailErr);
          emailError = mailErr?.message || 'Network error';
        }
      }

      return NextResponse.json({ status: 'ok', emailSent, emailError });
    }
  } catch (error) {
    console.error('BrandSync admin action error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
