import type { MailContent } from '../types';

export function buildResetPasswordTemplate(params: { name: string; link: string }): MailContent {
  const { name, link } = params;
  return {
    subject: 'Reset your password - BadrikiDukan',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto">
        <h2>Hi ${name},</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <p>
          <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset Password</a>
        </p>
        <p>This link expires in 60 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `
  };
}


