import { baseEmailTemplate, emailComponents } from './base';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationData {
  customerName: string;
  orderId: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  phone: string;
  estimatedDeliveryTime?: string;
}

export function orderConfirmationEmail(data: OrderConfirmationData): { subject: string; html: string } {
  const storeName = process.env.APP_NAME || 'BadrikiDukan';
  const estimatedTime = data.estimatedDeliveryTime || '30-45 minutes';

  const content = `
    ${emailComponents.heading('Order Confirmed!', '🎉')}
    
    ${emailComponents.paragraph(`Hi ${data.customerName},`)}
    
    ${emailComponents.paragraph(`Thank you for your order from ${storeName}! We've received your order and will deliver it to you soon.`)}
    
    ${emailComponents.divider()}
    
    ${emailComponents.infoBox(`
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</p>
      ${emailComponents.infoRow('Order ID', `#${data.orderId}`, true)}
      ${emailComponents.infoRow('Order Date', data.orderDate)}
      ${emailComponents.infoRow('Payment Method', 'Cash on Delivery (COD)')}
      ${emailComponents.infoRow('Estimated Delivery', estimatedTime)}
    `)}
    
    ${emailComponents.divider()}
    
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Order Items</p>
    <table role="presentation" style="width: 100%; margin-bottom: 20px;" cellpadding="0" cellspacing="0">
      ${data.items.map(item => emailComponents.itemRow(item.name, item.quantity, item.price * item.quantity)).join('')}
      ${emailComponents.totalRow('Subtotal', data.subtotal)}
      ${emailComponents.totalRow('Delivery Fee', data.deliveryFee)}
      <tr><td style="padding: 8px 0;"><hr style="border: none; border-top: 2px solid #e5e7eb; margin: 8px 0;"></td></tr>
      ${emailComponents.totalRow('Total', data.total, true)}
    </table>
    
    ${emailComponents.divider()}
    
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Delivery Information</p>
    ${emailComponents.infoRow('Address', data.address.replace(/\n/g, '<br>'))}
    ${emailComponents.infoRow('Phone', data.phone)}
    
    ${emailComponents.paragraph(`We'll notify you once your order is on its way. Have your ${data.total.toFixed(2)} rupees ready for cash on delivery.`)}
    
    ${emailComponents.paragraph('Thank you for shopping with us!')}
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
      Questions about your order? Just reply to this email and we'll be happy to help.
    </p>
  `;

  return {
    subject: `Your order #${data.orderId} has been placed! 🎉`,
    html: baseEmailTemplate({
      title: 'Order Confirmation',
      preheader: `Thank you for your order! Order #${data.orderId} - ₹${data.total.toFixed(2)}`,
      content
    })
  };
}

