import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';
import { logger } from './logger';
import type { SendMailParams } from '../mail/types';

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedResend: Resend | null = null;

function getMailFromAddress(): string {
  return process.env.MAIL_FROM || `${process.env.APP_NAME || 'BadrikiDukaan'} <onboarding@resend.dev>`;
}

/**
 * Send email via SendGrid API (uses HTTPS, works on Render free tier)
 * Render blocks SMTP ports 25/465/587 on free tier
 */
function formatSendGridError(err: unknown): string {
  const body = (err as { response?: { body?: unknown } })?.response?.body;
  if (body) return JSON.stringify(body);
  return err instanceof Error ? err.message : String(err);
}

async function sendViaSendGridApi(params: SendMailParams): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SendGrid configuration missing: SENDGRID_API_KEY required');
  sgMail.setApiKey(apiKey);
  const fromAddress = getMailFromAddress();
  try {
    await sgMail.send({
      to: params.to,
      from: fromAddress,
      subject: params.subject,
      html: params.html
    });
  } catch (err) {
    logger.error({ err: formatSendGridError(err), from: fromAddress, to: params.to }, 'mail:sendgrid-failed');
    throw err;
  }
  logger.info({ to: params.to }, 'mail:sent');
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Resend configuration missing: RESEND_API_KEY required');
  if (!cachedResend) cachedResend = new Resend(apiKey);
  return cachedResend;
}

async function sendViaResendApi(params: SendMailParams): Promise<void> {
  const fromAddress = getMailFromAddress();
  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: [params.to],
    subject: params.subject,
    html: params.html
  });
  if (error) {
    logger.error({ err: error, from: fromAddress, to: params.to }, 'mail:resend-failed');
    throw new Error(error.message);
  }
  logger.info({ to: params.to, id: data?.id }, 'mail:sent');
}

/**
 * Warn at startup when production email is misconfigured (Render blocks SMTP; use HTTPS API).
 */
export function validateEmailConfig(): void {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return;

  const provider = (process.env.EMAIL_PROVIDER || 'ethereal').toLowerCase();

  if (provider === 'ethereal') {
    logger.error(
      'mail:config-invalid — EMAIL_PROVIDER is ethereal in production. Set EMAIL_PROVIDER=resend and RESEND_API_KEY on Render.'
    );
    return;
  }

  if (provider === 'resend' && !process.env.RESEND_API_KEY) {
    logger.error('mail:config-invalid — EMAIL_PROVIDER=resend but RESEND_API_KEY is missing.');
    return;
  }

  if (provider === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
    logger.error('mail:config-invalid — EMAIL_PROVIDER=sendgrid but SENDGRID_API_KEY is missing.');
    return;
  }

  if (provider === 'gmail' || provider === 'smtp' || provider === 'ses') {
    logger.warn(
      { provider },
      'mail:config-warning — SMTP-based providers often fail on Render (ports blocked). Prefer EMAIL_PROVIDER=resend or sendgrid.'
    );
  }

  if ((provider === 'resend' || provider === 'sendgrid') && !process.env.MAIL_FROM) {
    logger.warn('mail:config-warning — MAIL_FROM is unset; use a verified sender (Resend domain or onboarding@resend.dev for testing).');
  }
}

/**
 * Get email transporter based on EMAIL_PROVIDER environment variable
 * Supports: ethereal (dev), resend, sendgrid (API), gmail, ses (AWS), smtp (custom)
 */
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) return cachedTransporter;

  const provider = process.env.EMAIL_PROVIDER || 'ethereal';
  logger.info({ provider }, 'mail:configuring-transporter');

  switch (provider.toLowerCase()) {
    case 'gmail': {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error('Gmail configuration missing: GMAIL_USER and GMAIL_APP_PASSWORD required');
      }
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
      logger.info({ user: process.env.GMAIL_USER }, 'mail:using-gmail');
      break;
    }

    case 'ses': {
      // AWS SES via nodemailer
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS SES configuration missing: AWS credentials required');
      }
      // Note: Requires aws-sdk to be installed for SES
      // For now, use SMTP interface
      cachedTransporter = nodemailer.createTransport({
        host: `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: process.env.AWS_ACCESS_KEY_ID,
          pass: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      logger.info({ region: process.env.AWS_REGION }, 'mail:using-aws-ses');
      break;
    }

    case 'smtp': {
      // Custom SMTP server
      if (!process.env.SMTP_HOST) {
        throw new Error('SMTP configuration missing: SMTP_HOST required');
      }
      cachedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined
      });
      logger.info({ host: process.env.SMTP_HOST }, 'mail:using-custom-smtp');
      break;
    }

    case 'ethereal':
    default: {
      // Ethereal for development/testing
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      logger.info({ user: testAccount.user }, 'mail:using-ethereal');
      break;
    }
  }

  return cachedTransporter;
}

/**
 * Send an email using configured provider
 */
export async function sendMail(params: SendMailParams): Promise<void> {
  const provider = (process.env.EMAIL_PROVIDER || 'ethereal').toLowerCase();
  try {
    if (provider === 'resend') {
      await sendViaResendApi(params);
      return;
    }
    if (provider === 'sendgrid') {
      await sendViaSendGridApi(params);
      return;
    }
    const transporter = await getTransporter();

    const fromAddress = getMailFromAddress();

    const info = await transporter.sendMail({
      from: fromAddress,
      ...params
    });

    // Log preview URL for Ethereal
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      logger.info({ preview, to: params.to }, 'mail:ethereal-preview');
      console.log('\n📧 Email Preview URL:', preview, '\n');
    } else {
      logger.info({ to: params.to, messageId: info.messageId }, 'mail:sent');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ provider, to: params.to, err: message }, 'mail:send-failed');
    throw err;
  }
}

/**
 * Reset transporter cache (useful when switching providers)
 */
export function resetTransporter(): void {
  cachedTransporter = null;
  logger.info('mail:transporter-reset');
}


