"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLowStockEmail = adminLowStockEmail;
const base_1 = require("./base");
function adminLowStockEmail(data) {
    const storeName = process.env.APP_NAME || 'BadrikiDukan';
    const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    const productsList = data.products.map(product => {
        const productUrl = `${frontendUrl}/admin/products/${product.slug}`;
        return `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 16px 0;">
          <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width: 60%;">
                <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 15px; font-weight: 600;">
                  ${product.name}
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                  Threshold: ${product.threshold} units
                </p>
              </td>
              <td style="width: 20%; text-align: center;">
                ${base_1.emailComponents.badge(`${product.currentStock} left`, product.currentStock === 0 ? 'red' : 'yellow')}
              </td>
              <td style="width: 20%; text-align: right;">
                <a href="${productUrl}" style="color: #ea580c; text-decoration: none; font-size: 14px; font-weight: 500;">
                  View →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    }).join('');
    const content = `
    ${base_1.emailComponents.heading('Low Stock Alert', '⚠️')}
    
    ${base_1.emailComponents.paragraph(`You have ${data.products.length} product${data.products.length > 1 ? 's' : ''} running low on stock. Please restock to avoid lost sales.`)}
    
    ${base_1.emailComponents.divider()}
    
    <table role="presentation" style="width: 100%; margin-bottom: 20px;" cellpadding="0" cellspacing="0">
      ${productsList}
    </table>
    
    ${base_1.emailComponents.divider()}
    
    ${base_1.emailComponents.button('Manage Inventory', `${frontendUrl}/admin`, 'orange')}
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
      <strong>Tip:</strong> Set up automatic restocking reminders in your admin settings to prevent stockouts.
    </p>
  `;
    return {
        subject: `⚠️ Low Stock Alert: ${data.products.length} product${data.products.length > 1 ? 's' : ''} need attention`,
        html: (0, base_1.baseEmailTemplate)({
            title: 'Low Stock Alert',
            preheader: `${data.products.length} products are running low on stock`,
            content
        })
    };
}
