"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderStatusUpdateEmail = orderStatusUpdateEmail;
const base_1 = require("./base");
const statusConfig = {
    confirmed: {
        emoji: '✓',
        color: 'blue',
        title: 'Order Confirmed',
        message: 'Great news! We\'ve confirmed your order and it\'s being prepared for delivery.'
    },
    shipped: {
        emoji: '📦',
        color: 'orange',
        title: 'Order Shipped',
        message: 'Your order is on its way! Our delivery partner will reach you soon.'
    },
    delivered: {
        emoji: '✅',
        color: 'green',
        title: 'Order Delivered',
        message: 'Your order has been delivered successfully! We hope you enjoy your purchase.'
    },
    cancelled: {
        emoji: '❌',
        color: 'red',
        title: 'Order Cancelled',
        message: 'Your order has been cancelled. If you have any questions, please contact us.'
    }
};
function orderStatusUpdateEmail(data) {
    const config = statusConfig[data.status];
    const storeName = process.env.APP_NAME || 'BadrikiDukan';
    let additionalInfo = '';
    if (data.status === 'shipped' && data.address) {
        additionalInfo = base_1.emailComponents.infoBox(`
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Delivery Address</p>
      <p style="margin: 0; color: #1f2937; font-size: 15px;">${data.address.replace(/\n/g, '<br>')}</p>
    `);
    }
    if (data.status === 'delivered') {
        additionalInfo = `
      ${base_1.emailComponents.paragraph('Thank you for shopping with us! We hope to serve you again soon.')}
      ${base_1.emailComponents.paragraph('If you have any feedback or concerns about your order, please don\'t hesitate to contact us.')}
    `;
    }
    if (data.status === 'cancelled') {
        additionalInfo = base_1.emailComponents.paragraph('If this cancellation was unexpected or you need assistance, please reach out to our support team.');
    }
    const content = `
    ${base_1.emailComponents.heading(config.title, config.emoji)}
    
    ${base_1.emailComponents.paragraph(`Hi ${data.customerName},`)}
    
    ${base_1.emailComponents.paragraph(config.message)}
    
    ${base_1.emailComponents.divider()}
    
    ${base_1.emailComponents.infoBox(`
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Order Information</p>
      ${base_1.emailComponents.infoRow('Order ID', `#${data.orderId}`, true)}
      ${base_1.emailComponents.infoRow('Status', base_1.emailComponents.badge(data.status.charAt(0).toUpperCase() + data.status.slice(1), config.color))}
      ${base_1.emailComponents.infoRow('Order Total', `₹${data.total.toFixed(2)}`)}
    `)}
    
    ${additionalInfo}
    
    ${data.status !== 'cancelled' ? base_1.emailComponents.paragraph('Need help? Just reply to this email or call us.') : ''}
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
      Best regards,<br>
      Team ${storeName}
    </p>
  `;
    return {
        subject: `Your order #${data.orderId} has been ${data.status}!`,
        html: (0, base_1.baseEmailTemplate)({
            title: config.title,
            preheader: `${config.message} Order #${data.orderId}`,
            content
        })
    };
}
