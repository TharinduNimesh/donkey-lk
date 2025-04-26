interface SendMailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, string>;
  from?: string; // Optional from email address
}

export async function sendMail({ to, subject, template, context, from }: SendMailOptions) {
  try {
    const response = await fetch('/api/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        template,
        context,
        from,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Send mail error:', error);
    throw error;
  }
}