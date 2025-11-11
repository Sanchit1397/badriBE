"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
exports.resetTransporter = resetTransporter;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("./logger");
let cachedTransporter = null;
/**
 * Get email transporter based on EMAIL_PROVIDER environment variable
 * Supports: ethereal (dev), gmail, ses (AWS), sendgrid, smtp (custom)
 */
async function getTransporter() {
    if (cachedTransporter)
        return cachedTransporter;
    const provider = process.env.EMAIL_PROVIDER || 'ethereal';
    logger_1.logger.info({ provider }, 'mail:configuring-transporter');
    switch (provider.toLowerCase()) {
        case 'gmail': {
            if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
                throw new Error('Gmail configuration missing: GMAIL_USER and GMAIL_APP_PASSWORD required');
            }
            cachedTransporter = nodemailer_1.default.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                }
            });
            logger_1.logger.info({ user: process.env.GMAIL_USER }, 'mail:using-gmail');
            break;
        }
        case 'ses': {
            // AWS SES via nodemailer
            if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
                throw new Error('AWS SES configuration missing: AWS credentials required');
            }
            // Note: Requires aws-sdk to be installed for SES
            // For now, use SMTP interface
            cachedTransporter = nodemailer_1.default.createTransport({
                host: `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
                port: 587,
                secure: false,
                auth: {
                    user: process.env.AWS_ACCESS_KEY_ID,
                    pass: process.env.AWS_SECRET_ACCESS_KEY
                }
            });
            logger_1.logger.info({ region: process.env.AWS_REGION }, 'mail:using-aws-ses');
            break;
        }
        case 'sendgrid': {
            if (!process.env.SENDGRID_API_KEY) {
                throw new Error('SendGrid configuration missing: SENDGRID_API_KEY required');
            }
            cachedTransporter = nodemailer_1.default.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false,
                auth: {
                    user: 'apikey',
                    pass: process.env.SENDGRID_API_KEY
                }
            });
            logger_1.logger.info('mail:using-sendgrid');
            break;
        }
        case 'smtp': {
            // Custom SMTP server
            if (!process.env.SMTP_HOST) {
                throw new Error('SMTP configuration missing: SMTP_HOST required');
            }
            cachedTransporter = nodemailer_1.default.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT || 587),
                secure: process.env.SMTP_SECURE === 'true',
                auth: process.env.SMTP_USER && process.env.SMTP_PASS
                    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                    : undefined
            });
            logger_1.logger.info({ host: process.env.SMTP_HOST }, 'mail:using-custom-smtp');
            break;
        }
        case 'ethereal':
        default: {
            // Ethereal for development/testing
            const testAccount = await nodemailer_1.default.createTestAccount();
            cachedTransporter = nodemailer_1.default.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: { user: testAccount.user, pass: testAccount.pass }
            });
            logger_1.logger.info({ user: testAccount.user }, 'mail:using-ethereal');
            break;
        }
    }
    return cachedTransporter;
}
/**
 * Send an email using configured provider
 */
async function sendMail(params) {
    const transporter = await getTransporter();
    const fromAddress = process.env.MAIL_FROM || `${process.env.APP_NAME || 'BadrikiDukan'} <noreply@badrikidukan.com>`;
    const info = await transporter.sendMail({
        from: fromAddress,
        ...params
    });
    // Log preview URL for Ethereal
    const preview = nodemailer_1.default.getTestMessageUrl(info);
    if (preview) {
        logger_1.logger.info({ preview, to: params.to }, 'mail:ethereal-preview');
        console.log('\n📧 Email Preview URL:', preview, '\n');
    }
    else {
        logger_1.logger.info({ to: params.to, messageId: info.messageId }, 'mail:sent');
    }
}
/**
 * Reset transporter cache (useful when switching providers)
 */
function resetTransporter() {
    cachedTransporter = null;
    logger_1.logger.info('mail:transporter-reset');
}
