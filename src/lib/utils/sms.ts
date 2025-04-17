import axios from 'axios';

const SMS_API_TOKEN = process.env.SMS_API_TOKEN;
const SENDER_ID = process.env.SMS_SENDER_ID;

interface SendSMSParams {
  recipient: string;
  message: string;
  type?: 'plain' | 'unicode';
}

export async function sendSMS({ recipient, message, type = 'plain' }: SendSMSParams) {
  try {
    const response = await axios.post('https://app.text.lk/api/v3/sms/send', {
      recipient,
      sender_id: SENDER_ID,
      type,
      message
    }, {
      headers: {
        'Authorization': `Bearer ${SMS_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return { 
      success: true, 
      data: response.data 
    };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send SMS' 
    };
  }
}

export function generateVerificationCode(length: number = 6): string {
  // Generate a number between 100000 and 999999 (for 6 digits)
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}