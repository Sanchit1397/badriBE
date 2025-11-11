"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminNewOrderEmail = adminNewOrderEmail;
const base_1 = require("./base");
function adminNewOrderEmail(data) {
    const storeName = process.env.APP_NAME || 'BadrikiDukan';
    const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    const orderUrl = `${frontendUrl}/admin/orders/${data.orderId}`;
    const content = `
    ${base_1.emailComponents.heading('New Order Received!', '🔔')}
    
    ${base_1.emailComponents.paragraph('A new order has been placed on your store.')}
    
    ${base_1.emailComponents.divider()}
    
    ${base_1.emailComponents.infoBox(`
      <p style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937; font-weight: 600;">Order Summary</p>
      ${base_1.emailComponents.infoRow('Order ID', `#${data.orderId}`, true)}
      ${base_1.emailComponents.infoRow('Order Time', data.orderTime)}
      ${base_1.emailComponents.infoRow('Total Amount', `₹${data.total.toFixed(2)}`, true)}
      ${base_1.emailComponents.infoRow('Payment', 'Cash on Delivery (COD)')}
      ${base_1.emailComponents.infoRow('Item Count', `${data.items.reduce((sum, item) => sum + item.quantity, 0)} items`)}
    `)}
    
    ${base_1.emailComponents.divider()}
    
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Customer Information</p>
    ${base_1.emailComponents.infoRow('Name', data.customerName, true)}
    ${base_1.emailComponents.infoRow('Email', data.customerEmail)}
    ${base_1.emailComponents.infoRow('Phone', data.customerPhone)}
    
    ${base_1.emailComponents.divider()}
    
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Delivery Address</p>
    <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
      ${data.address.replace(/\n/g, '<br>')}
    </p>
    
    ${base_1.emailComponents.divider()}
    
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Order Items</p>
    <table role="presentation" style="width: 100%; margin-bottom: 20px;" cellpadding="0" cellspacing="0">
      ${data.items.map(item => base_1.emailComponents.itemRow(item.name, item.quantity, item.price * item.quantity)).join('')}
    </table>
    
    ${base_1.emailComponents.button('View Order Details', orderUrl, 'orange')}
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Login to your admin panel to manage this order.
    </p>
  `;
    return {
        subject: `🔔 New Order #${data.orderId} - ₹${data.total.toFixed(2)}`,
        html: (0, base_1.baseEmailTemplate)({
            title: 'New Order Notification',
            preheader: `New order from ${data.customerName} - ₹${data.total.toFixed(2)}`,
            content
        })
    };
}
