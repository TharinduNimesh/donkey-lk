import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs/promises';
import type { Database } from "@/types/database.types";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

const getTemplate = async (template: string): Promise<string> => {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-templates', `${template}.html`);
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    console.error('Template read error:', error);
    throw error;
  }
}

interface EmailRequest {
  to: string;
  subject: string;
  template: string;
  context: Record<string, string>;
  from?: string;
}

// Verify transporter connection
async function verifyTransporter() {
  try {
    const verify = await transporter.verify();
    console.log('SMTP connection verified:', verify);
    return true;
  } catch (error) {
    console.error('SMTP verification failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user's Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin using RPC function
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_an_admin', {
      user_id_input: user.id
    });

    if (adminError || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Verify SMTP connection
    const isValid = await verifyTransporter();
    if (!isValid) {
      return NextResponse.json(
        { error: "Failed to connect to SMTP server" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { to, subject, template, context, from } = body as EmailRequest;

    if (!to || !subject || !template || !context) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch template
    let html = await getTemplate(template);

    // Replace placeholders with context values
    Object.entries(context).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });

    // Use provided from email or fallback to env defaults
    const fromName = process.env.SMTP_FROM_NAME || 'BrandSync';
    const fromEmail = from || process.env.SMTP_FROM;

    // Send mail
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    if (!info || !info.messageId) {
      throw new Error('No message ID received from SMTP server');
    }

    return NextResponse.json({ messageId: info.messageId });
  } catch (error) {
    console.error('Send mail error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}