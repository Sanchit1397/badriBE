"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderConfirmationEmail = orderConfirmationEmail;
const base_1 = require("./base");
function orderConfirmationEmail(data) {
    const storeName = process.env.APP_NAME || 'BadrikiDukan';
    const estimatedTime = data.estimatedDeliveryTime || '30-45 minutes';
    const content = `
    ${base_1.emailComponents.heading('Order Confirmed!', '🎉')}
    
    ${base_1.emailComponents.paragraph(`Hi ${data.customerName},`)}
    
    ${base_1.emailComponents.paragraph(`Thank you for your order from ${storeName}! We've received your order and will deliver it to you soon.`)}
    
    ${base_1.emailComponents.divider()}
    
    ${base_1.emailComponents.infoBox(`
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</p>
      ${base_1.emailComponents.infoRow('Order ID', `#${data.orderId}`, true)}
      ${base_1.emailComponents.infoRow('Order Date', data.orderDate)}
      ${base_1.emailComponents.infoRow('Payment Method', 'Cash on Delivery (COD)')}
      ${base_1.emailComponents.infoRow('Estimated Delivery', estimatedTime)}
    `)}
    
    ${base_1.emailComponents.divider()}
    
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Order Items</p>
    <table role="presentation" style="width: 100%; margin-bottom: 20px;" cellpadding="0" cellspacing="0">
      ${data.items.map(item => base_1.emailComponents.itemRow(item.name, item.quantity, item.price * item.quantity)).join('')}
      ${base_1.emailComponents.totalRow('Subtotal', data.subtotal)}
      ${base_1.emailComponents.totalRow('Delivery Fee', data.deliveryFee)}
      <tr><td style="padding: 8px 0;"><hr style="border: none; border-top: 2px solid #e5e7eb; margin: 8px 0;"></td></tr>
      ${base_1.emailComponents.totalRow('Total', data.total, true)}
    </table>
    
    ${base_1.emailComponents.divider()}
    
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Delivery Information</p>
    ${base_1.emailComponents.infoRow('Address', data.address.replace(/\n/g, '<br>'))}
    ${base_1.emailComponents.infoRow('Phone', data.phone)}
    
    ${base_1.emailComponents.paragraph(`We'll notify you once your order is on its way. Have your ${data.total.toFixed(2)} rupees ready for cash on delivery.`)}
    
    ${base_1.emailComponents.paragraph('Thank you for shopping with us!')}
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
      Questions about your order? Just reply to this email and we'll be happy to help.
    </p>
  `;
    return {
        subject: `Your order #${data.orderId} has been placed! 🎉`,
        html: (0, base_1.baseEmailTemplate)({
            title: 'Order Confirmation',
            preheader: `Thank you for your order! Order #${data.orderId} - ₹${data.total.toFixed(2)}`,
            content
        })
    };
}
