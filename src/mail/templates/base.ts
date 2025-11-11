/**
 * Base HTML email template with inline styles
 * Supports all major email clients (Gmail, Outlook, Apple Mail, etc.)
 */

interface BaseTemplateParams {
  title: string;
  preheader?: string;
  content: string;
  storeName?: string;
  storeEmail?: string;
  storePhone?: string;
}

export function baseEmailTemplate(params: BaseTemplateParams): string {
  const storeName = params.storeName || process.env.APP_NAME || 'BadrikiDukan';
  const storeEmail = params.storeEmail || process.env.STORE_EMAIL || 'contact@badrikidukan.com';
  const storePhone = params.storePhone || process.env.STORE_PHONE || '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${params.title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${params.preheader ? `
  <!-- Preheader text (hidden but shows in email preview) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${params.preheader}
  </div>
  ` : ''}
  
  <!-- Email Container -->
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding: 40px 20px;">
        <!-- Main Content Card -->
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" cellpadding="0" cellspacing="0">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 30px 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ${storeName}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${params.content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding-bottom: 15px;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                      <strong style="color: #1f2937;">Need help?</strong><br>
                      ${storeEmail ? `Email: <a href="mailto:${storeEmail}" style="color: #ea580c; text-decoration: none;">${storeEmail}</a><br>` : ''}
                      ${storePhone ? `Phone: <a href="tel:${storePhone}" style="color: #ea580c; text-decoration: none;">${storePhone}</a>` : ''}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                      © ${new Date().getFullYear()} ${storeName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Reusable email components
 */
export const emailComponents = {
  /**
   * Page heading
   */
  heading: (text: string, emoji?: string) => `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600; line-height: 1.3;">
      ${emoji ? `<span style="margin-right: 8px;">${emoji}</span>` : ''}${text}
    </h2>
  `,

  /**
   * Paragraph text
   */
  paragraph: (text: string) => `
    <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      ${text}
    </p>
  `,

  /**
   * Info box (gray background)
   */
  infoBox: (content: string) => `
    <div style="background-color: #f9fafb; border-left: 4px solid #ea580c; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
      ${content}
    </div>
  `,

  /**
   * Call-to-action button
   */
  button: (text: string, url: string, color: 'orange' | 'green' = 'orange') => {
    const bgColor = color === 'orange' ? '#ea580c' : '#15803d';
    const hoverColor = color === 'orange' ? '#c2410c' : '#166534';
    
    return `
    <table role="presentation" style="margin: 24px 0;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align: center;">
          <a href="${url}" style="display: inline-block; background-color: ${bgColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; transition: background-color 0.2s;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `},

  /**
   * Divider line
   */
  divider: () => `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  `,

  /**
   * Key-value pair
   */
  infoRow: (label: string, value: string, bold: boolean = false) => `
    <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
      <span style="color: #6b7280;">${label}:</span>
      <span style="${bold ? 'font-weight: 600; color: #1f2937;' : ''}">${value}</span>
    </p>
  `,

  /**
   * Success badge
   */
  badge: (text: string, color: 'green' | 'blue' | 'orange' | 'red' | 'yellow' = 'green') => {
    const colors = {
      green: { bg: '#d1fae5', text: '#065f46' },
      blue: { bg: '#dbeafe', text: '#1e40af' },
      orange: { bg: '#fed7aa', text: '#9a3412' },
      red: { bg: '#fee2e2', text: '#991b1b' },
      yellow: { bg: '#fef3c7', text: '#92400e' }
    };
    const { bg, text: textColor } = colors[color];
    
    return `
    <span style="display: inline-block; background-color: ${bg}; color: ${textColor}; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600; margin: 8px 0;">
      ${text}
    </span>
  `},

  /**
   * Product/Order item row
   */
  itemRow: (name: string, quantity: number, price: number) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
        <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color: #1f2937; font-size: 15px; font-weight: 500;">
              ${name}
            </td>
            <td style="text-align: right; color: #6b7280; font-size: 14px;">
              ×${quantity}
            </td>
            <td style="text-align: right; color: #15803d; font-size: 15px; font-weight: 600; padding-left: 20px;">
              ₹${price.toFixed(2)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `,

  /**
   * Total row
   */
  totalRow: (label: string, amount: number, bold: boolean = false) => `
    <tr>
      <td style="padding: 8px 0;">
        <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color: ${bold ? '#1f2937' : '#6b7280'}; font-size: ${bold ? '18px' : '15px'}; font-weight: ${bold ? '600' : '400'};">
              ${label}
            </td>
            <td style="text-align: right; color: ${bold ? '#15803d' : '#1f2937'}; font-size: ${bold ? '20px' : '15px'}; font-weight: ${bold ? '700' : '600'};">
              ₹${amount.toFixed(2)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
};

