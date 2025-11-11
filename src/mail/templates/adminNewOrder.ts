import { baseEmailTemplate, emailComponents } from './base';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface AdminNewOrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  items: OrderItem[];
  address: string;
  orderTime: string;
}

export function adminNewOrderEmail(data: AdminNewOrderData): { subject: string; html: string } {
  const storeName = process.env.APP_NAME || 'BadrikiDukan';
  const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const orderUrl = `${frontendUrl}/admin/orders/${data.orderId}`;

  const content = `
    ${emailComponents.heading('New Order Received!', '🔔')}
    
    ${emailComponents.paragraph('A new order has been placed on your store.')}
    
    ${emailComponents.divider()}
    
    ${emailComponents.infoBox(`
      <p style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937; font-weight: 600;">Order Summary</p>
      ${emailComponents.infoRow('Order ID', `#${data.orderId}`, true)}
      ${emailComponents.infoRow('Order Time', data.orderTime)}
      ${emailComponents.infoRow('Total Amount', `₹${data.total.toFixed(2)}`, true)}
      ${emailComponents.infoRow('Payment', 'Cash on Delivery (COD)')}
      ${emailComponents.infoRow('Item Count', `${data.items.reduce((sum, item) => sum + item.quantity, 0)} items`)}
    `)}
    
    ${emailComponents.divider()}
    
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Customer Information</p>
    ${emailComponents.infoRow('Name', data.customerName, true)}
    ${emailComponents.infoRow('Email', data.customerEmail)}
    ${emailComponents.infoRow('Phone', data.customerPhone)}
    
    ${emailComponents.divider()}
    
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Delivery Address</p>
    <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
      ${data.address.replace(/\n/g, '<br>')}
    </p>
    
    ${emailComponents.divider()}
    
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Order Items</p>
    <table role="presentation" style="width: 100%; margin-bottom: 20px;" cellpadding="0" cellspacing="0">
      ${data.items.map(item => emailComponents.itemRow(item.name, item.quantity, item.price * item.quantity)).join('')}
    </table>
    
    ${emailComponents.button('View Order Details', orderUrl, 'orange')}
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Login to your admin panel to manage this order.
    </p>
  `;

  return {
    subject: `🔔 New Order #${data.orderId} - ₹${data.total.toFixed(2)}`,
    html: baseEmailTemplate({
      title: 'New Order Notification',
      preheader: `New order from ${data.customerName} - ₹${data.total.toFixed(2)}`,
      content
    })
  };
}

