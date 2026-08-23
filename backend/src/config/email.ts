import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Configure SMTP if details are provided
const smtpTransport =
  process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS, // Gmail App Password
        },
      })
    : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailParams) => {
  // Fire-and-forget: do not await this in the main request handler
  const from = process.env.EMAIL_FROM || 'Society Tracker <onboarding@resend.dev>';
  
  const triggerEmail = async () => {
    try {
      if (resend) {
        await resend.emails.send({
          from,
          to,
          subject,
          html,
        });
        console.log(`[Email] Sent via Resend to ${to}: "${subject}"`);
      } else if (smtpTransport) {
        await smtpTransport.sendMail({
          from,
          to,
          subject,
          html,
        });
        console.log(`[Email] Sent via Gmail SMTP to ${to}: "${subject}"`);
      } else {
        console.log(`\n--- [MOCK EMAIL] ---`);
        console.log(`From: ${from}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${html.replace(/<[^>]*>/g, ' ')}`);
        console.log(`--------------------\n`);
      }
    } catch (error) {
      console.error('[Email Error] Failed to send email:', error);
    }
  };

  // Run in background (fire-and-forget)
  triggerEmail();
};
