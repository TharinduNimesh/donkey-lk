import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getTemplate = async (template: string): Promise<string> => {
  const isDev = process.env.NODE_ENV === 'development';
  const baseUrl = isDev ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_APP_URL;
  
  try {
    const response = await fetch(`${baseUrl}/email-templates/${template}.html`);
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Template fetch error:', error);
    throw error;
  }
}

interface SendMailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, string>;
}

export async function sendMail({ to, subject, template, context }: SendMailOptions) {
  try {
    // Fetch template
    let html = await getTemplate(template);

    // Replace placeholders with context values
    Object.entries(context).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    // Send mail
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });

    return info;
  } catch (error) {
    console.error('Send mail error:', error);
    throw error;
  }
}