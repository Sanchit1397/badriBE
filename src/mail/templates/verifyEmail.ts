import type { MailContent } from '../types';

export function buildVerifyEmailTemplate(params: { name: string; link: string }): MailContent {
  const { name, link } = params;
  return {
    subject: 'Verify your email - BadrikiDukan',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto">
        <h2>Hi ${name},</h2>
        <p>Please verify your email by clicking the button below:</p>
        <p>
          <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Verify Email</a>
        </p>
        <p>This link expires in 24 hours.</p>
        <p style="color:#666">If you didn't request this, you can ignore this email.</p>
      </div>
    `
  };
}


